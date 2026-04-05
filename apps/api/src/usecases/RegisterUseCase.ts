import type { AuthResponse } from '@flashcard-app/shared-types';
import type { IUserRepository } from '../domain/repositories/IUserRepository';
import { ConflictError, ValidationError } from '../shared/errors';

interface RegisterInput {
  userId: string;
  email: string;
  name: string;
}

export class RegisterUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: RegisterInput): Promise<AuthResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }

    const existingUser = await this.userRepo.findById(input.userId);
    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    const now = new Date().toISOString();

    const user = await this.userRepo.create({
      id: input.userId,
      email: input.email,
      name: input.name,
      createdAt: now,
      onboardingCompletedAt: null,
    });

    return { user };
  }
}
