import { useState, useEffect } from 'react';
import { sendPreviewRequest } from '../utils/claudeApi';

const BEHAVIOURAL_TAGS = [
  'Defensive',
  'Avoidant',
  'Emotional',
  'Over-agreeable',
  'Passive-aggressive',
  'Resistant but reasonable',
];

const EMOTIONAL_OPTIONS = [
  { value: 'calm', emoji: '😐', label: 'Calm' },
  { value: 'tense', emoji: '😟', label: 'Tense' },
  { value: 'uncertain', emoji: '😕', label: 'Uncertain' },
];

const DIFFICULTY_OPTIONS = [
  {
    value: 'coachable',
    label: 'Coachable',
    desc: 'Open to dialogue, yields with the right approach',
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
  },
  {
    value: 'resistant',
    label: 'Resistant',
    desc: 'Pushes back, needs persistence and skill',
    dot: 'bg-amber',
    badge: 'bg-amber/20 text-amber',
  },
  {
    value: 'entrenched',
    label: 'Entrenched',
    desc: 'Digs in, emotionally charged, hard to move',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-600',
  },
];

function buildPreviewPrompt(persona) {
  return `You are helping a facilitator design a realistic role-play persona for a leadership training workshop.

Based on the following persona details, write a 2–3 sentence character sketch that describes:
- Who this person is and how they are likely to behave at the start of the conversation
- What emotional undercurrent is driving their behaviour
- What it will take for the manager to make progress with them

Write in third person, present tense. Be vivid and specific. No bullet points.

Persona details:
Name: ${persona.name}
Role: ${persona.role}
Behavioural style: ${(persona.behaviouralTags || []).join(', ')}${persona.behaviouralNote ? ` — ${persona.behaviouralNote}` : ''}
Emotional state: ${persona.emotionalState}
Difficulty: ${persona.difficultyLevel}
Situation: ${persona.situationWhat}
History: ${persona.situationHistory || 'None'}
Employee's perspective: ${persona.situationEmployeePOV}`;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1" data-field-error="true">{msg}</p>;
}

