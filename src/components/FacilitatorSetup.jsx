import { useState, useRef, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useSession } from '../context/SessionContext';
import PersonaCard from './PersonaCard';
import { useTemplates } from '../hooks/useTemplates';

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

// Always strips previewSummary from personas — participants don't need it
function encodeConfig(config) {
  const slim = {
    ...config,
    personas: (config.personas || []).map(({ previewSummary: _p, ...rest }) => rest),
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(slim))));
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

  return {
    shared,
    personas,
    hasErrors: Object.keys(shared).length > 0 || personas.some(p => Object.keys(p).length > 0),
  };
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function FacilitatorSetup() {
  const { apiKey, setApiKey, setSessionConfig } = useSession();
  const { templates, saveTemplate, updateTemplate, renameTemplate, duplicateTemplate, deleteTemplate } = useTemplates();

  const [config, setConfig] = useState(DEFAULTS);
  const [launched, setLaunched] = useState(false);
  const [sessionUrl, setSessionUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ shared: {}, personas: [{}] });

  // QR code
  const [showQR, setShowQR] = useState(false);
  const qrWrapRef = useRef(null);

  // Session reset
  const [resetConfirm, setResetConfirm] = useState(false);

  // Template management
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [templateFlash, setTemplateFlash] = useState(''); // success message

  // ── Slim URL for QR (strips previewSummary) ──
  const slimUrl = useMemo(() => {
    if (!sessionUrl) return '';
    return sessionUrl; // already stripped by encodeConfig
  }, [sessionUrl]);

  const qrTooLong = slimUrl.length > 2953;
  const qrLong = !qrTooLong && slimUrl.length > 2200;

  // ── Config setters ──
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
    setConfig(prev => ({ ...prev, personas: [...prev.personas, { ...DEFAULT_PERSONA, id: nextId }] }));
    setFieldErrors(prev => ({ ...prev, personas: [...prev.personas, {}] }));
  };

  const removePersona = (index) => {
    setConfig(prev => ({ ...prev, personas: prev.personas.filter((_, i) => i !== index) }));
    setFieldErrors(prev => ({ ...prev, personas: prev.personas.filter((_, i) => i !== index) }));
  };

  // ── Launch ──
  const handleLaunch = () => {
    const validation = validateConfig(config);
    if (validation.hasErrors) {
      setFieldErrors({ shared: validation.shared, personas: validation.personas });
      setTimeout(() => {
        const el = document.querySelector('[data-field-error="true"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
      return;
    }
    const newConfig = { ...config, sessionId: Date.now() };
    setConfig(newConfig);
    const encoded = encodeConfig(newConfig);
    const url = `${window.location.origin}/?s=${encoded}`;
    setSessionUrl(url);
    setSessionConfig(newConfig);
    setLaunched(true);
    setResetConfirm(false);
    setShowQR(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Reset Session ──
  const handleReset = () => {
    // Re-generate a fresh URL with a new sessionId so old sessions are effectively orphaned
    const newConfig = { ...config, sessionId: Date.now() };
    setConfig(newConfig);
    const encoded = encodeConfig(newConfig);
    const url = `${window.location.origin}/?s=${encoded}`;
    setSessionUrl(url);
    setSessionConfig(newConfig);
    setResetConfirm(false);
    setShowQR(false);
    setCopied(false);
    setTemplateFlash('Session reset — a new link has been generated. Share it with participants.');
    setTimeout(() => setTemplateFlash(''), 5000);
  };

  // ── Template save ──
  const openSaveDialog = () => {
    setTemplateName(config.topic?.trim() || '');
    setSaveDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    const id = saveTemplate(config, templateName);
    setActiveTemplateId(id);
    setSaveDialogOpen(false);
    setTemplatesExpanded(true);
    setTemplateFlash('Template saved successfully.');
    setTimeout(() => setTemplateFlash(''), 3000);
  };

  const handleUpdateTemplate = () => {
    if (!activeTemplateId) return;
    const tpl = templates.find(t => t.id === activeTemplateId);
    updateTemplate(activeTemplateId, config, tpl?.name);
    setTemplateFlash('Template updated.');
    setTimeout(() => setTemplateFlash(''), 3000);
  };

  const handleLoadTemplate = (tpl) => {
    const loaded = {
      ...DEFAULTS,
      ...tpl.config,
      personas: (tpl.config.personas || []).map((p, i) => ({
        ...DEFAULT_PERSONA,
        ...p,
        id: p.id || `persona_${i + 1}`,
      })),
    };
    setConfig(loaded);
    setActiveTemplateId(tpl.id);
    setFieldErrors({ shared: {}, personas: (loaded.personas || []).map(() => ({})) });
    setLaunched(false);
    setTemplateFlash(`Loaded: "${tpl.name}" — make any changes then launch.`);
    setTimeout(() => setTemplateFlash(''), 4000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Template rename ──
  const startRename = (tpl) => {
    setRenamingId(tpl.id);
    setRenamingValue(tpl.name);
    setDeleteConfirmId(null);
  };

  const commitRename = () => {
    if (renamingValue.trim()) {
      renameTemplate(renamingId, renamingValue);
      if (activeTemplateId === renamingId) {
        // Flash is not needed — the card updates in place
      }
    }
    setRenamingId(null);
    setRenamingValue('');
  };

  const handleDuplicate = (tpl) => {
    const newId = duplicateTemplate(tpl.id);
    if (newId) {
      setTemplateFlash(`Duplicated as "${tpl.name} (Copy)".`);
      setTimeout(() => setTemplateFlash(''), 3000);
    }
  };

  // ── QR download ──
  const downloadQR = () => {
    if (!qrWrapRef.current) return;
    const canvas = qrWrapRef.current.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `session-qr.png`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const hasAnyErrors =
    Object.values(fieldErrors.shared || {}).some(Boolean) ||
    (fieldErrors.personas || []).some(p => Object.values(p || {}).some(Boolean));

  const activeTemplateName = activeTemplateId
    ? templates.find(t => t.id === activeTemplateId)?.name
    : null;

  return (
    <div className="min-h-screen bg-navy">
      {/* ── Header ── */}
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

      {/* ── Flash messages ── */}
      {templateFlash && (
        <div className="bg-green-600/20 border-b border-green-500/30 px-5 py-3">
          <p className="max-w-2xl mx-auto text-green-400 text-sm font-medium">{templateFlash}</p>
        </div>
      )}

      {/* ── Launch Banner ── */}
      {launched && (
        <div className="bg-green-600/15 border-b border-green-500/25 px-5 py-5">
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Status line */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-green-400 font-semibold text-sm">
                ✓ Session live — {config.personas.length} persona{config.personas.length > 1 ? 's' : ''} configured
              </p>
              <span className="text-white/40 text-[11px]">{config.topic || 'No topic set'}</span>
            </div>

            {/* URL */}
            <div className="bg-navy/60 rounded-xl p-3 border border-white/10">
              <p className="text-[11px] font-semibold text-amber uppercase tracking-wider mb-1">Participant Link</p>
              <p className="text-white/80 text-xs break-all font-mono leading-relaxed">{sessionUrl}</p>
            </div>

            {/* Action buttons row 1 */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                className="flex-1 min-w-[120px] bg-amber text-navy font-bold py-2.5 rounded-xl text-sm hover:bg-amber/90 transition"
              >
                {copied ? '✓ Copied!' : '⎘ Copy Link'}
              </button>
              <button
                onClick={() => { setShowQR(v => !v); }}
                className={`flex-1 min-w-[120px] font-bold py-2.5 rounded-xl text-sm transition ${
                  showQR ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                }`}
              >
                {showQR ? '▲ Hide QR' : '⬛ Show QR'}
              </button>
              <button
                onClick={() => setLaunched(false)}
                className="flex-1 min-w-[120px] bg-white/8 text-white/60 font-semibold py-2.5 rounded-xl text-sm hover:bg-white/15 hover:text-white/80 transition"
              >
                ✎ Edit Setup
              </button>
            </div>

            {/* QR Code */}
            {showQR && (
              <div className="flex flex-col items-center gap-3 py-2">
                {qrTooLong ? (
                  <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4 text-center max-w-xs">
                    <p className="text-red-300 text-sm font-semibold">URL too long for QR code</p>
                    <p className="text-red-300/70 text-xs mt-1 leading-relaxed">
                      The session has too much data. Try shortening persona descriptions, or share the link text instead.
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      ref={qrWrapRef}
                      className="bg-white p-4 rounded-2xl shadow-xl"
                    >
                      <QRCodeCanvas
                        value={slimUrl}
                        size={220}
                        level="L"
                        includeMargin={false}
                      />
                    </div>
                    {qrLong && (
                      <p className="text-yellow-300/70 text-[11px] text-center max-w-[260px] leading-relaxed">
                        QR is complex due to session size. Ensure good lighting and hold the camera steady.
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={downloadQR}
                        className="text-amber text-xs font-semibold hover:text-amber/70 transition"
                      >
                        ↓ Download QR Image
                      </button>
                    </div>
                    <p className="text-white/30 text-[11px] text-center">
                      Participants scan to join — no link needed
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Reset Session */}
            <div className="border-t border-white/10 pt-3">
              {resetConfirm ? (
                <div className="space-y-2">
                  <p className="text-white/60 text-xs text-center">
                    This generates a new session link. Tell participants to refresh their browser or scan the new QR.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 bg-red-500/80 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition"
                    >
                      Yes, Reset Session
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="flex-1 bg-white/10 text-white/70 font-semibold py-2.5 rounded-xl text-sm hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="w-full text-white/40 text-xs font-medium py-2 rounded-xl hover:text-red-300/80 hover:bg-red-500/10 transition"
                >
                  ↺ Reset Session
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-5 py-7 space-y-6">

        {/* ── Saved Templates ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setTemplatesExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-navy/3 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-navy/40 text-base">📋</span>
              <span className="font-heading text-base text-navy font-semibold">Saved Templates</span>
              {templates.length > 0 && (
                <span className="bg-amber/20 text-amber text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {templates.length}
                </span>
              )}
            </div>
            <span className="text-navy/30 text-xs">{templatesExpanded ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {templatesExpanded && (
            <div className="border-t border-navy/8 px-5 pb-5 pt-4">
              {templates.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-navy/40 text-sm">No templates saved yet.</p>
                  <p className="text-navy/30 text-xs mt-1">
                    Fill in a session below and click <strong>Save as New Template</strong> to reuse it later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map(tpl => (
                    <div
                      key={tpl.id}
                      className={`border rounded-xl p-3.5 space-y-2.5 transition-all ${
                        activeTemplateId === tpl.id
                          ? 'border-amber/50 bg-amber/5'
                          : 'border-navy/12 hover:border-navy/25'
                      }`}
                    >
                      {/* Name row — inline rename when editing */}
                      <div>
                        {renamingId === tpl.id ? (
                          <div className="flex items-center gap-1.5 mb-1">
                            <input
                              autoFocus
                              value={renamingValue}
                              onChange={e => setRenamingValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') commitRename();
                                if (e.key === 'Escape') { setRenamingId(null); setRenamingValue(''); }
                              }}
                              className="flex-1 border border-amber/50 rounded-lg px-2.5 py-1.5 text-navy text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber/40 bg-white min-w-0"
                            />
                            <button
                              onClick={commitRename}
                              disabled={!renamingValue.trim()}
                              className="text-green-600 hover:text-green-700 font-bold text-sm px-1 disabled:opacity-30"
                              title="Save name"
                            >✓</button>
                            <button
                              onClick={() => { setRenamingId(null); setRenamingValue(''); }}
                              className="text-navy/30 hover:text-navy/60 text-sm px-1"
                              title="Cancel"
                            >✕</button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <button
                              onClick={() => startRename(tpl)}
                              className="font-semibold text-navy text-sm leading-tight text-left hover:text-amber transition-colors group flex items-center gap-1.5"
                              title="Click to rename"
                            >
                              {tpl.name}
                              <span className="opacity-0 group-hover:opacity-60 text-[10px] transition-opacity">✎</span>
                            </button>
                            {activeTemplateId === tpl.id && (
                              <span className="text-[10px] bg-amber/20 text-amber font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-navy/50 text-xs">
                          {tpl.config.framework || 'No framework'} · {tpl.config.personas?.length || 0} persona{tpl.config.personas?.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-navy/30 text-[11px] mt-0.5">{formatDate(tpl.savedAt)}</p>
                      </div>

                      {/* Actions row */}
                      <div className="flex gap-1.5 items-center">
                        {/* Edit (load into form) */}
                        <button
                          onClick={() => handleLoadTemplate(tpl)}
                          className="flex-1 bg-amber/15 hover:bg-amber/25 text-amber font-bold text-xs py-2 rounded-lg transition"
                        >
                          Edit
                        </button>
                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(tpl)}
                          className="flex-1 bg-navy/8 hover:bg-navy/15 text-navy/60 hover:text-navy font-semibold text-xs py-2 rounded-lg transition"
                          title="Save as new copy"
                        >
                          ⧉ Duplicate
                        </button>
                        {/* Delete */}
                        {deleteConfirmId === tpl.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                deleteTemplate(tpl.id);
                                setDeleteConfirmId(null);
                                if (activeTemplateId === tpl.id) setActiveTemplateId(null);
                              }}
                              className="bg-red-500 text-white text-xs font-bold py-2 px-2.5 rounded-lg"
                            >Del</button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="bg-navy/10 text-navy text-xs font-semibold py-2 px-2 rounded-lg"
                            >No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setDeleteConfirmId(tpl.id); setRenamingId(null); }}
                            className="px-2.5 text-navy/25 hover:text-red-400 text-xs font-semibold py-2 rounded-lg hover:bg-red-50 transition"
                            title="Delete template"
                          >✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Active template banner ── */}
        {activeTemplateName && !launched && (
          <div className="bg-amber/10 border border-amber/25 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-navy/70 text-xs">
              <span className="font-semibold text-amber">Template loaded:</span> {activeTemplateName}
            </p>
            <button
              onClick={() => setActiveTemplateId(null)}
              className="text-navy/30 hover:text-navy/60 text-xs shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── API Config ── */}
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

        {/* ── Session Details ── */}
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
                onChange={e => setShared('turnLimit', Math.min(50, Math.max(3, parseInt(e.target.value, 10) || 10)))}
                className="w-24 border border-navy/20 rounded-xl px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-amber/40 text-sm"
              />
              <span className="text-navy/50 text-sm">turns max (3–50)</span>
            </div>
            <p className="text-xs text-navy/40 mt-1">Auto-triggers debrief when reached. Facilitator can end at any time.</p>
          </div>
        </Card>

        {/* ── Desired Outcome ── */}
        <Card title="Desired Outcome">
          <TextArea
            label="End-in-Mind (shared across all personas) *"
            value={config.endInMind}
            onChange={v => setShared('endInMind', v)}
            placeholder="e.g. The employee acknowledges the impact of their behaviour and commits to a specific, time-bound improvement action."
            rows={3}
            hint="Describe the ideal outcome — not the method. Focus on what the employee says, agrees to, or commits to."
            error={fieldErrors.shared?.endInMind}
          />
        </Card>

        {/* ── Employee Personas ── */}
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

          {/* Persona Assignment Toggle */}
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

        {/* ── Validation errors summary ── */}
        {hasAnyErrors && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3" data-field-error="true">
            <p className="text-red-400 text-sm font-semibold mb-1.5">Please fix the following before launching:</p>
            <ul className="space-y-0.5">
              {fieldErrors.shared?.framework && <li className="text-red-300/80 text-xs">• Learning Framework is required</li>}
              {fieldErrors.shared?.frameworkSteps && <li className="text-red-300/80 text-xs">• Framework Steps is required</li>}
              {fieldErrors.shared?.endInMind && <li className="text-red-300/80 text-xs">• End-in-Mind is required</li>}
              {(fieldErrors.personas || []).map((p, i) =>
                Object.keys(p || {}).length > 0 ? (
                  <li key={i} className="text-red-300/80 text-xs">
                    • Persona {i + 1}: {Object.keys(p).join(', ')} {Object.keys(p).length === 1 ? 'is' : 'are'} incomplete
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}

        {/* ── Template Save Actions ── */}
        {saveDialogOpen ? (
          <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 space-y-3">
            <p className="text-navy text-sm font-semibold">Save as New Template</p>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && templateName.trim()) handleSaveTemplate(); if (e.key === 'Escape') setSaveDialogOpen(false); }}
              placeholder="Template name..."
              autoFocus
              className="w-full border border-navy/20 rounded-xl px-4 py-2.5 text-navy placeholder:text-navy/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="flex-1 bg-amber text-navy font-bold py-2.5 rounded-xl text-sm hover:bg-amber/90 disabled:opacity-40 transition"
              >
                Save Template
              </button>
              <button
                onClick={() => setSaveDialogOpen(false)}
                className="px-4 bg-navy/10 text-navy font-semibold py-2.5 rounded-xl text-sm hover:bg-navy/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={openSaveDialog}
              className="flex-1 bg-white/8 text-white/60 font-semibold py-3 rounded-2xl text-sm hover:bg-white/12 hover:text-white/80 transition border border-white/10"
            >
              💾 Save as New Template
            </button>
            {activeTemplateId && (
              <button
                onClick={handleUpdateTemplate}
                className="flex-1 bg-white/8 text-amber/70 font-semibold py-3 rounded-2xl text-sm hover:bg-white/12 hover:text-amber transition border border-amber/20"
              >
                ↑ Update Template
              </button>
            )}
          </div>
        )}

        {/* ── Launch Button ── */}
        <button
          onClick={handleLaunch}
          className="w-full bg-amber text-navy font-bold py-4 rounded-2xl text-base hover:bg-amber/90 active:scale-[0.98] transition-all shadow-lg shadow-amber/20"
        >
          {launched ? '↺ Re-launch Session' : 'Launch Session'}
        </button>

      </div>
    </div>
  );
}

// ── Sub-components ──

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
