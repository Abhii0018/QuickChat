import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import AuthView from './views/AuthView';
import ChatView from './views/ChatView';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // Avoid flicker

  return user ? (
    <ChatProvider>
      <ChatView />
    </ChatProvider>
  ) : (
    <AuthView />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
