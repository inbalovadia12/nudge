import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Globe, Check } from 'lucide-react';

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = languages.find(l => l.code === lang) || languages[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg transition-colors text-muted-foreground hover:text-primary hover:bg-primary/5 ${compact ? 'w-8 h-8 justify-center' : 'px-3 py-1.5'}`}
        title={current.label}
      >
        <Globe className="w-4 h-4" />
        {!compact && <span className="text-xs font-medium">{current.flag} {current.label}</span>}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 rtl:left-auto rtl:right-0 min-w-[140px] rounded-xl border border-border bg-popover shadow-lg z-50 py-1">
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent/50 ${lang === l.code ? 'text-primary font-medium' : 'text-foreground'}`}
            >
              <span className="flex items-center gap-2">{l.flag} {l.label}</span>
              {lang === l.code && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}