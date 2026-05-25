import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import PersonaCard from './PersonaCard';

const DEFAULT_PERSONA = {
  id: '',
  name: '',
  role: '',
  behaviouralTags: [],
  behaviouralNote: '',
  emotionalState: '',
  difficultyLevel: '',
  situationWhat: '',
  situationHistory: '',
  situationEmployeePOV: '',
  previewSummary: '',
};

const DEFAULTS = {
  topic: '',
  framework: '',
  frameworkSteps: '',
  backgroundContext: '',
  endInMind: '',
  turnLimit: 10,
  personaAssignment: 'facilitator',
  personas: [{ ...DEFAULT_PERSONA, id: 'persona_1' }],
};

function encodeConfig(config) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(config))));
}

function validateConfig(config) {
  const shared = {};
  const personas = config.personas.map(() => ({}));

  if (!config.framework.trim()) shared.framework = 'Required';
  if (!config.frameworkSteps.trim()) shared.frameworkSteps = 'Required';
  if (!config.endInMind.trim()) shared.endInMind = 'Required';

  config.personas.forEach((p, i) => {
    if (!p.name?.trim()) personas[i].name = 'Required';
    if (!p.role?.trim()) personas[i].role = 'Required';
    if (!p.behaviouralTags?.length) personas[i].behaviouralTags = 'Select at least 1';
    if (!p.emotionalState) personas[i].emotionalState = 'Required';
    if (!p.difficultyLevel) personas[i].difficultyLevel = 'Required';
    if (!p.situationWhat?.trim()) personas[i].situationWhat = 'Required';
    if (!p.situationEmployeePOV?.trim()) personas[i].situationEmployeePOV = 'Required';
  });

  const hasSharedErrors = Object.keys(shared).length > 0;
  const hasPersonaErrors = personas.some(p => Object.keys(p).length > 0);

  return { shared, personas, hasErrors: hasSharedErrors || hasPersonaErrors };
}

