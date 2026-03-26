export interface RefreshTokenData {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string | null;
}

export interface IRefreshTokenRepository {
  create(data: RefreshTokenData): Promise<RefreshTokenData>;
  findByToken(token: string): Promise<RefreshTokenData | null>;
  revokeByToken(token: string): Promise<boolean>;
  deleteByToken(token: string): Promise<boolean>;
  deleteAllByUserId(userId: string): Promise<void>;
}
