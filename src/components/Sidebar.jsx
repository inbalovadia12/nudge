import { Link, useLocation } from 'react-router-dom';
import { Home, Target, MessageCircle, ScanSearch, BarChart3, Wallet, CalendarDays, TrendingUp, User, Tag, CreditCard, Trophy, Clock, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Logo from './Logo';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Insights', path: '/insights', icon: BarChart3 },
  { label: 'Goals', path: '/goals', icon: Target },
  { label: 'Challenges', path: '/challenges', icon: Trophy },
  { label: 'Assistant', path: '/assistant', icon: MessageCircle },
  { label: 'Profile', path: '/profile', icon: User },
];

const premiumItems = [
  { label: 'Paycheck Flow', path: '/insights/paycheck', icon: Wallet },
  { label: 'Heatmap', path: '/insights/heatmap', icon: CalendarDays },
  { label: 'Regret Tracker', path: '/insights/regret', icon: Clock },
  { label: 'Simulator', path: '/insights/simulator', icon: TrendingUp },
  { label: 'Subscriptions', path: '/insights/subscriptions', icon: CreditCard },
  { label: 'Personality', path: '/insights/personality', icon: User },
  { label: 'Deals', path: '/insights/deals', icon: Tag },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar fixed h-screen z-30">
      <div className="p-6">
        <Logo />
      </div>

      <div className="px-4 pb-6">
        <Link
          to="/check"
          className={`flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3 font-semibold text-sm transition-all ${
            location.pathname === '/check'
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          <ScanSearch className="w-4 h-4" />
          Check a purchase
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-2 pb-4">
        <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-4 mb-2">Premium</p>
        <div className="space-y-0.5">
          {premiumItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-2 text-sm transition-colors ${active ? 'bg-sidebar-accent text-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
            {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => base44.auth.logout('/login')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/5 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}