export default function FacilitatorSetup() {
  const { apiKey, setApiKey, setSessionConfig } = useSession();
  const [config, setConfig] = useState(DEFAULTS);
  const [launched, setLaunched] = useState(false);
  const [sessionUrl, setSessionUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ shared: {}, personas: [{}] });

  const setShared = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    if (fieldErrors.shared[field]) {
      setFieldErrors(prev => ({ ...prev, shared: { ...prev.shared, [field]: undefined } }));
    }
  };

  const handlePersonaUpdate = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      personas: prev.personas.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
    if (fieldErrors.personas[index]?.[field]) {
      setFieldErrors(prev => {
        const updated = [...prev.personas];
        updated[index] = { ...updated[index], [field]: undefined };
        return { ...prev, personas: updated };
      });
    }
  };

  const addPersona = () => {
    if (config.personas.length >= 4) return;
    const nextId = `persona_${config.personas.length + 1}`;
    setConfig(prev => ({
      ...prev,
      personas: [...prev.personas, { ...DEFAULT_PERSONA, id: nextId }],
    }));
    setFieldErrors(prev => ({ ...prev, personas: [...prev.personas, {}] }));
  };

  const removePersona = (index) => {
    setConfig(prev => ({
      ...prev,
      personas: prev.personas.filter((_, i) => i !== index),
    }));
    setFieldErrors(prev => ({
      ...prev,
      personas: prev.personas.filter((_, i) => i !== index),
    }));
  };

  const handleLaunch = () => {
    const validation = validateConfig(config);
    if (validation.hasErrors) {
      setFieldErrors({ shared: validation.shared, personas: validation.personas });
      setTimeout(() => {
        const firstError = document.querySelector('[data-field-error="true"]');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
      return;
    }
    const encoded = encodeConfig(config);
    const url = `${window.location.origin}/?s=${encoded}`;
    setSessionUrl(url);
    setSessionConfig(config);
    setLaunched(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const hasAnyErrors =
    Object.values(fieldErrors.shared || {}).some(Boolean) ||
    (fieldErrors.personas || []).some(p => Object.values(p || {}).some(Boolean));

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur border-b border-white/10 px-5 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-0.5">
              <img src="/enablerz-logo.png" alt="Enablerz" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-heading text-lg text-white font-bold leading-tight">Leadership Role-Play</h1>
              <p className="text-white/50 text-xs">Facilitator Setup</p>
            </div>
          </div>
          <span className="bg-amber/20 text-amber text-[11px] font-bold px-3 py-1 rounded-full tracking-wider shrink-0">
            FACILITATOR
          </span>
        </div>
      </header>

      {/* Launch Banner */}
      {launched && (
        <div className="bg-green-600/20 border-b border-green-500/30 px-5 py-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-green-400 font-semibold text-sm mb-1">
              Session launched — {config.personas.length} persona{config.personas.length > 1 ? 's' : ''} configured
            </p>
            <p className="text-white/60 text-xs mb-3">
              Share the link below. Participants open it on their own devices.
            </p>
            <div className="bg-navy/60 rounded-xl p-3 mb-3 border border-white/10">
              <p className="text-[11px] font-semibold text-amber uppercase tracking-wider mb-1">Participant Link</p>
              <p className="text-white/80 text-xs break-all font-mono leading-relaxed">{sessionUrl}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-amber text-navy font-bold py-2.5 rounded-xl text-sm hover:bg-amber/90 transition"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => setLaunched(false)}
                className="flex-1 bg-white/10 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-white/20 transition"
              >
                Edit Setup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-5 py-7 space-y-6">

        {/* API Key */}
        <Card title="API Configuration">
          <Field
            label="API Key *"
            type="password"
            value={apiKey}
            onChange={setApiKey}
            placeholder="sk-..."
            hint="Stored in memory only — never persisted or shared."
          />
        </Card>

        {/* Session Details */}
        <Card title="Session Details">
          <Field
            label="Topic"
            value={config.topic}
            onChange={v => setShared('topic', v)}
            placeholder="e.g. Giving constructive feedback on missed deadlines"
          />
          <Field
            label="Learning Framework *"
            value={config.framework}
            onChange={v => setShared('framework', v)}
            placeholder="e.g. SBI Feedback Model, GROW Coaching, COIN, DESC"
            error={fieldErrors.shared?.framework}
          />
          <TextArea
            label="Framework Steps *"
            value={config.frameworkSteps}
            onChange={v => setShared('frameworkSteps', v)}
            placeholder="Describe the steps the participant must follow..."
            rows={3}
            error={fieldErrors.shared?.frameworkSteps}
          />
          <TextArea
            label="Background Context"
            value={config.backgroundContext}
            onChange={v => setShared('backgroundContext', v)}
            placeholder="Team/company situation, history between manager and employee..."
            rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-navy/70 mb-1.5">Turn Limit</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={3}
                max={50}
                value={config.turnLimit}
                onChange={e =>
                  setShared('turnLimit', Math.min(50, Math.max(3, parseInt(e.target.value, 10) || 10)))
                }
                className="w-24 border border-navy/20 rounded-xl px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-amber/40 text-sm"
              />
              <span className="text-navy/50 text-sm">turns max (3–50)</span>
            </div>
            <p className="text-xs text-navy/40 mt-1">
              Auto-triggers debrief when reached. Facilitator can end session at any time.
            </p>
          </div>
        </Card>

        {/* End-in-Mind — shared across all personas */}
        <Card title="Desired Outcome">
          <TextArea
            label="End-in-Mind (shared across all personas) *"
            value={config.endInMind}
            onChange={v => setShared('endInMind', v)}
            placeholder="e.g. The employee acknowledges the impact of their behaviour and commits to a specific, time-bound improvement action."
            rows={3}
            hint="Describe the ideal outcome of the conversation — not the method. Focus on what the employee says, agrees to, or commits to by the end."
            error={fieldErrors.shared?.endInMind}
          />
        </Card>

        {/* Personas Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base text-white font-semibold">
                Employee Personas
                <span className="ml-2 text-xs font-sans font-normal text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
                  {config.personas.length}/4
                </span>
              </h2>
              <p className="text-white/40 text-xs mt-0.5">Configure up to 4 personas for this session</p>
            </div>
            <div className="relative group">
              <button
                onClick={addPersona}
                disabled={config.personas.length >= 4}
                className="flex items-center gap-1.5 bg-amber/20 text-amber font-bold text-xs px-3 py-2 rounded-xl hover:bg-amber/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-sm leading-none">+</span> Add Persona
              </button>
              {config.personas.length >= 4 && (
                <div className="absolute right-0 top-full mt-1 bg-navy/90 text-white/70 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white/10">
                  Maximum 4 personas per session
                </div>
              )}
            </div>
          </div>

          {/* Persona Assignment Toggle — only when 2+ personas */}
          {config.personas.length > 1 && (
            <div className="bg-white/8 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-white text-sm font-semibold">Persona Assignment</p>
                <p className="text-white/40 text-xs">How are participants assigned to a persona?</p>
              </div>
              <div className="flex bg-white/10 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setShared('personaAssignment', 'facilitator')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    config.personaAssignment === 'facilitator'
                      ? 'bg-amber text-navy shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Facilitator Assigns
                </button>
                <button
                  onClick={() => setShared('personaAssignment', 'random')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    config.personaAssignment === 'random'
                      ? 'bg-amber text-navy shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Random
                </button>
              </div>
            </div>
          )}

          {/* Persona Cards */}
          <div className="space-y-3">
            {config.personas.map((persona, index) => (
              <PersonaCard
                key={persona.id || index}
                persona={persona}
                index={index}
                onUpdate={handlePersonaUpdate}
                onRemove={removePersona}
                apiKey={apiKey}
                errors={fieldErrors.personas[index] || {}}
              />
            ))}
          </div>
        </div>

        {/* Launch */}
        {hasAnyErrors && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3" data-field-error="true">
            <p className="text-red-400 text-sm font-semibold">Please fix the following before launching:</p>
            <ul className="mt-1.5 space-y-0.5">
              {fieldErrors.shared?.framework && (
                <li className="text-red-300/80 text-xs">• Learning Framework is required</li>
              )}
              {fieldErrors.shared?.frameworkSteps && (
                <li className="text-red-300/80 text-xs">• Framework Steps is required</li>
              )}
              {fieldErrors.shared?.endInMind && (
                <li className="text-red-300/80 text-xs">• End-in-Mind is required</li>
              )}
              {(fieldErrors.personas || []).map((p, i) =>
                Object.keys(p || {}).length > 0 ? (
                  <li key={i} className="text-red-300/80 text-xs">
                    • Persona {i + 1}: {Object.keys(p).join(', ')} incomplete
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}

        <button
          onClick={handleLaunch}
          className="w-full bg-amber text-navy font-bold py-4 rounded-2xl text-base hover:bg-amber/90 active:scale-[0.98] transition-all shadow-lg shadow-amber/20"
        >
          Launch Session
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <h2 className="font-heading text-base text-navy font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', hint, error }) {
  return (
    <div data-field-error={error ? 'true' : undefined}>
      <label className="block text-sm font-medium text-navy/70 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-2.5 text-navy placeholder:text-navy/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 ${
          error ? 'border-red-400 bg-red-50/50' : 'border-navy/20'
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-navy/40 mt-1">{hint}</p>}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3, hint, error }) {
  return (
    <div data-field-error={error ? 'true' : undefined}>
      <label className="block text-sm font-medium text-navy/70 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full border rounded-xl px-4 py-2.5 text-navy placeholder:text-navy/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 resize-y ${
          error ? 'border-red-400 bg-red-50/50' : 'border-navy/20'
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-navy/40 mt-1">{hint}</p>}
    </div>
  );
}
