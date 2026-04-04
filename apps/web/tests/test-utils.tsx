import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LocaleProvider } from '../src/hooks/useLocale';
import { AuthContext, type AuthContextType } from '../src/hooks/authContext';

const defaultAuth: AuthContextType = {
  user: null,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
};

export function renderWithProviders(
  ui: ReactNode,
  { auth = defaultAuth, route = '/' }: { auth?: Partial<AuthContextType>; route?: string } = {},
): RenderResult & { auth: AuthContextType } {
  const mergedAuth = { ...defaultAuth, ...auth };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LocaleProvider>
        <MemoryRouter initialEntries={[route]}>
          <AuthContext.Provider value={mergedAuth}>{children}</AuthContext.Provider>
        </MemoryRouter>
      </LocaleProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper });

  return {
    ...result,
    auth: mergedAuth,
  };
}

export function renderWithLocale(ui: ReactNode): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return <LocaleProvider>{children}</LocaleProvider>;
  }

  return render(ui, { wrapper: Wrapper });
}
