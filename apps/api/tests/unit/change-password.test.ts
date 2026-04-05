import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ChangePasswordUseCase } from '../../src/usecases/ChangePasswordUseCase';
import { ValidationError } from '../../src/shared/errors';

function createMockSupabase(updateResult = { data: {}, error: null as any }) {
  return {
    auth: {
      admin: {
        updateUserById: vi.fn().mockResolvedValue(updateResult),
      },
    },
  } as any;
}

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    useCase = new ChangePasswordUseCase(mockSupabase);
  });

  it('throws ValidationError if new password is too short', async () => {
    await expect(
      useCase.execute('user123', {
        currentPassword: 'old',
        newPassword: 'short',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('calls supabase admin to update password', async () => {
    await useCase.execute('user123', {
      currentPassword: 'old',
      newPassword: 'newpassword',
    });

    expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('user123', {
      password: 'newpassword',
    });
  });

  it('throws ValidationError if supabase returns error', async () => {
    mockSupabase = createMockSupabase({
      data: {},
      error: { message: 'Password too weak' },
    });
    useCase = new ChangePasswordUseCase(mockSupabase);

    await expect(
      useCase.execute('user123', {
        currentPassword: 'old',
        newPassword: 'newpassword',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
