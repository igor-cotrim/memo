import { eq, and, gte } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type {
  IReviewLogRepository,
  ReviewLog,
} from '../../domain/repositories/IReviewLogRepository';
import * as schema from './schema';

export class PgReviewLogRepository implements IReviewLogRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async create(log: ReviewLog): Promise<ReviewLog> {
    await this.db.insert(schema.reviewLogs).values({
      id: log.id,
      cardId: log.cardId,
      userId: log.userId,
      quality: log.quality,
      reviewedAt: log.reviewedAt,
    });
    return log;
  }

  async findByUserId(userId: string, since: string): Promise<ReviewLog[]> {
    const rows = await this.db
      .select()
      .from(schema.reviewLogs)
      .where(and(eq(schema.reviewLogs.userId, userId), gte(schema.reviewLogs.reviewedAt, since)));
    return rows.map(this.toLog);
  }

  async findByDeckId(deckId: string, since: string): Promise<ReviewLog[]> {
    const rows = await this.db
      .select({ log: schema.reviewLogs })
      .from(schema.reviewLogs)
      .innerJoin(schema.flashcards, eq(schema.reviewLogs.cardId, schema.flashcards.id))
      .where(and(eq(schema.flashcards.deckId, deckId), gte(schema.reviewLogs.reviewedAt, since)));
    return rows.map((r) => this.toLog(r.log));
  }

  async getReviewDates(userId: string, timezoneOffset: number = 0): Promise<string[]> {
    const rows = await this.db
      .select({ reviewedAt: schema.reviewLogs.reviewedAt })
      .from(schema.reviewLogs)
      .where(eq(schema.reviewLogs.userId, userId));
    return rows.map((r) => {
      const date = new Date(r.reviewedAt);
      const localMs = date.getTime() - timezoneOffset * 60 * 1000;
      return new Date(localMs).toISOString().split('T')[0]!;
    });
  }

  private toLog(row: typeof schema.reviewLogs.$inferSelect): ReviewLog {
    return {
      id: row.id,
      cardId: row.cardId,
      userId: row.userId,
      quality: row.quality,
      reviewedAt: row.reviewedAt,
    };
  }
}
