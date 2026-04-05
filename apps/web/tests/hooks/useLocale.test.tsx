import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import { LocaleProvider } from '../../src/hooks/LocaleProvider';
import { useLocale } from '../../src/hooks/useLocale';

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

describe('useLocale', () => {
  it('throws when used outside LocaleProvider', () => {
    expect(() => {
      renderHook(() => useLocale());
    }).toThrow('useLocale must be used within a LocaleProvider');
  });

  it('defaults to English locale', () => {
    const { result } = renderHook(() => useLocale(), { wrapper: Wrapper });
    expect(result.current.locale).toBe('en');
    expect(result.current.localeLabel).toBe('EN');
  });

  it('translates a simple key correctly', () => {
    const { result } = renderHook(() => useLocale(), { wrapper: Wrapper });
    const translated = result.current.t('login.title');
    expect(typeof translated).toBe('string');
    expect(translated.length).toBeGreaterThan(0);
    expect(translated).not.toBe('login.title'); // Should not return the key itself
  });

  it('returns key as fallback for non-existent path', () => {
    const { result } = renderHook(() => useLocale(), { wrapper: Wrapper });
    // Using a very deep invalid path
    const value = result.current.t('nonexistent.deeply.nested' as never);
    expect(value).toBe('nonexistent.deeply.nested');
  });

  it('tArray returns an array for known keys', () => {
    const { result } = renderHook(() => useLocale(), { wrapper: Wrapper });
    const months = result.current.tArray('activity.months');
    expect(Array.isArray(months)).toBe(true);
    expect(months.length).toBe(12);
  });

  it('tArray returns [key] as fallback for non-existent path', () => {
    const { result } = renderHook(() => useLocale(), { wrapper: Wrapper });
    const value = result.current.tArray('nonexistent.path' as never);
    expect(value).toEqual(['nonexistent.path']);
  });

  it('toggleLocale switches between en and pt-BR', () => {
    const { result } = renderHook(() => useLocale(), { wrapper: Wrapper });
    expect(result.current.locale).toBe('en');

    act(() => {
      result.current.toggleLocale();
    });

    expect(result.current.locale).toBe('pt-BR');
    expect(result.current.localeLabel).toBe('PT');

    act(() => {
      result.current.toggleLocale();
    });

    expect(result.current.locale).toBe('en');
  });

  it('setLocale persists to localStorage', () => {
    const { result } = renderHook(() => useLocale(), { wrapper: Wrapper });

    act(() => {
      result.current.setLocale('pt-BR');
    });

    expect(result.current.locale).toBe('pt-BR');
    expect(localStorage.setItem).toHaveBeenCalledWith('memo-locale', 'pt-BR');
  });

  it('reads initial locale from localStorage', () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('pt-BR');

    const { result } = renderHook(() => useLocale(), { wrapper: Wrapper });
    expect(result.current.locale).toBe('pt-BR');
  });
});
