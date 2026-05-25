import { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';

function decodeConfig(encoded) {
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

// Support old flat-format configs (pre-multi-persona) by wrapping in personas array.
// Also handles old multi-persona format that used personaName/personaRole/etc.
function normaliseConfig(cfg) {
  // Already has a personas array
  if (cfg.personas && Array.isArray(cfg.personas)) {
    // Ensure session-level endInMind exists (old multi-persona format stored it per-persona)
    if (!cfg.endInMind) {
      const firstEndInMind = cfg.personas[0]?.endInMind || '';
      return { ...cfg, endInMind: firstEndInMind };
    }
    return cfg;
  }
  // Oldest flat format — extract persona fields and wrap
  const {
    personaName, personaRole, personaTraits, situationBrief, endInMind, ...shared
  } = cfg;
  return {
    ...shared,
    endInMind: endInMind || '',
    personas: [{ personaName, personaRole, personaTraits, situationBrief, endInMind }],
  };
}

// Get display name from either new or old persona format
function personaDisplayName(p) {
  return p?.name || p?.personaName || 'Employee';
}

// Get display role from either new or old persona format
function personaDisplayRole(p) {
  return p?.role || p?.personaRole || '';
}

// Get situation summary from either new or old persona format
function personaSituation(p) {
  return p?.situationWhat || p?.situationBrief || '';
}

export default function ParticipantLobby() {
  const {
    sessionConfig, setSessionConfig,
    selectedPersona, setSelectedPersona,
    participantName, setParticipantName,
    setCurrentScreen,
    apiKey, setApiKey,
    currentScreen,
  } = useSession();

  const [view, setView] = useState('enter'); // enter | personaSelect | brief
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // Sync view with currentScreen when returning from debrief via newPersona()
  useEffect(() => {
    if (currentScreen === 'personaSelect' && sessionConfig) {
      setView('personaSelect');
    } else if (currentScreen === 'brief' && sessionConfig) {
      setView('brief');
    }
  }, [currentScreen, sessionConfig]);

  // Auto-load config from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    if (s) {
      try {
        const cfg = decodeConfig(s);
        const normalised = normaliseConfig(cfg);
        setSessionConfig(normalised);
        resolveView(normalised, setSelectedPersona, setView);
      } catch {
        setError('The session link appears to be invalid. Ask your facilitator for a new one.');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadCode = () => {
    setError('');
    try {
      const cfg = decodeConfig(code.trim());
      const normalised = normaliseConfig(cfg);
      setSessionConfig(normalised);
      resolveView(normalised, setSelectedPersona, setView);
    } catch {
      setError('Invalid session code. Please check with your facilitator.');
    }
  };

  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona);
    setView('brief');
  };

  const handleStart = () => {
    if (!participantName.trim()) return;
    setCurrentScreen('conversation');
  };

  const persona = selectedPersona ?? sessionConfig?.personas?.[0];

  // ── Enter screen ──
  if (view === 'enter') {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg overflow-hidden p-1">
                <img src="/enablerz-logo.png" alt="Enablerz" className="w-full h-full object-contain" />
              </div>
              <h1 className="font-heading text-3xl text-white font-bold mb-2">Leadership Practice</h1>
              <p className="text-white/50 text-sm leading-relaxed">
                Open the link your facilitator shared, or paste the session code below.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy/70 mb-1.5">Session Code</label>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Paste the session code provided by your facilitator..."
                  rows={3}
                  className="w-full border border-navy/20 rounded-xl px-4 py-2.5 text-navy placeholder:text-navy/30 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber/40 resize-none"
                />
              </div>
              {!apiKey && (
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full border border-navy/20 rounded-xl px-4 py-2.5 text-navy placeholder:text-navy/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
                  />
                  <p className="text-xs text-navy/40 mt-1">Required if not pre-configured by your facilitator.</p>
                </div>
              )}
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button
                onClick={handleLoadCode}
                disabled={!code.trim()}
                className="w-full bg-navy text-white font-bold py-3 rounded-xl hover:bg-navy/80 transition disabled:opacity-40 text-sm"
              >
                Load Session
              </button>
            </div>

            <p className="text-center text-white/30 text-xs mt-6">
              Facilitator?{' '}
              <a href="/facilitator" className="text-amber underline-offset-2 hover:underline">
                Go to setup →
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Persona Select screen (Facilitator Assigns mode with 2+ personas) ──
  if (view === 'personaSelect' && sessionConfig) {
    const personas = sessionConfig.personas;
    return (
      <div className="min-h-screen bg-navy">
        <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur border-b border-white/10 px-5 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-0.5">
              <img src="/enablerz-logo.png" alt="Enablerz" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-heading text-lg text-white font-bold">Choose Your Scenario</h1>
              <p className="text-white/50 text-xs">
                {personas.length} scenarios available · {sessionConfig.topic || 'Leadership Practice'}
              </p>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-5 py-6">
          <p className="text-white/60 text-sm mb-5 leading-relaxed">
            Select the persona you will practise with. Each has a different personality and situation brief.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {personas.map((p, i) => {
              const name = personaDisplayName(p);
              const role = personaDisplayRole(p);
              const situation = personaSituation(p);
              return (
                <button
                  key={i}
                  onClick={() => handleSelectPersona(p)}
                  className="bg-white rounded-2xl p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-navy/10 rounded-xl flex items-center justify-center text-navy font-heading font-bold text-lg group-hover:bg-amber/15 group-hover:text-amber transition-colors">
                      {i + 1}
                    </div>
                    <span className="text-[11px] font-semibold text-amber uppercase tracking-wider bg-amber/10 px-2 py-0.5 rounded-full">
                      Scenario {i + 1}
                    </span>
                  </div>
                  <p className="font-heading text-navy font-bold text-base leading-tight mb-0.5">{name}</p>
                  <p className="text-navy/50 text-xs mb-3">{role}</p>
                  {situation && (
                    <p className="text-navy/70 text-sm leading-relaxed line-clamp-3">{situation}</p>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-amber text-xs font-bold">
                    Start with {name.split(' ')[0]} →
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Brief screen ──
  if (view === 'brief' && sessionConfig && persona) {
    const name = personaDisplayName(persona);
    const role = personaDisplayRole(persona);
    const isNewFormat = !!(persona.name && persona.behaviouralTags);
    // endInMind lives at session level (new) or persona level (old)
    const endInMind = sessionConfig.endInMind || persona.endInMind || '';

    return (
      <div className="min-h-screen bg-navy">
        <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur border-b border-white/10 px-5 py-3">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-0.5">
              <img src="/enablerz-logo.png" alt="Enablerz" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-lg text-white font-bold truncate">Your Scenario Brief</h1>
              <p className="text-white/50 text-xs">Read carefully before starting</p>
            </div>
            {sessionConfig.personas.length > 1 && sessionConfig.personaAssignment !== 'random' && (
              <button
                onClick={() => { setSelectedPersona(null); setView('personaSelect'); }}
                className="text-white/40 text-xs hover:text-white/70 transition shrink-0"
              >
                ← Back
              </button>
            )}
          </div>
        </header>

        <div className="max-w-xl mx-auto px-5 py-6 space-y-4">
          {sessionConfig.topic && <InfoBlock label="Topic" value={sessionConfig.topic} />}

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-bold text-amber uppercase tracking-wider mb-1">Your Role</p>
            <p className="text-navy text-sm leading-relaxed">
              You are the <strong>manager</strong>. You will have a one-on-one conversation with{' '}
              <strong>{name}</strong>{role ? `, ${role}` : ''}.
            </p>
          </div>

          {sessionConfig.backgroundContext && (
            <InfoBlock label="Background" value={sessionConfig.backgroundContext} />
          )}

          {/* Situation — new format shows structured fields; old format shows situationBrief */}
          {isNewFormat ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              <p className="text-[11px] font-bold text-amber uppercase tracking-wider">The Situation</p>
              <p className="text-navy/80 text-sm leading-relaxed">{persona.situationWhat}</p>
              {persona.situationHistory && (
                <div className="border-t border-navy/8 pt-3">
                  <p className="text-[11px] font-semibold text-navy/50 uppercase tracking-wider mb-1">Prior History</p>
                  <p className="text-navy/70 text-sm leading-relaxed">{persona.situationHistory}</p>
                </div>
              )}
            </div>
          ) : (
            <InfoBlock label="The Situation" value={persona.situationBrief} />
          )}

          {sessionConfig.framework && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-[11px] font-bold text-amber uppercase tracking-wider mb-1">Framework to Apply</p>
              <p className="text-navy font-semibold text-sm">{sessionConfig.framework}</p>
              {sessionConfig.frameworkSteps && (
                <p className="text-navy/70 text-sm mt-2 leading-relaxed">{sessionConfig.frameworkSteps}</p>
              )}
            </div>
          )}

          {endInMind && (
            <div className="bg-amber/10 border border-amber/30 rounded-2xl p-5">
              <p className="text-[11px] font-bold text-amber uppercase tracking-wider mb-1">Desired Outcome</p>
              <p className="text-navy/80 text-sm leading-relaxed italic">{endInMind}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-medium text-navy/70 mb-1.5">Your First Name</label>
            <input
              type="text"
              value={participantName}
              onChange={e => setParticipantName(e.target.value)}
              placeholder="e.g. Sarah"
              className="w-full border border-navy/20 rounded-xl px-4 py-2.5 text-navy placeholder:text-navy/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 mb-4"
            />
            <button
              onClick={handleStart}
              disabled={!participantName.trim()}
              className="w-full bg-amber text-navy font-bold py-4 rounded-xl text-base hover:bg-amber/90 active:scale-[0.98] transition-all disabled:opacity-40 shadow-md shadow-amber/20"
            >
              Start Conversation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function InfoBlock({ label, value }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="text-[11px] font-bold text-amber uppercase tracking-wider mb-1">{label}</p>
      <p className="text-navy/80 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

// Decide which view to show after loading config:
// - Random assignment → pick random persona, show brief
// - 1 persona → show brief
// - Multiple personas, facilitator assigns → show personaSelect
function resolveView(config, setSelectedPersona, setView) {
  const personas = config.personas || [];
  if (personas.length === 0) return;

  if (personas.length === 1) {
    setSelectedPersona(personas[0]);
    setView('brief');
  } else if (config.personaAssignment === 'random') {
    const picked = personas[Math.floor(Math.random() * personas.length)];
    setSelectedPersona(picked);
    setView('brief');
  } else {
    // facilitator assigns or default — let participant choose
    setView('personaSelect');
  }
}
