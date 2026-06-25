import { useState, useMemo } from 'react';
import { useSession } from '../context/SessionContext';
import ScoreCard from './ScoreCard';

export default function DebriefScreen() {
  const {
    debriefData,
    sessionConfig,
    selectedPersona,
    conversationHistory,
    participantName,
    selfRating,
    resetConversation,
    newPersona,
  } = useSession();

  const [showTranscript, setShowTranscript] = useState(false);

  const effectiveConfig = useMemo(() => ({
    ...sessionConfig,
    ...(selectedPersona ?? sessionConfig?.personas?.[0] ?? {}),
  }), [sessionConfig, selectedPersona]);

  if (!debriefData) return null;

  const { ratings, whatWentWell, whatToImprove, highlightQuote } = debriefData;

  const avgScore = Math.round(
    (ratings.frameworkApplication.score +
      ratings.conversationTechnique.score +
      ratings.achievementOfEndInMind.score) / 3
  );

  const hasMultiplePersonas = sessionConfig?.personas?.length > 1;

  return (
    <div className="min-h-screen bg-navy pb-16">
      <header className="bg-navy border-b border-white/10 px-5 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-0.5">
              <img src="/enablerz-logo.png" alt="Enablerz" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-heading text-xl text-white font-bold">Your Debrief</h1>
              <p className="text-white/40 text-xs mt-0.5">
                {participantName || 'Participant'} · {effectiveConfig?.name || effectiveConfig?.personaName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[11px] uppercase tracking-wider">Overall</p>
            <p className="font-heading text-3xl text-amber font-bold leading-none">
              {avgScore}<span className="text-base font-sans font-normal text-white/30">/5</span>
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 py-6 space-y-5">

        {/* Scores */}
        <section>
          <h2 className="font-heading text-base text-white font-semibold mb-3">Performance Ratings</h2>
          <div className="space-y-3">

            {/* Self-rating */}
            {selfRating != null && (
              <div className="bg-white/8 border border-white/15 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-white text-sm">Your Self-Rating</p>
                    <p className="text-white/35 text-xs mt-0.5">Your own assessment before seeing results</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0 mt-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <svg key={i} className={`w-4 h-4 ${i <= selfRating ? 'text-amber' : 'text-white/15'}`} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="font-heading font-bold text-3xl text-amber">
                  {selfRating}<span className="text-base font-sans font-normal text-white/30">/5</span>
                </p>
              </div>
            )}

            <ScoreCard label="Framework Application" score={ratings.frameworkApplication.score} rationale={ratings.frameworkApplication.rationale} />
            <ScoreCard label="Conversation Technique" score={ratings.conversationTechnique.score} rationale={ratings.conversationTechnique.rationale} />
            <ScoreCard label="Achievement of End-in-Mind" score={ratings.achievementOfEndInMind.score} rationale={ratings.achievementOfEndInMind.rationale} />
          </div>
        </section>

        {/* What Went Well */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-heading text-base text-navy font-bold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">✓</span>
            What Went Well
          </h2>
          <ul className="space-y-3">
            {whatWentWell.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-navy/80 leading-relaxed">
                <span className="text-green-500 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What to Improve */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-heading text-base text-navy font-bold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-amber/20 text-amber rounded-full flex items-center justify-center text-sm font-bold shrink-0">↗</span>
            What to Improve
          </h2>
          <ul className="space-y-3">
            {whatToImprove.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-navy/80 leading-relaxed">
                <span className="text-amber font-bold shrink-0 mt-0.5">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Highlight Quote */}
        {highlightQuote?.quote && (
          <section className="bg-navy border border-amber/25 rounded-2xl p-5">
            <h2 className="font-heading text-base text-white font-bold mb-3">Highlight Moment</h2>
            <blockquote className="border-l-[3px] border-amber pl-4 mb-3">
              <p className="text-amber text-sm italic leading-relaxed">"{highlightQuote.quote}"</p>
            </blockquote>
            <p className="text-white/60 text-sm leading-relaxed">{highlightQuote.explanation}</p>
          </section>
        )}

        {/* Transcript */}
        <section className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowTranscript(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-navy/5 transition-colors"
          >
            <span className="font-heading text-navy font-semibold text-sm">Full Conversation Transcript</span>
            <span className="text-navy/40 text-xs">{showTranscript ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showTranscript && (
            <div className="px-5 pb-5 space-y-3 border-t border-navy/10 pt-4">
              {conversationHistory.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={i} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`max-w-[80%] text-xs px-4 py-2.5 rounded-xl leading-relaxed ${
                      isUser ? 'bg-amber/10 text-navy' : 'bg-navy/5 text-navy'
                    }`}>
                      <p className="font-semibold text-[11px] mb-1 text-navy/50">
                        {isUser ? (participantName || 'Manager') : (effectiveConfig?.name || effectiveConfig?.personaName)}
                      </p>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={resetConversation}
            className="flex-1 bg-amber text-navy font-bold py-4 rounded-2xl text-sm hover:bg-amber/90 active:scale-[0.98] transition-all shadow-md shadow-amber/20"
          >
            Try Again
          </button>
          <button
            onClick={() => newPersona()}
            className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-2xl text-sm hover:bg-white/20 active:scale-[0.98] transition-all"
          >
            {hasMultiplePersonas ? 'Choose Persona' : 'New Attempt'}
          </button>
        </div>
      </div>
    </div>
  );
}
