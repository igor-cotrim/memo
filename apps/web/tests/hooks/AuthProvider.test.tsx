import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from '../../src/hooks/AuthProvider';
import { useAuth } from '../../src/hooks/useAuth';
import * as api from '../../src/services/api';

vi.mock('../../src/services/api');

const mockedApi = vi.mocked(api);

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
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('sets isLoading=false and user=null when no token', async () => {
    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('calls getMe and sets user when token exists', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('fake-token');
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

  it('removes token and finishes loading when getMe fails', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('bad-token');
    mockedApi.getMe.mockRejectedValue(new Error('Unauthorized'));

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
  });

  it('login calls api.login and sets user', async () => {
    const user = userEvent.setup();
    mockedApi.login.mockResolvedValue({
      user: {
        id: '1',
        email: 'a@b.com',
        name: 'Jane',
        createdAt: new Date().toISOString(),
        onboardingCompletedAt: null,
      },
      accessToken: 'tok',
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Jane');
    });
    expect(mockedApi.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pass',
    });
  });

  it('register calls api.register and sets user', async () => {
    const user = userEvent.setup();
    mockedApi.register.mockResolvedValue({
      user: {
        id: '2',
        email: 'a@b.com',
        name: 'Test',
        createdAt: '',
        onboardingCompletedAt: null,
      },
      accessToken: 'tok',
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test');
    });
    expect(mockedApi.register).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: 'Test',
      password: 'pass',
    });
  });

  it('logout calls api.logout and sets user to null', async () => {
    const user = userEvent.setup();
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('fake-token');
    mockedApi.getMe.mockResolvedValue({
      user: {
        id: '1',
        email: 'a@b.com',
        name: 'John',
        createdAt: '',
        onboardingCompletedAt: null,
      },
    });
    mockedApi.logout.mockResolvedValue(undefined);

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('John');
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none');
    });
    expect(mockedApi.logout).toHaveBeenCalled();
  });
});
