import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type {
  IRefreshTokenRepository,
  RefreshTokenData,
} from "../../domain/repositories/IRefreshTokenRepository";
import * as schema from "./schema";

export class SqliteRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: BetterSQLite3Database<typeof schema>) {}

  async create(data: RefreshTokenData): Promise<RefreshTokenData> {
    this.db
      .insert(schema.refreshTokens)
      .values({
        id: data.id,
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt,
      })
      .run();
    return data;
  }

  async findByToken(token: string): Promise<RefreshTokenData | null> {
    const row = this.db
      .select()
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.token, token))
      .get();
    return row ?? null;
  }

  async deleteByToken(token: string): Promise<boolean> {
    const result = this.db
      .delete(schema.refreshTokens)
      .where(eq(schema.refreshTokens.token, token))
      .run();
    return result.changes > 0;
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    this.db
      .delete(schema.refreshTokens)
      .where(eq(schema.refreshTokens.userId, userId))
      .run();
  }
}
