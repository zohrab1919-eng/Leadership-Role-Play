import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import FacilitatorSetup from './components/FacilitatorSetup';
import ParticipantLobby from './components/ParticipantLobby';
import ConversationScreen from './components/ConversationScreen';
import DebriefScreen from './components/DebriefScreen';

function ParticipantRouter() {
  const { currentScreen } = useSession();
  if (currentScreen === 'conversation') return <ConversationScreen />;
  if (currentScreen === 'debrief') return <DebriefScreen />;
  return <ParticipantLobby />;
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/facilitator" element={<FacilitatorSetup />} />
          <Route path="/" element={<ParticipantRouter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
