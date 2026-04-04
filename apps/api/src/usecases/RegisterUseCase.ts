import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import type { RegisterRequest, AuthResponse } from '@flashcard-app/shared-types';
import type { IUserRepository } from '../domain/repositories/IUserRepository';
import type { IRefreshTokenRepository } from '../domain/repositories/IRefreshTokenRepository';
import { ConflictError, ValidationError } from '../shared/errors';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '30m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class RegisterUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtSecret: string,
  ) {}

  async execute(input: RegisterRequest): Promise<AuthResponse & { refreshToken: string }> {
    this.validate(input);

    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const now = new Date().toISOString();
    const userId = uuidv4();

    const user = await this.userRepo.create({
      id: userId,
      email: input.email,
      name: input.name,
      passwordHash,
      createdAt: now,
      onboardingCompletedAt: null,
    });

    const accessToken = jwt.sign({ userId: user.id }, this.jwtSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.refreshTokenRepo.create({
      id: uuidv4(),
      userId: user.id,
      token: refreshToken,
      expiresAt: expiresAt.toISOString(),
      createdAt: now,
    });

    const { passwordHash: _, ...publicUser } = user;

    return {
      user: publicUser,
      accessToken,
      refreshToken,
    };
  }

  private validate(input: RegisterRequest): void {
    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new ValidationError('Invalid email address');
    }
    if (!input.password || input.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }
  }
}
