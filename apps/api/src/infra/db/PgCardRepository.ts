import { eq, and, lte, count } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type { Flashcard } from '@flashcard-app/shared-types';
import type { ICardRepository } from '../../domain/repositories/ICardRepository';
import * as schema from './schema';

export class PgCardRepository implements ICardRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async findById(id: string): Promise<Flashcard | null> {
    const rows = await this.db.select().from(schema.flashcards).where(eq(schema.flashcards.id, id));
    return rows[0] ? this.toCard(rows[0]) : null;
  }

  async findAllByDeckId(deckId: string): Promise<Flashcard[]> {
    const rows = await this.db
      .select()
      .from(schema.flashcards)
      .where(eq(schema.flashcards.deckId, deckId));
    return rows.map(this.toCard);
  }

  async findDueCards(deckId: string, now: string): Promise<Flashcard[]> {
    const rows = await this.db
      .select()
      .from(schema.flashcards)
      .where(and(eq(schema.flashcards.deckId, deckId), lte(schema.flashcards.due, now)));
    return rows.map(this.toCard);
  }

  async findAllDueCardsByUserId(userId: string, now: string): Promise<Flashcard[]> {
    const rows = await this.db
      .select({ flashcard: schema.flashcards })
      .from(schema.flashcards)
      .innerJoin(schema.decks, eq(schema.flashcards.deckId, schema.decks.id))
      .where(and(eq(schema.decks.userId, userId), lte(schema.flashcards.due, now)));
    return rows.map((r) => this.toCard(r.flashcard));
  }

  async create(card: Flashcard): Promise<Flashcard> {
    await this.db.insert(schema.flashcards).values(this.toDbValues(card));
    return card;
  }

  async createMany(cards: Flashcard[]): Promise<Flashcard[]> {
    if (cards.length === 0) return [];

    const BATCH_SIZE = 500;
    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const batch = cards.slice(i, i + BATCH_SIZE);
      await this.db.insert(schema.flashcards).values(batch.map((card) => this.toDbValues(card)));
    }

    return cards;
  }

  async update(id: string, data: Partial<Flashcard>): Promise<Flashcard | null> {
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );

    await this.db.update(schema.flashcards).set(updateData).where(eq(schema.flashcards.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.flashcards)
      .where(eq(schema.flashcards.id, id))
      .returning({ id: schema.flashcards.id });
    return result.length > 0;
  }

  async countByDeckId(deckId: string): Promise<number> {
    const rows = await this.db
      .select({ count: count() })
      .from(schema.flashcards)
      .where(eq(schema.flashcards.deckId, deckId));
    return rows[0]?.count ?? 0;
  }

  async countAllDueByUserId(userId: string, now: string): Promise<number> {
    const rows = await this.db
      .select({ count: count() })
      .from(schema.flashcards)
      .innerJoin(schema.decks, eq(schema.flashcards.deckId, schema.decks.id))
      .where(and(eq(schema.decks.userId, userId), lte(schema.flashcards.due, now)));
    return rows[0]?.count ?? 0;
  }

  private toDbValues(card: Flashcard) {
    return {
      id: card.id,
      deckId: card.deckId,
      front: card.front,
      back: card.back,
      notes: card.notes ?? null,
      state: card.state,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsedDays,
      scheduledDays: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      lastReviewAt: card.lastReviewAt,
      createdAt: card.createdAt,
    };
  }

  private toCard(row: typeof schema.flashcards.$inferSelect): Flashcard {
    return {
      id: row.id,
      deckId: row.deckId,
      front: row.front,
      back: row.back,
      notes: row.notes ?? undefined,
      state: row.state,
      due: row.due,
      stability: row.stability,
      difficulty: row.difficulty,
      elapsedDays: row.elapsedDays,
      scheduledDays: row.scheduledDays,
      reps: row.reps,
      lapses: row.lapses,
      lastReviewAt: row.lastReviewAt,
      createdAt: row.createdAt,
    };
  }
}
