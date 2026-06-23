import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout() {
  const { user } = useAuth();

  if (user && !user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:pl-64">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}