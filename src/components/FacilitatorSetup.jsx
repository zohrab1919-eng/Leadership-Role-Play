import { useState } from 'react';
import { useSession } from '../context/SessionContext';

const DEFAULT_PERSONA = {
  personaName: '',
  personaRole: '',
  personaTraits: '',
  situationBrief: '',
  endInMind: '',
};

const DEFAULTS = {
  topic: '',
  framework: '',
  frameworkSteps: '',
  backgroundContext: '',
  turnLimit: 10,
  personas: [{ ...DEFAULT_PERSONA }],
};

function encodeConfig(config) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(config))));
}

export default function FacilitatorSetup() {
  const { apiKey, setApiKey, setSessionConfig } = useSession();
  const [config, setConfig] = useState(DEFAULTS);
  const [activeTab, setActiveTab] = useState(0);
  const [launched, setLaunched] = useState(false);
  const [sessionUrl, setSessionUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const setShared = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

  const setPersonaField = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      personas: prev.personas.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const addPersona = () => {
    if (config.personas.length >= 4) return;
    const next = config.personas.length;
    setConfig(prev => ({ ...prev, personas: [...prev.personas, { ...DEFAULT_PERSONA }] }));
    setActiveTab(next);
  };

  const removePersona = (index) => {
    setConfig(prev => ({ ...prev, personas: prev.personas.filter((_, i) => i !== index) }));
    setActiveTab(prev => Math.min(prev, config.personas.length - 2));
  };

  const activePersona = config.personas[activeTab] ?? config.personas[0];

  const isValid =
    apiKey.trim() &&
    config.framework.trim() &&
    config.personas.length > 0 &&
    config.personas[0].personaName.trim() &&
    config.personas[0].situationBrief.trim() &&
    config.personas[0].endInMind.trim();

  const handleLaunch = () => {
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

  return (
    <div className="min-h-screen bg-navy">
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

      {launched && (
        <div className="bg-green-600/20 border-b border-green-500/30 px-5 py-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-green-400 font-semibold text-sm mb-1">
              Session launched — {config.personas.length} persona{config.personas.length > 1 ? 's' : ''} configured
            </p>
            <p className="text-white/60 text-xs mb-3">Share the link below. Participants open it on their own devices.</p>
            <div className="bg-navy/60 rounded-xl p-3 mb-3 border border-white/10">
              <p className="text-[11px] font-semibold text-amber uppercase tracking-wider mb-1">Participant Link</p>
              <p className="text-white/80 text-xs break-all font-mono leading-relaxed">{sessionUrl}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="flex-1 bg-amber text-navy font-bold py-2.5 rounded-xl text-sm hover:bg-amber/90 transition">
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
              <button onClick={() => setLaunched(false)} className="flex-1 bg-white/10 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-white/20 transition">
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
            label="Anthropic API Key *"
            type="password"
            value={apiKey}
            onChange={setApiKey}
            placeholder="sk-ant-..."
            hint="Stored in memory only — never persisted or shared."
          />
        </Card>

        {/* Session Details */}
        <Card title="Session Details">
          <Field label="Topic" value={config.topic} onChange={v => setShared('topic', v)} placeholder="e.g. Giving constructive feedback on missed deadlines" />
          <Field label="Learning Framework *" value={config.framework} onChange={v => setShared('framework', v)} placeholder="e.g. SBI Feedback Model, GROW Coaching, COIN, DESC" />
          <TextArea label="Framework Steps *" value={config.frameworkSteps} onChange={v => setShared('frameworkSteps', v)} placeholder="Describe the steps the participant must follow..." rows={3} />
          <TextArea label="Background Context" value={config.backgroundContext} onChange={v => setShared('backgroundContext', v)} placeholder="Team/company situation, history between manager and employee..." rows={3} />
          <div>
            <label className="block text-sm font-medium text-navy/70 mb-1.5">Turn Limit</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={3}
                max={50}
                value={config.turnLimit}
                onChange={e => setShared('turnLimit', Math.min(50, Math.max(3, parseInt(e.target.value, 10) || 10)))}
                className="w-24 border border-navy/20 rounded-xl px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-amber/40 text-sm"
              />
              <span className="text-navy/50 text-sm">turns max (3–50)</span>
            </div>
            <p className="text-xs text-navy/40 mt-1">Auto-triggers debrief when reached. Facilitator can end session at any time.</p>
          </div>
        </Card>

        {/* Personas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base text-navy font-semibold">
              Employee Persona{config.personas.length > 1 ? 's' : ''}
              <span className="ml-2 text-xs font-sans font-normal text-navy/40 bg-navy/5 px-2 py-0.5 rounded-full">
                {config.personas.length}/4
              </span>
            </h2>
            {config.personas.length < 4 && (
              <button
                onClick={addPersona}
                className="flex items-center gap-1.5 bg-amber/15 text-amber font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-amber/25 transition"
              >
                <span className="text-base leading-none">+</span> Add Persona
              </button>
            )}
          </div>

          {/* Persona Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {config.personas.map((p, i) => (
              <div key={i} className="relative">
                <button
                  onClick={() => setActiveTab(i)}
                  className={`pl-3 pr-7 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === i
                      ? 'bg-navy text-white shadow-sm'
                      : 'bg-navy/8 text-navy/60 hover:bg-navy/15'
                  }`}
                >
                  {p.personaName.trim() || `Persona ${i + 1}`}
                </button>
                {i > 0 && (
                  <button
                    onClick={() => removePersona(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center bg-red-400 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition"
                    title="Remove persona"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Active persona form */}
          <div className="space-y-4 pt-2 border-t border-navy/8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Field
                label="Persona Name *"
                value={activePersona.personaName}
                onChange={v => setPersonaField(activeTab, 'personaName', v)}
                placeholder="e.g. Alex Tan"
              />
              <Field
                label="Persona Role *"
                value={activePersona.personaRole}
                onChange={v => setPersonaField(activeTab, 'personaRole', v)}
                placeholder="e.g. Senior Executive, Sales"
              />
            </div>
            <TextArea
              label="Persona Traits *"
              value={activePersona.personaTraits}
              onChange={v => setPersonaField(activeTab, 'personaTraits', v)}
              placeholder="Personality, emotional state, resistance style (e.g. defensive, avoidant, over-agreeable, passive-aggressive, emotional)..."
              rows={3}
            />
            <TextArea
              label="Situation Brief *"
              value={activePersona.situationBrief}
              onChange={v => setPersonaField(activeTab, 'situationBrief', v)}
              placeholder="The specific scenario the manager must navigate — shown to participants before the conversation..."
              rows={4}
            />
            <TextArea
              label="Desired End-in-Mind *"
              value={activePersona.endInMind}
              onChange={v => setPersonaField(activeTab, 'endInMind', v)}
              placeholder="The outcome this conversation should achieve (used to score the debrief)..."
              rows={3}
            />
          </div>
        </div>

        <button
          onClick={handleLaunch}
          disabled={!isValid}
          className="w-full bg-amber text-navy font-bold py-4 rounded-2xl text-base hover:bg-amber/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber/20"
        >
          Launch Session
        </button>
        {!isValid && (
          <p className="text-center text-white/40 text-xs -mt-2">
            Complete all required fields (*) and add your API key to launch.
          </p>
        )}
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

function Field({ label, value, onChange, placeholder, type = 'text', hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy/70 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-navy/20 rounded-xl px-4 py-2.5 text-navy placeholder:text-navy/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
      />
      {hint && <p className="text-xs text-navy/40 mt-1">{hint}</p>}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy/70 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-navy/20 rounded-xl px-4 py-2.5 text-navy placeholder:text-navy/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 resize-y"
      />
    </div>
  );
}
