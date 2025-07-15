import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserMenu } from './components/UserMenu';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import api from './lib/api';

export default function App() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [forceUserView, setForceUserView] = useState(false);

  useEffect(() => {
    // Check if current user is admin
    if (currentUser) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setCheckingAdmin(false);
      setForceUserView(false);
    }
  }, [currentUser]);

  const checkAdminStatus = async () => {
    try {
      setCheckingAdmin(true);
      const response = await api.get('/admin/dashboard');
      setIsAdmin(true);
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  // Show admin dashboard if user is logged in and is admin
  if (currentUser && isAdmin && !checkingAdmin && !forceUserView) {
    return (
      <div className="min-h-screen">
        <AdminDashboard />
        <Toaster position="bottom-right" />
      </div>
    );
  }

  // Show regular app for normal users or non-admin users
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentUser && (
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Events</h1>
              {checkingAdmin && (
                <p className="text-sm text-gray-500">Checking admin access...</p>
              )}
              {currentUser && !checkingAdmin && !forceUserView && (
                <p className="text-sm text-gray-500">
                  Regular user access
                </p>
              )}
              {isAdmin && !forceUserView && (
                <button
                  onClick={() => setForceUserView(false)}
                  className="text-sm text-primary hover:text-primary-600 underline"
                >
                  Switch to Admin Dashboard
                </button>
              )}
            </div>
            <UserMenu 
              isAdmin={isAdmin} 
              forceUserView={forceUserView}
              onToggleView={() => setForceUserView(!forceUserView)}
            />
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