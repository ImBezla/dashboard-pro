'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppLocale } from './types';
import { getMessage } from './messages';

const PREFERENCES_KEY = 'dashboardpro_preferences';

export const PREFERENCES_CHANGED_EVENT = 'dashboardpro-preferences-changed';

function readLocaleFromStorage(): AppLocale {
  if (typeof window === 'undefined') return 'de';
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return 'de';
    const parsed = JSON.parse(raw) as { language?: string };
    return parsed.language === 'en' ? 'en' : 'de';
  } catch {
    return 'de';
  }
}

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('de');

  useEffect(() => {
    const sync = () => {
      const next = readLocaleFromStorage();
      setLocaleState(next);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next === 'en' ? 'en' : 'de';
      }
    };
    sync();
    window.addEventListener(PREFERENCES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PREFERENCES_CHANGED_EVENT, sync);
  }, []);

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l === 'en' ? 'en' : 'de';
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      return getMessage(locale, key);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocaleContext must be used within LocaleProvider');
  }
  return ctx;
}

/** Übersetzungen + aktuelle Locale (für date-fns etc.). */
export function useTranslation() {
  const { locale, t } = useLocaleContext();
  return { locale, t };
}
