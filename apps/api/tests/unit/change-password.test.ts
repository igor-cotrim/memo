import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import bcrypt from 'bcrypt';

import { User } from '@flashcard-app/shared-types';
import { ChangePasswordUseCase } from '../../src/usecases/ChangePasswordUseCase';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../src/shared/errors';

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('ChangePasswordUseCase', () => {
  let userRepoMock: Mocked<IUserRepository>;
  let useCase: ChangePasswordUseCase;

  beforeEach(() => {
    userRepoMock = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    useCase = new ChangePasswordUseCase(userRepoMock);
  });

  it('throws ValidationError if new password is too short', async () => {
    await expect(
      useCase.execute('user123', {
        currentPassword: 'old',
        newPassword: 'short',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError if user does not exist', async () => {
    userRepoMock.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('user123', {
        currentPassword: 'old',
        newPassword: 'newpassword',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws UnauthorizedError if current password does not match', async () => {
    userRepoMock.findById.mockResolvedValue({
      id: 'user123',
      name: 'Old Name',
      email: 'test@test.com',
      passwordHash: 'hash123',
      createdAt: new Date().toISOString(),
    } as User);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      useCase.execute('user123', {
        currentPassword: 'wrong',
        newPassword: 'newpassword',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("updates the user's password if current password is correct", async () => {
    userRepoMock.findById.mockResolvedValue({
      id: 'user123',
      name: 'Old Name',
      email: 'test@test.com',
      passwordHash: 'hash123',
      createdAt: new Date().toISOString(),
    } as User);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('newhash' as never);

    await useCase.execute('user123', {
      currentPassword: 'old',
      newPassword: 'newpassword',
    });

    expect(bcrypt.compare).toHaveBeenCalledWith('old', 'hash123');
    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    expect(userRepoMock.update).toHaveBeenCalledWith('user123', {
      passwordHash: 'newhash',
    });
  });
});
