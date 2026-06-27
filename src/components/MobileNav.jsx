import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu, Home, BarChart3, Target, Trophy, MessageCircle, Calendar, Bell, User,
  Heart, Shield, Brain, Wallet, CalendarDays, Clock, TrendingUp, CreditCard,
  Droplets, ScanSearch, Tag
} from 'lucide-react';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Insights', path: '/insights', icon: BarChart3 },
  { label: 'Goals', path: '/goals', icon: Target },
  { label: 'Challenges', path: '/challenges', icon: Trophy },
  { label: 'Assistant', path: '/assistant', icon: MessageCircle },
  { label: 'Future Feed', path: '/insights/future-feed', icon: Calendar },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Profile', path: '/profile', icon: User },
];

const premiumItems = [
  { label: 'Financial Health', path: '/insights/health', icon: Heart },
  { label: 'Shopping Shield', path: '/shield', icon: Shield },
  { label: 'Financial Twin', path: '/insights/financial-twin', icon: Brain },
  { label: 'Paycheck Flow', path: '/insights/paycheck', icon: Wallet },
  { label: 'Heatmap', path: '/insights/heatmap', icon: CalendarDays },
  { label: 'Regret Tracker', path: '/insights/regret', icon: Clock },
  { label: 'Simulator', path: '/insights/simulator', icon: TrendingUp },
  { label: 'Subscriptions', path: '/insights/subscriptions', icon: CreditCard },
  { label: 'Personality', path: '/insights/personality', icon: User },
  { label: 'Deals', path: '/insights/deals', icon: Tag },
  { label: 'Money Leaks', path: '/insights/money-leaks', icon: Droplets },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground hover:bg-accent transition-colors" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
        <div className="p-6 pb-4">
          <span className="font-bold text-foreground text-lg">Vesper</span>
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
                onClick={() => setOpen(false)}
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
        <div className="px-4 pt-4 pb-6">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-4 mb-2">Premium</p>
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
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}