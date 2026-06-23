import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout() {
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const profiles = await base44.entities.UserProfile.list();
        if (profiles.length > 0 && profiles[0].onboarding_complete) {
          setOnboarded(true);
        }
      } catch {
        // If we can't check, let the user through
        setOnboarded(true);
      }
      setChecking(false);
    }
    check();
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-canvas">
        <div className="w-8 h-8 border-4 border-surface-3 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!onboarded) {
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