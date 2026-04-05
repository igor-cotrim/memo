import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import { locales, defaultLocale, localeLabels } from '../locale';
import type { Locale } from '../locale';
import { LocaleContext } from './useLocale';
import type { TranslationKey } from './useLocale';

const STORAGE_KEY = 'memo-locale';

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in locales) return stored as Locale;
  } catch {
    // SSR or storage unavailable
  }
  return defaultLocale;
}

function getNestedValue(obj: (typeof locales)[Locale], path: string): unknown {
  let current: unknown = obj;
  for (const key of path.split('.')) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current ?? path;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Storage unavailable
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'pt-BR' : 'en');
  }, [locale, setLocale]);

  const translations = locales[locale];

  const t = useCallback(
    (key: TranslationKey): string => {
      const value = getNestedValue(translations, key);
      return typeof value === 'string' ? value : key;
    },
    [translations],
  );

  const tArray = useCallback(
    (key: TranslationKey): readonly string[] => {
      const value = getNestedValue(translations, key);
      return Array.isArray(value) ? value : [key];
    },
    [translations],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      tArray,
      localeLabel: localeLabels[locale],
      toggleLocale,
    }),
    [locale, setLocale, t, tArray, toggleLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
