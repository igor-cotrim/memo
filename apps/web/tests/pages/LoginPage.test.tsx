import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginPage from '../../src/pages/LoginPage';
import { renderWithProviders } from '../test-utils';

describe('LoginPage', () => {
  it('renders login form', () => {
    renderWithProviders(<LoginPage />);

    // en locale: "Welcome back"
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('submits login form successfully', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<LoginPage />, { auth: { login } });

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByText('Sign In'));

    expect(login).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

    renderWithProviders(<LoginPage />, { auth: { login } });

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();
    let resolveLogin!: () => void;
    const login = vi.fn(() => new Promise<void>((r) => (resolveLogin = r)));

    renderWithProviders(<LoginPage />, { auth: { login } });

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByText('Sign In'));

    // en locale: "Signing in…"
    expect(screen.getByText('Signing in…')).toBeInTheDocument();

    resolveLogin();
    await waitFor(() => {
      expect(screen.queryByText('Signing in…')).not.toBeInTheDocument();
    });
  });

  it('has a link to register page', () => {
    renderWithProviders(<LoginPage />);

    // en locale: "Create one"
    expect(screen.getByText('Create one')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    const login = vi.fn();

    renderWithProviders(<LoginPage />, { auth: { login } });

    await user.click(screen.getByText('Sign In'));

    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((a) => a.textContent === 'This field is required')).toBe(true);
    expect(login).not.toHaveBeenCalled();
  });

  it('shows email validation error for invalid email', async () => {
    const user = userEvent.setup();
    const login = vi.fn();

    renderWithProviders(<LoginPage />, { auth: { login } });

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByText('Sign In'));

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('clears field error when user starts typing', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    // Submit empty to trigger errors
    await user.click(screen.getByText('Sign In'));
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);

    // Type in email field to clear its error
    await user.type(screen.getByLabelText('Email'), 'a');

    // The email field error should be cleared
    const emailField = screen.getByLabelText('Email');
    const emailGroup = emailField.closest('.flex.flex-col')!;
    expect(emailGroup.querySelector('[role="alert"]')).toBeNull();
  });
});
