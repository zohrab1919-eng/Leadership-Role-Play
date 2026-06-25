import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from '../context/SessionContext';
import ChatBubble from './ChatBubble';
import { buildSystemPrompt } from '../utils/buildSystemPrompt';
import { buildDebriefPrompt } from '../utils/buildDebriefPrompt';
import { sendMessage, requestDebrief } from '../utils/claudeApi';

export default function ConversationScreen() {
  const {
    sessionConfig,
    selectedPersona,
    participantName,
    conversationHistory, setConversationHistory,
    setCurrentScreen,
    setDebriefData,
    turnCount, setTurnCount,
    setSelfRating,
    apiKey,
  } = useSession();

  // Merge shared session fields with the selected persona's fields
  const effectiveConfig = useMemo(() => ({
    ...sessionConfig,
    ...(selectedPersona ?? sessionConfig?.personas?.[0] ?? {}),
  }), [sessionConfig, selectedPersona]);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [debriefing, setDebriefing] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [error, setError] = useState('');

  const STAR_LABELS = { 1: 'Needs a lot of work', 2: 'Could do better', 3: 'Decent attempt', 4: 'Good effort', 5: 'Nailed it!' };
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const pendingHistoryRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, sending]);

  const triggerDebrief = async (history) => {
    setDebriefing(true);
    try {
      const prompt = buildDebriefPrompt(effectiveConfig, history, participantName);
      const raw = await requestDebrief(prompt, apiKey);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse debrief response.');
      const debrief = JSON.parse(match[0]);
      setDebriefData(debrief);
      setCurrentScreen('debrief');
    } catch (err) {
      setError('Debrief failed: ' + err.message);
      setDebriefing(false);
    }
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || sending) return;

    setError('');
    const systemPrompt = buildSystemPrompt(effectiveConfig);
    const nextHistory = [...conversationHistory, { role: 'user', content: msg }];
    setConversationHistory(nextHistory);
    setInput('');
    setSending(true);

    try {
      const reply = await sendMessage(systemPrompt, conversationHistory, msg, apiKey);
      const finalHistory = [...nextHistory, { role: 'assistant', content: reply }];
      setConversationHistory(finalHistory);
      const newTurn = turnCount + 1;
      setTurnCount(newTurn);
      if (newTurn >= effectiveConfig.turnLimit) {
        pendingHistoryRef.current = finalHistory;
        setLimitReached(true);
      }
    } catch (err) {
      setError(err.message);
      setConversationHistory(conversationHistory);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndSession = () => {
    if (conversationHistory.length === 0 || sending || debriefing || limitReached) return;
    pendingHistoryRef.current = conversationHistory;
    setLimitReached(true);
  };

  const handleGenerateDebrief = () => {
    setSelfRating(starRating);
    triggerDebrief(pendingHistoryRef.current);
  };

  if (debriefing) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-5">
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 border-4 border-amber border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <h2 className="font-heading text-2xl text-white font-bold mb-2">Generating your debrief…</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Reviewing the conversation and preparing your personalised feedback.
          </p>
        </div>
      </div>
    );
  }

  const turnsLeft = effectiveConfig.turnLimit - turnCount;
  const nearLimit = turnsLeft <= 3 && turnsLeft > 0;

  return (
    <div className="h-screen bg-navy flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-navy border-b border-white/10 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden p-0.5">
            <img src="/enablerz-logo.png" alt="Enablerz" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {effectiveConfig?.name || effectiveConfig?.personaName}
            </p>
            <p className="text-white/40 text-xs truncate">
              {effectiveConfig?.role || effectiveConfig?.personaRole}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            nearLimit ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/50'
          }`}>
            {turnCount}/{effectiveConfig?.turnLimit}
          </span>
          <button
            onClick={handleEndSession}
            disabled={conversationHistory.length === 0 || sending || limitReached}
            className="bg-amber text-navy font-bold text-xs px-3 py-2 rounded-xl hover:bg-amber/90 active:scale-95 transition-all disabled:opacity-40"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {conversationHistory.length === 0 && (
          <div className="text-center py-16 px-4">
            <p className="text-white/40 text-sm mb-1">You are the manager.</p>
            <p className="text-white/25 text-xs">Type your opening message to begin.</p>
          </div>
        )}

        {conversationHistory.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            name={msg.role === 'user' ? (participantName || 'You') : (effectiveConfig?.name || effectiveConfig?.personaName)}
          />
        ))}

        {sending && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(effectiveConfig?.name || effectiveConfig?.personaName)?.[0]}
            </div>
            <div className="bg-white/10 rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-sm rounded-xl px-4 py-3 text-center">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline text-xs">Dismiss</button>
          </div>
        )}

        {nearLimit && !limitReached && (
          <div className="bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs rounded-xl px-4 py-2.5 text-center">
            {turnsLeft} turn{turnsLeft !== 1 ? 's' : ''} remaining — consider wrapping up or clicking End Session.
          </div>
        )}

        {limitReached && (
          <div className="bg-amber/15 border border-amber/30 rounded-2xl px-4 py-5 space-y-4">
            <div className="text-center">
              <p className="text-amber text-sm font-semibold">Session complete</p>
              <p className="text-white/45 text-xs mt-0.5">Take a moment to reflect before your debrief.</p>
            </div>

            <div className="text-center">
              <p className="text-white/60 text-xs mb-3">How do you think you performed?</p>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onClick={() => setStarRating(i)}
                    className="p-1.5 transition-transform active:scale-90"
                    aria-label={`${i} star${i > 1 ? 's' : ''}`}
                  >
                    <svg
                      className={`w-9 h-9 transition-colors ${i <= starRating ? 'text-amber' : 'text-white/20'}`}
                      viewBox="0 0 24 24" fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-white/35 text-xs mt-2 h-4">
                {starRating > 0 ? STAR_LABELS[starRating] : ''}
              </p>
            </div>

            <button
              onClick={handleGenerateDebrief}
              disabled={starRating === 0}
              className="bg-amber text-navy font-bold text-sm py-3 rounded-xl hover:bg-amber/90 active:scale-95 transition-all w-full disabled:opacity-35"
            >
              Generate My Debrief
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-navy border-t border-white/10 px-3 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message… (Enter to send)"
            rows={2}
            disabled={sending || limitReached}
            className="flex-1 bg-white/10 text-white placeholder:text-white/25 border border-white/15 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber/40 disabled:opacity-50 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || limitReached}
            className="bg-amber text-navy p-3 rounded-2xl hover:bg-amber/90 active:scale-95 transition-all disabled:opacity-40 shrink-0 mb-px"
            aria-label="Send"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
