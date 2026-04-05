import type { UpdateProfileRequest, User } from '@flashcard-app/shared-types';
import type { IUserRepository } from '../domain/repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../shared/errors';

export class UpdateProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, input: UpdateProfileRequest): Promise<User> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }

    const existing = await this.userRepo.findById(userId);
    if (!existing) {
      throw new NotFoundError('User', userId);
    }

    const updated = await this.userRepo.update(userId, {
      name: input.name.trim(),
    });

    return updated;
  }
}
