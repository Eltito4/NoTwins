import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { UserMenu } from './components/UserMenu';
import { lazy, Suspense, useState } from 'react';

// Lazy load admin dashboard to reduce initial bundle size
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

export default function App() {
  const { currentUser } = useAuth();
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Show regular app for normal users or non-admin users
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentUser && (
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tus Eventos</h1>
            </div>
            <UserMenu onShowAdmin={() => setShowAdminDashboard(true)} />
          </div>
        )}
        <div className="mt-4">
          {currentUser ? <Dashboard /> : <AuthForm />}
        </div>
      </div>
      
      {showAdminDashboard && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-white text-lg">Loading admin dashboard...</div>
            </div>
          }>
            <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
          </Suspense>
        </div>
      )}
    </div>
  );
}