import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { translations, languages } from './translations';

const LanguageContext = createContext();

const STORAGE_KEY = 'nudigo_language';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'en';
    }
    return 'en';
  });

  const dir = lang === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, dir]);

  // Sync language from user profile on mount (once)
  useEffect(() => {
    base44.entities.UserProfile.list()
      .then(profiles => {
        const profile = profiles[0];
        if (profile?.language && profile.language !== lang) {
          setLangState(profile.language);
        }
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    // Persist to user profile if logged in
    base44.entities.UserProfile.list()
      .then(profiles => {
        if (profiles[0]) {
          return base44.entities.UserProfile.update(profiles[0].id, { language: newLang });
        }
      })
      .catch(() => {});
  }, [lang]);

  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback for components outside provider
    return {
      lang: 'en',
      setLang: () => {},
      t: (key) => translations.en[key] ?? key,
      dir: 'ltr',
      languages,
    };
  }
  return ctx;
}