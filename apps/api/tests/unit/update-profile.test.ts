import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';

import { UpdateProfileUseCase } from '../../src/usecases/UpdateProfileUseCase';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../../src/shared/errors';

describe('UpdateProfileUseCase', () => {
  let userRepoMock: Mocked<IUserRepository>;
  let useCase: UpdateProfileUseCase;

  beforeEach(() => {
    userRepoMock = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    useCase = new UpdateProfileUseCase(userRepoMock);
  });

  it('throws ValidationError if name is empty', async () => {
    await expect(useCase.execute('user1', { name: '   ' })).rejects.toThrow(ValidationError);
    await expect(useCase.execute('user1', { name: '' })).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError if user not found', async () => {
    userRepoMock.findById.mockResolvedValue(null);
    await expect(useCase.execute('user1', { name: 'New Name' })).rejects.toThrow(NotFoundError);
  });

  it('updates and returns user', async () => {
    const dateStr = new Date().toISOString();
    userRepoMock.findById.mockResolvedValue({
      id: 'user1',
      name: 'Old Name',
      email: 'test@test.com',
      createdAt: dateStr,
      onboardingCompletedAt: null,
    });

    userRepoMock.update.mockResolvedValue({
      id: 'user1',
      name: 'New Name Trimmed',
      email: 'test@test.com',
      createdAt: dateStr,
      onboardingCompletedAt: null,
    });

    const result = await useCase.execute('user1', {
      name: '  New Name Trimmed  ',
    });

    expect(userRepoMock.update).toHaveBeenCalledWith('user1', {
      name: 'New Name Trimmed',
    });
    expect(result).toEqual({
      id: 'user1',
      name: 'New Name Trimmed',
      email: 'test@test.com',
      createdAt: dateStr,
      onboardingCompletedAt: null,
    });
  });
});
