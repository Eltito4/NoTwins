import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-background"> {/* Main background */}
      <div className="container mx-auto px-4 py-16">
        {currentUser ? <Dashboard /> : <AuthForm />}
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}