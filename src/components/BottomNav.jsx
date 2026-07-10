import { Link, useLocation } from 'react-router-dom';
import { Home, Target, ScanSearch, BarChart3, User, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function NavItem({ item, active }) {
  const { t } = useLanguage();
  return (
    <Link
      to={item.path}
      className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <item.icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
    </Link>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  const items = [
    { labelKey: 'nav.home', path: '/', icon: Home },
    { labelKey: 'nav.finances', path: '/insights', icon: BarChart3 },
    { labelKey: 'nav.advisor', path: '/assistant', icon: MessageCircle },
    { labelKey: 'nav.profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-lg border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-2 py-2 pb-3">
        <NavItem item={items[0]} active={location.pathname === '/'} />
        <NavItem item={items[1]} active={location.pathname.startsWith('/insights')} />

        <Link to="/check" className="flex flex-col items-center -mt-7">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              location.pathname === '/check'
                ? 'bg-primary scale-105'
                : 'bg-primary'
            } text-primary-foreground`}
          >
            <ScanSearch className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-medium mt-0.5 text-primary">{t('nav.ask')}</span>
        </Link>

        <NavItem item={items[2]} active={location.pathname === '/assistant'} />
        <NavItem item={items[3]} active={location.pathname === '/profile' || location.pathname.startsWith('/notifications') || location.pathname.startsWith('/shield')} />
      </div>
    </nav>
  );
}