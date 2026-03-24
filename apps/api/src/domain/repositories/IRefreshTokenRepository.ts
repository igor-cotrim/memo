export interface RefreshTokenData {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface IRefreshTokenRepository {
  create(data: RefreshTokenData): Promise<RefreshTokenData>;
  findByToken(token: string): Promise<RefreshTokenData | null>;
  deleteByToken(token: string): Promise<boolean>;
  deleteAllByUserId(userId: string): Promise<void>;
}
