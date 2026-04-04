import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useFormValidation } from '../../src/hooks/useFormValidation';

const mockT = vi.fn((key: string) => {
  const map: Record<string, string> = {
    'validation.required': 'This field is required',
    'validation.email': 'Please enter a valid email address',
    'validation.minLength': 'Must be at least {min} characters',
    'validation.passwordMismatch': 'Passwords do not match',
  };
  return map[key] ?? key;
});

describe('useFormValidation', () => {
  it('returns no errors for valid fields', () => {
    const { result } = renderHook(() => useFormValidation({ name: { required: true } }, mockT));

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({ name: 'John' });
    });

    expect(isValid!).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('validates required fields', () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: { required: true }, email: { required: true } }, mockT),
    );

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({ name: '', email: '' });
    });

    expect(isValid!).toBe(false);
    expect(result.current.errors.name).toBe('This field is required');
    expect(result.current.errors.email).toBe('This field is required');
  });

  it('treats whitespace-only as empty for required', () => {
    const { result } = renderHook(() => useFormValidation({ name: { required: true } }, mockT));

    act(() => {
      result.current.validate({ name: '   ' });
    });

    expect(result.current.errors.name).toBe('This field is required');
  });

  it('validates email format', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: { required: true, email: true } }, mockT),
    );

    act(() => {
      result.current.validate({ email: 'not-an-email' });
    });

    expect(result.current.errors.email).toBe('Please enter a valid email address');
  });

  it('accepts valid email addresses', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: { required: true, email: true } }, mockT),
    );

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({ email: 'user@example.com' });
    });

    expect(isValid!).toBe(true);
    expect(result.current.errors.email).toBeUndefined();
  });

  it('validates minLength', () => {
    const { result } = renderHook(() =>
      useFormValidation({ password: { required: true, minLength: 6 } }, mockT),
    );

    act(() => {
      result.current.validate({ password: 'abc' });
    });

    expect(result.current.errors.password).toBe('Must be at least 6 characters');
  });

  it('passes minLength when value is long enough', () => {
    const { result } = renderHook(() =>
      useFormValidation({ password: { required: true, minLength: 6 } }, mockT),
    );

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({ password: 'abcdef' });
    });

    expect(isValid!).toBe(true);
  });

  it('validates with custom rule', () => {
    const { result } = renderHook(() =>
      useFormValidation(
        {
          confirmPassword: {
            required: true,
            custom: (val, fields) => (val !== fields.password ? 'Passwords do not match' : null),
          },
        },
        mockT,
      ),
    );

    act(() => {
      result.current.validate({
        confirmPassword: 'abc',
        password: 'xyz',
      } as Record<string, string>);
    });

    expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
  });

  it('custom rule passes when valid', () => {
    const { result } = renderHook(() =>
      useFormValidation(
        {
          confirmPassword: {
            required: true,
            custom: (val, fields) => (val !== fields.password ? 'Passwords do not match' : null),
          },
        },
        mockT,
      ),
    );

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({
        confirmPassword: 'same',
        password: 'same',
      } as Record<string, string>);
    });

    expect(isValid!).toBe(true);
  });

  it('clearFieldError removes a single field error', () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: { required: true }, email: { required: true } }, mockT),
    );

    act(() => {
      result.current.validate({ name: '', email: '' });
    });

    expect(result.current.errors.name).toBeDefined();
    expect(result.current.errors.email).toBeDefined();

    act(() => {
      result.current.clearFieldError('name');
    });

    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.errors.email).toBeDefined();
  });

  it('clearFieldError is a no-op for non-existent field', () => {
    const { result } = renderHook(() => useFormValidation({ name: { required: true } }, mockT));

    act(() => {
      result.current.validate({ name: '' });
    });

    const errorsBefore = result.current.errors;

    act(() => {
      result.current.clearFieldError('email' as never);
    });

    // Same reference — no state update
    expect(result.current.errors).toBe(errorsBefore);
  });

  it('clearErrors removes all errors', () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: { required: true }, email: { required: true } }, mockT),
    );

    act(() => {
      result.current.validate({ name: '', email: '' });
    });

    expect(Object.keys(result.current.errors).length).toBe(2);

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });

  it('prioritizes required over email validation', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: { required: true, email: true } }, mockT),
    );

    act(() => {
      result.current.validate({ email: '' });
    });

    expect(result.current.errors.email).toBe('This field is required');
  });

  it('skips email check for empty non-required field', () => {
    const { result } = renderHook(() => useFormValidation({ email: { email: true } }, mockT));

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({ email: '' });
    });

    expect(isValid!).toBe(true);
  });
});
