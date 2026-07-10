import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Target, MessageCircle, ScanSearch, BarChart3, User, Trophy, LogOut, Shield, Heart, Bell, Calendar, Calculator, Search, Lock, Receipt, Sparkle } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import AdminPanel from './AdminPanel';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const navItems = [
  { labelKey: 'nav.home', path: '/', icon: Home },
  { labelKey: 'nav.transactions', path: '/transactions', icon: Receipt },
  { labelKey: 'nav.myFinances', path: '/insights', icon: BarChart3 },
  { labelKey: 'nav.goalsPlanning', path: '/goals', icon: Target },
  { labelKey: 'nav.challenges', path: '/challenges', icon: Trophy },
  { labelKey: 'nav.aiAdvisor', path: '/assistant', icon: MessageCircle },
  { labelKey: 'nav.forecast', path: '/insights/future-feed', icon: Calendar },
  { labelKey: 'nav.notifications', path: '/notifications', icon: Bell },
  { labelKey: 'nav.profile', path: '/profile', icon: User },
  { labelKey: 'nav.moreProjects', path: '/more-projects', icon: Sparkle }
];

const premiumItems = [
  { labelKey: 'nav.spendingGuard', path: '/shield', icon: Shield },
  { labelKey: 'nav.healthScore', path: '/insights/health', icon: Heart },
  { labelKey: 'nav.smartCalculators', path: '/insights/calculators', icon: Calculator },
  { labelKey: 'nav.aiDealFinder', path: '/insights/deal-finder', icon: Search },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar fixed h-screen z-30">
      <div className="p-6 flex-shrink-0">
        <Logo />
      </div>

      <div className="px-4 pb-4 flex-shrink-0">
        <Link
          to="/check"
          className={`flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3 font-semibold text-sm transition-all ${
          location.pathname === '/check' ?
          'bg-primary text-primary-foreground' :
          'bg-primary/10 text-primary hover:bg-primary/20'}`
          }>
          <ScanSearch className="w-4 h-4" />
          {t('nav.askBeforeYouBuy')}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4">
        <nav className="space-y-1 pb-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                active ?
                'bg-sidebar-accent text-foreground' :
                'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'}`
                }>
                <item.icon className="w-4 h-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="pt-3 pb-4">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-4 mb-2">{t('common.premium')}</p>
          <div className="space-y-0.5">
            {premiumItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2 text-sm transition-colors ${active ? 'bg-sidebar-accent text-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'}`}>
                  <item.icon className="w-4 h-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
            {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.full_name || t('common.user')}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <LanguageSwitcher compact />
          <button
            onClick={() => setAdminOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors"
            title={t('common.admin')}>
            <Lock className="w-3.5 h-3.5" />
          </button>
          <ThemeToggle />
          <button
            onClick={() => logout(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/5 transition-colors"
            title={t('common.signOut')}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} />
    </aside>
  );
}