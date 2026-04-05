import type { SupabaseClient } from '@supabase/supabase-js';

import type { ChangePasswordRequest } from '@flashcard-app/shared-types';
import { ValidationError } from '../shared/errors';

export class ChangePasswordUseCase {
  constructor(private readonly supabase: SupabaseClient) {}

  async execute(userId: string, input: ChangePasswordRequest): Promise<void> {
    if (!input.newPassword || input.newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      password: input.newPassword,
    });

    if (error) {
      throw new ValidationError(error.message);
    }
  }
}
