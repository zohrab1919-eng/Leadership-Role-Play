import { useState } from 'react';

const STORAGE_KEY = 'lrp_templates_v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(templates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// Strip non-persistent fields before saving
function cleanConfig(config) {
  return {
    ...config,
    personas: (config.personas || []).map(({ previewSummary: _p, ...rest }) => rest),
    sessionId: undefined, // Don't preserve old session IDs in templates
  };
}

export function useTemplates() {
  const [templates, setTemplates] = useState(loadFromStorage);

  const saveTemplate = (config, name) => {
    const id = `tpl_${Date.now()}`;
    const tpl = {
      id,
      name: name?.trim() || config.topic?.trim() || 'Untitled Template',
      savedAt: new Date().toISOString(),
      config: cleanConfig(config),
    };
    const next = [...templates, tpl];
    setTemplates(next);
    persist(next);
    return id;
  };

  const updateTemplate = (id, config, name) => {
    const next = templates.map(t =>
      t.id === id
        ? {
            ...t,
            name: name?.trim() || t.name,
            savedAt: new Date().toISOString(),
            config: cleanConfig(config),
          }
        : t
    );
    setTemplates(next);
    persist(next);
  };

  const deleteTemplate = (id) => {
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    persist(next);
  };

  return { templates, saveTemplate, updateTemplate, deleteTemplate };
}
