import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { VisionHealthCheck } from './components/VisionHealthCheck';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 flex justify-end">
        <div className="w-full max-w-4xl">
          {currentUser ? <Dashboard /> : <AuthForm />}
        </div>
      </div>
      <Toaster position="bottom-right" />
      {currentUser && <VisionHealthCheck />}
    </div>
  );
}