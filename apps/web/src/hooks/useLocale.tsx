import { createContext, useContext } from 'react';

import type { Locale, Translations } from '../locale';

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

export type TranslationKey = NestedKeyOf<Translations>;

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  tArray: (key: TranslationKey) => readonly string[];
  localeLabel: string;
  toggleLocale: () => void;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