export default function PersonaCard({ persona, index, onUpdate, onRemove, apiKey, errors = {} }) {
  const [expanded, setExpanded] = useState(index === 0);
  const [previewing, setPreviewing] = useState(false);

  // Auto-expand if this card has errors
  useEffect(() => {
    if (Object.values(errors).some(Boolean)) {
      setExpanded(true);
    }
  }, [errors]);

  const update = (field, value) => onUpdate(index, field, value);

  const toggleTag = (tag) => {
    const current = persona.behaviouralTags || [];
    if (current.includes(tag)) {
      update('behaviouralTags', current.filter(t => t !== tag));
    } else if (current.length < 2) {
      update('behaviouralTags', [...current, tag]);
    }
  };

  const handlePreview = async () => {
    if (!apiKey) return;
    setPreviewing(true);
    try {
      const prompt = buildPreviewPrompt(persona);
      const result = await sendPreviewRequest(prompt, apiKey);
      update('previewSummary', result);
    } catch {
      update('previewSummary', 'Preview failed. Please check your API key and try again.');
    } finally {
      setPreviewing(false);
    }
  };

  const diffConf = DIFFICULTY_OPTIONS.find(d => d.value === persona.difficultyLevel);
  const hasErrors = Object.values(errors).some(Boolean);
  const canPreview = !!(
    apiKey &&
    persona.name &&
    persona.role &&
    persona.behaviouralTags?.length &&
    persona.emotionalState &&
    persona.difficultyLevel &&
    persona.situationWhat &&
    persona.situationEmployeePOV
  );

  return (
    <div className={`border-2 rounded-2xl overflow-hidden bg-white transition-all ${hasErrors ? 'border-red-300' : 'border-navy/10'}`}>
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-navy/3 transition-colors text-left"
      >
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
            hasErrors ? 'bg-red-100 text-red-500' : expanded ? 'bg-navy text-white' : 'bg-navy/10 text-navy'
          }`}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-navy font-semibold text-sm truncate">
            {persona.name?.trim() || (
              <span className="text-navy/30 italic">Persona {index + 1} — Not yet configured</span>
            )}
          </p>
          {persona.role && <p className="text-navy/50 text-xs truncate">{persona.role}</p>}
        </div>
        {hasErrors && (
          <span className="text-red-400 text-[10px] font-semibold shrink-0 hidden sm:inline">
            Incomplete
          </span>
        )}
        <div className="hidden sm:flex gap-1 flex-wrap justify-end max-w-[180px]">
          {(persona.behaviouralTags || []).map(tag => (
            <span key={tag} className="text-[10px] bg-navy/8 text-navy/60 px-2 py-0.5 rounded-full whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
        {diffConf && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${diffConf.badge}`}>
            {diffConf.label}
          </span>
        )}
        <span className="text-navy/30 text-xs ml-1 shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t-2 border-navy/8 px-4 pb-5 pt-4 space-y-6">

          {index > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => onRemove(index)}
                className="text-red-400 hover:text-red-600 text-xs font-semibold transition"
              >
                ✕ Remove this persona
              </button>
            </div>
          )}

          {/* ── Section A: Who Is This Person? ── */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-bold text-amber uppercase tracking-wider border-b border-amber/20 pb-1">
              A — Who Is This Person?
            </h3>

            {/* Name + Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-navy/60 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={persona.name || ''}
                  onChange={e => update('name', e.target.value)}
                  placeholder="e.g. Alex Tan"
                  className={`w-full border rounded-xl px-3 py-2.5 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-amber/40 ${
                    errors.name ? 'border-red-400 bg-red-50/50' : 'border-navy/20'
                  }`}
                />
                <FieldError msg={errors.name} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy/60 mb-1.5">Job Title & Team *</label>
                <input
                  type="text"
                  value={persona.role || ''}
                  onChange={e => update('role', e.target.value)}
                  placeholder="e.g. Senior Executive, Sales Team"
                  className={`w-full border rounded-xl px-3 py-2.5 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-amber/40 ${
                    errors.role ? 'border-red-400 bg-red-50/50' : 'border-navy/20'
                  }`}
                />
                <FieldError msg={errors.role} />
              </div>
            </div>

            {/* Behavioural Tags */}
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-0.5">
                How does this person behave under pressure? *
              </label>
              <p className="text-[11px] text-navy/40 mb-2">Select up to 2</p>
              <div className="flex flex-wrap gap-2">
                {BEHAVIOURAL_TAGS.map(tag => {
                  const selected = (persona.behaviouralTags || []).includes(tag);
                  const maxed = (persona.behaviouralTags || []).length >= 2 && !selected;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => !maxed && toggleTag(tag)}
                      disabled={maxed}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-navy text-white shadow-sm'
                          : maxed
                          ? 'bg-navy/5 text-navy/25 cursor-not-allowed'
                          : 'bg-navy/8 text-navy/70 hover:bg-navy/15'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <FieldError msg={errors.behaviouralTags} />
            </div>

            {/* Behavioural Note */}
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1.5">
                Anything specific about how this person communicates?{' '}
                <span className="text-navy/40 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={persona.behaviouralNote || ''}
                  onChange={e => update('behaviouralNote', e.target.value.slice(0, 100))}
                  placeholder="e.g. deflects with humour, goes quiet when challenged"
                  className="w-full border border-navy/20 rounded-xl px-3 py-2.5 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-amber/40 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-navy/30">
                  {(persona.behaviouralNote || '').length}/100
                </span>
              </div>
            </div>

            {/* Emotional State */}
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-2">
                Emotional state as the conversation begins *
              </label>
              <div className="flex gap-2">
                {EMOTIONAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('emotionalState', opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                      persona.emotionalState === opt.value
                        ? 'border-navy bg-navy text-white'
                        : errors.emotionalState
                        ? 'border-red-300 text-navy/60 bg-red-50/30'
                        : 'border-navy/15 text-navy/60 hover:border-navy/30 bg-white'
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              <FieldError msg={errors.emotionalState} />
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-2">
                How challenging is this persona to manage? *
              </label>
              <div className="space-y-2">
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('difficultyLevel', opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      persona.difficultyLevel === opt.value
                        ? 'border-navy bg-navy/5'
                        : errors.difficultyLevel
                        ? 'border-red-200 hover:border-red-300 bg-white'
                        : 'border-navy/10 hover:border-navy/25 bg-white'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full shrink-0 ${opt.dot}`} />
                    <div className="flex-1">
                      <p className="text-navy font-semibold text-sm">{opt.label}</p>
                      <p className="text-navy/50 text-xs">{opt.desc}</p>
                    </div>
                    {persona.difficultyLevel === opt.value && (
                      <span className="text-navy font-bold text-sm shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <FieldError msg={errors.difficultyLevel} />
            </div>
          </section>

          {/* ── Section B: The Situation ── */}
          <section className="space-y-4">
            <div>
              <h3 className="text-[11px] font-bold text-amber uppercase tracking-wider border-b border-amber/20 pb-1">
                B — The Situation
              </h3>
              <p className="text-[11px] text-navy/50 mt-1.5 italic">
                Break down the scenario from three angles. This gives the AI persona enough context to respond realistically.
              </p>
            </div>

            {/* What Happened */}
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-0.5">
                What is the specific performance or behaviour issue? *
              </label>
              <p className="text-[11px] text-navy/40 mb-1.5">
                1–2 sentences. Be specific — name the behaviour, not just the outcome.
              </p>
              <div className="relative">
                <textarea
                  value={persona.situationWhat || ''}
                  onChange={e => update('situationWhat', e.target.value.slice(0, 250))}
                  placeholder="e.g. Alex has missed two consecutive project deadlines without flagging the delays in advance."
                  rows={3}
                  className={`w-full border rounded-xl px-3 py-2.5 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-amber/40 resize-none ${
                    errors.situationWhat ? 'border-red-400 bg-red-50/50' : 'border-navy/20'
                  }`}
                />
                <span className="absolute right-3 bottom-2 text-[10px] text-navy/30">
                  {(persona.situationWhat || '').length}/250
                </span>
              </div>
              <FieldError msg={errors.situationWhat} />
            </div>

            {/* Prior History */}
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-0.5">
                Has anything been said or done about this before?{' '}
                <span className="text-navy/40 font-normal">(optional)</span>
              </label>
              <p className="text-[11px] text-navy/40 mb-1.5">Leave blank if this is the first conversation.</p>
              <div className="relative">
                <textarea
                  value={persona.situationHistory || ''}
                  onChange={e => update('situationHistory', e.target.value.slice(0, 200))}
                  placeholder="e.g. This was raised informally three weeks ago. Alex acknowledged it but no improvement has followed."
                  rows={2}
                  className="w-full border border-navy/20 rounded-xl px-3 py-2.5 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-amber/40 resize-none"
                />
                <span className="absolute right-3 bottom-2 text-[10px] text-navy/30">
                  {(persona.situationHistory || '').length}/200
                </span>
              </div>
            </div>

            {/* Employee POV */}
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-0.5">
                How does this person likely see or feel about the situation going in? *
              </label>
              <p className="text-[11px] text-navy/40 mb-1.5">
                1 sentence. Write from their point of view — this shapes how the AI responds early in the conversation.
              </p>
              <div className="relative">
                <textarea
                  value={persona.situationEmployeePOV || ''}
                  onChange={e => update('situationEmployeePOV', e.target.value.slice(0, 200))}
                  placeholder="e.g. Alex believes the delays were caused by unclear briefs from other teams and does not feel fully responsible."
                  rows={2}
                  className={`w-full border rounded-xl px-3 py-2.5 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-amber/40 resize-none ${
                    errors.situationEmployeePOV ? 'border-red-400 bg-red-50/50' : 'border-navy/20'
                  }`}
                />
                <span className="absolute right-3 bottom-2 text-[10px] text-navy/30">
                  {(persona.situationEmployeePOV || '').length}/200
                </span>
              </div>
              <FieldError msg={errors.situationEmployeePOV} />
            </div>
          </section>

          {/* ── Section C: Preview ── */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold text-amber uppercase tracking-wider border-b border-amber/20 pb-1">
              C — Preview
            </h3>
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing || !canPreview}
              className="w-full bg-navy/6 hover:bg-navy/12 text-navy font-semibold text-sm py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-navy/10"
            >
              {previewing ? (
                <>
                  <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  Generating character sketch...
                </>
              ) : (
                '✦ Preview This Persona'
              )}
            </button>
            {!canPreview && !previewing && (
              <p className="text-[11px] text-navy/40 text-center">
                Complete all required fields above to enable preview.
              </p>
            )}
            {persona.previewSummary && (
              <div className="bg-amber/6 border border-amber/25 rounded-xl p-4">
                <p className="text-[11px] font-bold text-amber uppercase tracking-wider mb-2">AI Character Sketch</p>
                <p className="text-navy/80 text-sm leading-relaxed italic">{persona.previewSummary}</p>
                <p className="text-[10px] text-navy/40 mt-2">
                  This is a guide to help you sense-check the persona before participants use it.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
