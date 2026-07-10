import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu, Home, BarChart3, Target, Trophy, MessageCircle, Calendar, Bell, User,
  Heart, Shield, Brain, Wallet, CalendarDays, Clock, TrendingUp, CreditCard,
  Droplets, ScanSearch, Tag, Lock, Sparkle
} from 'lucide-react';
import AdminPanel from './AdminPanel';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const navItems = [
  { labelKey: 'nav.home', path: '/', icon: Home },
  { labelKey: 'nav.insights', path: '/insights', icon: BarChart3 },
  { labelKey: 'nav.goals', path: '/goals', icon: Target },
  { labelKey: 'nav.challenges', path: '/challenges', icon: Trophy },
  { labelKey: 'nav.assistant', path: '/assistant', icon: MessageCircle },
  { labelKey: 'nav.futureFeed', path: '/insights/future-feed', icon: Calendar },
  { labelKey: 'nav.notifications', path: '/notifications', icon: Bell },
  { labelKey: 'nav.profile', path: '/profile', icon: User },
  { labelKey: 'nav.moreProjects', path: '/more-projects', icon: Sparkle },
];

const premiumItems = [
  { labelKey: 'nav.financialHealth', path: '/insights/health', icon: Heart },
  { labelKey: 'nav.shoppingShield', path: '/shield', icon: Shield },
  { labelKey: 'nav.financialTwin', path: '/insights/financial-twin', icon: Brain },
  { labelKey: 'nav.paycheckFlow', path: '/insights/paycheck', icon: Wallet },
  { labelKey: 'nav.heatmap', path: '/insights/heatmap', icon: CalendarDays },
  { labelKey: 'nav.regretTracker', path: '/insights/regret', icon: Clock },
  { labelKey: 'nav.simulator', path: '/insights/simulator', icon: TrendingUp },
  { labelKey: 'nav.subscriptions', path: '/insights/subscriptions', icon: CreditCard },
  { labelKey: 'nav.personality', path: '/insights/personality', icon: User },
  { labelKey: 'nav.deals', path: '/insights/deals', icon: Tag },
  { labelKey: 'nav.moneyLeaks', path: '/insights/money-leaks', icon: Droplets },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground hover:bg-accent transition-colors" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
        <div className="p-6 pb-4 flex items-center justify-between">
          <span className="font-bold text-foreground text-lg">{t('layout.appName')}</span>
          <div className="flex items-center gap-1">
            <LanguageSwitcher compact />
            <button
              onClick={() => setAdminOpen(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-primary transition-colors"
              aria-label={t('common.admin')}
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Link
            to="/check"
            onClick={() => setOpen(false)}
            className={`flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3 font-semibold text-sm transition-all ${
              location.pathname === '/check'
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            <ScanSearch className="w-4 h-4" />
            {t('nav.checkPurchase')}
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pt-4 pb-6">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-4 mb-2">{t('common.premium')}</p>
          <div className="space-y-0.5">
            {premiumItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2 text-sm transition-colors ${active ? 'bg-sidebar-accent text-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      </SheetContent>
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} />
    </Sheet>
  );
}