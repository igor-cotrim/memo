import { describe, it, expect, beforeEach } from 'vitest';

import type { User } from '@flashcard-app/shared-types';
import { RegisterUseCase } from '../../src/usecases/RegisterUseCase';
import type { IUserRepository } from '../../src/domain/repositories/index';
import { ConflictError, ValidationError } from '../../src/shared/errors';

// ─── In-Memory Mock Repos ────────────────────────────────────────────────────

function createMockUserRepo(): IUserRepository {
  const users: User[] = [];
  return {
    async findById(id: string) {
      return users.find((u) => u.id === id) ?? null;
    },
    async findByEmail(email: string) {
      return users.find((u) => u.email === email) ?? null;
    },
    async create(user: User) {
      users.push(user);
      return user;
    },
    async update(id: string, data: Partial<Pick<User, 'name'>>) {
      const user = users.find((u) => u.id === id);
      if (!user) throw new Error('Not found');
      Object.assign(user, data);
      return user;
    },
  };
}

// ─── Register Use Case ──────────────────────────────────────────────────────

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let userRepo: IUserRepository;

  beforeEach(() => {
    userRepo = createMockUserRepo();
    useCase = new RegisterUseCase(userRepo);
  });

  it('should register a new user successfully', async () => {
    const result = await useCase.execute({
      userId: 'supabase-user-1',
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
    expect(result.user.id).toBe('supabase-user-1');
  });

  it('should throw ConflictError when user already exists', async () => {
    await useCase.execute({
      userId: 'supabase-user-1',
      email: 'test@example.com',
      name: 'Test User',
    });

    await expect(
      useCase.execute({
        userId: 'supabase-user-1',
        email: 'test@example.com',
        name: 'Another User',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should throw ValidationError for empty name', async () => {
    await expect(
      useCase.execute({
        userId: 'supabase-user-1',
        email: 'test@example.com',
        name: '',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
