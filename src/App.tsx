import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { UserMenu } from './components/UserMenu';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentUser && (
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Events</h1>
            <UserMenu />
          </div>
        )}
        <div className="mt-4">
          {currentUser ? <Dashboard /> : <AuthForm />}
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}