import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from '../../src/hooks/AuthProvider';
import { useAuth } from '../../src/hooks/useAuth';
import * as api from '../../src/services/api';

vi.mock('../../src/services/api');
vi.mock('../../src/lib/supabase', () => {
  const mockSubscription = { unsubscribe: vi.fn() };
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: mockSubscription },
        }),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      },
    },
  };
});

import { supabase } from '../../src/lib/supabase';

const mockedApi = vi.mocked(api);
const mockedSupabase = supabase as any;

// A component that exposes auth state for testing
function AuthConsumer() {
  const { user, isLoading, login, logout, register } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.name : 'none'}</span>
      <button onClick={() => login('a@b.com', 'pass')}>Login</button>
      <button onClick={() => register('a@b.com', 'Test', 'pass')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);
    mockedSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);
  });

  it('sets isLoading=false and user=null when no session', async () => {
    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('calls getMe and sets user when session exists', async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);
    mockedApi.getMe.mockResolvedValue({
      user: {
        id: '1',
        email: 'a@b.com',
        name: 'John',
        createdAt: new Date().toISOString(),
        onboardingCompletedAt: null,
      },
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('John');
    });
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('login calls supabase signIn and api.getMe', async () => {
    const user = userEvent.setup();
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);
    mockedApi.getMe.mockResolvedValue({
      user: {
        id: '1',
        email: 'a@b.com',
        name: 'Jane',
        createdAt: new Date().toISOString(),
        onboardingCompletedAt: null,
      },
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Jane');
    });
    expect(mockedSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pass',
    });
  });

  it('register calls supabase signUp and api.registerUser', async () => {
    const user = userEvent.setup();
    mockedSupabase.auth.signUp.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);
    mockedApi.registerUser.mockResolvedValue({
      user: {
        id: '2',
        email: 'a@b.com',
        name: 'Test',
        createdAt: '',
        onboardingCompletedAt: null,
      },
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test');
    });
    expect(mockedSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pass',
    });
    expect(mockedApi.registerUser).toHaveBeenCalledWith('Test');
  });

  it('logout calls supabase signOut and clears user', async () => {
    const user = userEvent.setup();
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);
    mockedApi.getMe.mockResolvedValue({
      user: {
        id: '1',
        email: 'a@b.com',
        name: 'John',
        createdAt: '',
        onboardingCompletedAt: null,
      },
    });
    mockedSupabase.auth.signOut.mockResolvedValue({ error: null } as any);

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('John');
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none');
    });
    expect(mockedSupabase.auth.signOut).toHaveBeenCalled();
  });
});
