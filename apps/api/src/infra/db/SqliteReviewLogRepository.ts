import { eq, and, gte } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type {
  IReviewLogRepository,
  ReviewLog,
} from "../../domain/repositories/IReviewLogRepository";
import * as schema from "./schema";

export class SqliteReviewLogRepository implements IReviewLogRepository {
  constructor(private readonly db: BetterSQLite3Database<typeof schema>) {}

  async create(log: ReviewLog): Promise<ReviewLog> {
    this.db
      .insert(schema.reviewLogs)
      .values({
        id: log.id,
        cardId: log.cardId,
        userId: log.userId,
        quality: log.quality,
        reviewedAt: log.reviewedAt,
      })
      .run();
    return log;
  }

  async findByUserId(userId: string, since: string): Promise<ReviewLog[]> {
    const rows = this.db
      .select()
      .from(schema.reviewLogs)
      .where(
        and(
          eq(schema.reviewLogs.userId, userId),
          gte(schema.reviewLogs.reviewedAt, since),
        ),
      )
      .all();
    return rows.map(this.toLog);
  }

  async findByDeckId(deckId: string, since: string): Promise<ReviewLog[]> {
    const rows = this.db
      .select({ log: schema.reviewLogs })
      .from(schema.reviewLogs)
      .innerJoin(
        schema.flashcards,
        eq(schema.reviewLogs.cardId, schema.flashcards.id),
      )
      .where(
        and(
          eq(schema.flashcards.deckId, deckId),
          gte(schema.reviewLogs.reviewedAt, since),
        ),
      )
      .all();
    return rows.map((r) => this.toLog(r.log));
  }

  async getReviewDates(userId: string): Promise<string[]> {
    const rows = this.db
      .select({ reviewedAt: schema.reviewLogs.reviewedAt })
      .from(schema.reviewLogs)
      .where(eq(schema.reviewLogs.userId, userId))
      .all();
    return rows.map((r) => r.reviewedAt.split("T")[0]!);
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
