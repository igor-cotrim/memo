import type { User } from '@flashcard-app/shared-types';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(
    id: string,
    data: Partial<Pick<User, 'name' | 'onboardingCompletedAt'>>,
  ): Promise<User>;
}
