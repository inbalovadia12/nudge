import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { Bell, Shield } from 'lucide-react';

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
        setOnboarded(true);
      }
      setChecking(false);
    }
    check();
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
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
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-20 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <span className="font-bold text-foreground">Nudge</span>
            <div className="flex items-center gap-2">
              <Link to="/shield" className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                <Shield className="w-5 h-5" />
              </Link>
              <Link to="/notifications" className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                <Bell className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}