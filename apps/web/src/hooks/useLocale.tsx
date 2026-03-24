import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";

import { locales, defaultLocale, localeLabels } from "../i18n";
import type { Locale, Translations } from "../i18n";

const STORAGE_KEY = "flashmind-locale";

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in locales) return stored as Locale;
  } catch {
    // SSR or storage unavailable
  }
  return defaultLocale;
}

type NestedKeyOf<T> = T extends readonly unknown[]
  ? never
  : T extends object
    ? {
        [K in keyof T & string]: T[K] extends object
          ? T[K] extends readonly unknown[]
            ? K
            : `${K}` | `${K}.${NestedKeyOf<T[K]>}`
          : K;
      }[keyof T & string]
    : never;

type TranslationKey = NestedKeyOf<Translations>;

function getNestedValue(obj: Translations, path: string): unknown {
  let current: unknown = obj;
  for (const key of path.split(".")) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current ?? path;
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  tArray: (key: TranslationKey) => readonly string[];
  localeLabel: string;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

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
    setLocale(locale === "en" ? "pt-BR" : "en");
  }, [locale, setLocale]);

  const translations = locales[locale];

  const t = useCallback(
    (key: TranslationKey): string => {
      const value = getNestedValue(translations, key);
      return typeof value === "string" ? value : key;
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

  const value = useMemo<LocaleContextValue>(
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

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
