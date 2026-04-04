import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import type { IUserRepository } from '../domain/repositories/IUserRepository';
import type { IRefreshTokenRepository } from '../domain/repositories/IRefreshTokenRepository';
import { UnauthorizedError } from '../shared/errors';

const ACCESS_TOKEN_EXPIRY = '30m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtSecret: string,
  ) {}

  async execute(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const storedToken = await this.refreshTokenRepo.findByToken(token);
    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      // Reuse of a revoked token detected. Revoke all tokens for this user.
      await this.refreshTokenRepo.deleteAllByUserId(storedToken.userId);
      throw new UnauthorizedError('Suspicious activity detected. All sessions revoked.');
    }

    if (new Date(storedToken.expiresAt) < new Date()) {
      await this.refreshTokenRepo.deleteByToken(token);
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await this.userRepo.findById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Revoke old token instead of deleting it
    await this.refreshTokenRepo.revokeByToken(token);

    // Issue new pair
    const accessToken = jwt.sign({ userId: user.id }, this.jwtSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const newRefreshToken = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.refreshTokenRepo.create({
      id: uuidv4(),
      userId: user.id,
      token: newRefreshToken,
      expiresAt: expiresAt.toISOString(),
      createdAt: now,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
