import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type {
  IRefreshTokenRepository,
  RefreshTokenData,
} from '../../domain/repositories/IRefreshTokenRepository';
import * as schema from './schema';

export class PgRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async create(data: RefreshTokenData): Promise<RefreshTokenData> {
    await this.db.insert(schema.refreshTokens).values({
      id: data.id,
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
      revokedAt: data.revokedAt,
    });
    return data;
  }

  async findByToken(token: string): Promise<RefreshTokenData | null> {
    const rows = await this.db
      .select()
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.token, token));
    return rows[0] ?? null;
  }

  async deleteByToken(token: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.refreshTokens)
      .where(eq(schema.refreshTokens.token, token))
      .returning({ id: schema.refreshTokens.id });
    return result.length > 0;
  }

  async revokeByToken(token: string): Promise<boolean> {
    const result = await this.db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(schema.refreshTokens.token, token))
      .returning({ id: schema.refreshTokens.id });
    return result.length > 0;
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
  }
}
