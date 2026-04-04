import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import type { LoginRequest, AuthResponse } from '@flashcard-app/shared-types';
import type { IUserRepository } from '../domain/repositories/IUserRepository';
import type { IRefreshTokenRepository } from '../domain/repositories/IRefreshTokenRepository';
import { UnauthorizedError } from '../shared/errors';

const ACCESS_TOKEN_EXPIRY = '30m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtSecret: string,
  ) {}

  async execute(input: LoginRequest): Promise<AuthResponse & { refreshToken: string }> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = jwt.sign({ userId: user.id }, this.jwtSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = uuidv4();
    const now = new Date().toISOString();
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
}
