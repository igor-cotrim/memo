import bcrypt from 'bcrypt';

import type { ChangePasswordRequest } from '@flashcard-app/shared-types';
import type { IUserRepository } from '../domain/repositories/IUserRepository';
import { NotFoundError, UnauthorizedError, ValidationError } from '../shared/errors';

const SALT_ROUNDS = 10;

export class ChangePasswordUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, input: ChangePasswordRequest): Promise<void> {
    if (!input.newPassword || input.newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const passwordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await this.userRepo.update(userId, { passwordHash });
  }
}
