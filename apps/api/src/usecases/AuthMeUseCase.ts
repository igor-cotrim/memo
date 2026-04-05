import type { IUserRepository } from '../domain/repositories/IUserRepository';
import { UnauthorizedError } from '../shared/errors';
import type { User } from '@flashcard-app/shared-types';

export class AuthMeUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string): Promise<{ user: User }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return { user };
  }
}
