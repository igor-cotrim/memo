import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SettingsPage from '../../src/pages/SettingsPage';
import * as api from '../../src/services/api';
import { supabase } from '../../src/lib/supabase';
import { renderWithProviders } from '../test-utils';

vi.mock('../../src/services/api');
const mockedApi = vi.mocked(api);
const mockedSupabase = supabase as any;

const testUser = {
  id: 'u-1',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile and password sections', () => {
    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Change Password', { selector: 'h2' })).toBeInTheDocument();
  });

  it('pre-fills name and email from user context', () => {
    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('email field is disabled', () => {
    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    expect(screen.getByDisplayValue('john@example.com')).toBeDisabled();
  });

  it('submits profile form successfully', async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn();
    mockedApi.updateProfile.mockResolvedValue({
      user: { ...testUser, name: 'Jane Doe' },
    });

    renderWithProviders(<SettingsPage />, {
      auth: { user: testUser, updateUser },
    });

    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');
    await user.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(mockedApi.updateProfile).toHaveBeenCalledWith({
        name: 'Jane Doe',
      });
    });
  });

  it('shows validation error when profile name is empty', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.click(screen.getByText('Save Profile'));

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(mockedApi.updateProfile).not.toHaveBeenCalled();
  });

  it('shows profile update success message', async () => {
    const user = userEvent.setup();
    mockedApi.updateProfile.mockResolvedValue({
      user: testUser,
    });

    renderWithProviders(<SettingsPage />, {
      auth: { user: testUser, updateUser: vi.fn() },
    });

    await user.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
    });
  });

  it('shows error when profile update fails', async () => {
    const user = userEvent.setup();
    mockedApi.updateProfile.mockRejectedValue(new Error('Server error'));

    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    await user.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('submits password form successfully', async () => {
    const user = userEvent.setup();
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    mockedApi.changePassword.mockResolvedValue(undefined);

    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    await user.type(screen.getByLabelText('Current Password'), 'oldpass');
    await user.type(screen.getByLabelText('New Password'), 'newpass123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await user.click(screen.getByText('Change Password', { selector: 'button' }));

    await waitFor(() => {
      expect(mockedApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      });
    });
  });

  it('shows validation errors when password form is empty', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    await user.click(screen.getByText('Change Password', { selector: 'button' }));

    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((a) => a.textContent === 'This field is required')).toBe(true);
    expect(mockedApi.changePassword).not.toHaveBeenCalled();
  });

  it('shows minLength error for short new password', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    await user.type(screen.getByLabelText('Current Password'), 'oldpass');
    await user.type(screen.getByLabelText('New Password'), 'abc');
    await user.type(screen.getByLabelText('Confirm New Password'), 'abc');
    await user.click(screen.getByText('Change Password', { selector: 'button' }));

    expect(screen.getAllByText('Must be at least 6 characters').length).toBeGreaterThanOrEqual(1);
    expect(mockedApi.changePassword).not.toHaveBeenCalled();
  });

  it('shows mismatch error when passwords do not match', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    await user.type(screen.getByLabelText('Current Password'), 'oldpass');
    await user.type(screen.getByLabelText('New Password'), 'newpass123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'different123');
    await user.click(screen.getByText('Change Password', { selector: 'button' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(mockedApi.changePassword).not.toHaveBeenCalled();
  });

  it('shows password change success message', async () => {
    const user = userEvent.setup();
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    mockedApi.changePassword.mockResolvedValue(undefined);

    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    await user.type(screen.getByLabelText('Current Password'), 'oldpass');
    await user.type(screen.getByLabelText('New Password'), 'newpass123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await user.click(screen.getByText('Change Password', { selector: 'button' }));

    await waitFor(() => {
      expect(screen.getByText('Password changed successfully')).toBeInTheDocument();
    });
  });

  it('shows error when password change fails', async () => {
    const user = userEvent.setup();
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    await user.type(screen.getByLabelText('Current Password'), 'wrong');
    await user.type(screen.getByLabelText('New Password'), 'newpass123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await user.click(screen.getByText('Change Password', { selector: 'button' }));

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
    });
  });

  it('clears field error when user starts typing', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />, { auth: { user: testUser } });

    // Clear name and submit to trigger error
    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.click(screen.getByText('Save Profile'));

    expect(screen.getByText('This field is required')).toBeInTheDocument();

    // Start typing to clear error
    await user.type(nameInput, 'J');

    expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
  });
});
