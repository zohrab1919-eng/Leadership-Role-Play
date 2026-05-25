import { createContext, useContext, useState, useCallback } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [sessionConfig, setSessionConfig] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [participantName, setParticipantName] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('lobby');
  const [debriefData, setDebriefData] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [apiKey, setApiKey] = useState(
    typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_ANTHROPIC_API_KEY || '') : ''
  );

  // Try Again — same persona, fresh conversation
  const resetConversation = useCallback(() => {
    setConversationHistory([]);
    setDebriefData(null);
    setTurnCount(0);
    setCurrentScreen('conversation');
  }, []);

  // New Persona — back to persona selection (or brief if single persona)
  const newPersona = useCallback((config) => {
    const cfg = config || sessionConfig;
    setConversationHistory([]);
    setDebriefData(null);
    setTurnCount(0);
    setSelectedPersona(null);
    const hasMultiple = cfg?.personas?.length > 1;
    setCurrentScreen(hasMultiple ? 'personaSelect' : 'brief');
  }, [sessionConfig]);

  // Full reset — back to lobby entry
  const clearSession = useCallback(() => {
    setSessionConfig(null);
    setSelectedPersona(null);
    setConversationHistory([]);
    setDebriefData(null);
    setTurnCount(0);
    setParticipantName('');
    setCurrentScreen('lobby');
  }, []);

  return (
    <SessionContext.Provider value={{
      sessionConfig, setSessionConfig,
      selectedPersona, setSelectedPersona,
      participantName, setParticipantName,
      conversationHistory, setConversationHistory,
      currentScreen, setCurrentScreen,
      debriefData, setDebriefData,
      turnCount, setTurnCount,
      apiKey, setApiKey,
      resetConversation,
      newPersona,
      clearSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
