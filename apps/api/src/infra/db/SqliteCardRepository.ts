import { eq, and, lte } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type { Flashcard } from "@flashcard-app/shared-types";
import type { ICardRepository } from "../../domain/repositories/ICardRepository";
import * as schema from "./schema";

export class SqliteCardRepository implements ICardRepository {
  constructor(private readonly db: BetterSQLite3Database<typeof schema>) {}

  async findById(id: string): Promise<Flashcard | null> {
    const row = this.db
      .select()
      .from(schema.flashcards)
      .where(eq(schema.flashcards.id, id))
      .get();
    return row ? this.toCard(row) : null;
  }

  async findAllByDeckId(deckId: string): Promise<Flashcard[]> {
    const rows = this.db
      .select()
      .from(schema.flashcards)
      .where(eq(schema.flashcards.deckId, deckId))
      .all();
    return rows.map(this.toCard);
  }

  async findDueCards(deckId: string, now: string): Promise<Flashcard[]> {
    const rows = this.db
      .select()
      .from(schema.flashcards)
      .where(
        and(
          eq(schema.flashcards.deckId, deckId),
          lte(schema.flashcards.due, now),
        ),
      )
      .all();
    return rows.map(this.toCard);
  }

  async findAllDueCardsByUserId(
    userId: string,
    now: string,
  ): Promise<Flashcard[]> {
    const rows = this.db
      .select({ flashcard: schema.flashcards })
      .from(schema.flashcards)
      .innerJoin(schema.decks, eq(schema.flashcards.deckId, schema.decks.id))
      .where(
        and(eq(schema.decks.userId, userId), lte(schema.flashcards.due, now)),
      )
      .all();
    return rows.map((r) => this.toCard(r.flashcard));
  }

  async create(card: Flashcard): Promise<Flashcard> {
    this.db
      .insert(schema.flashcards)
      .values({
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
      })
      .run();
    return card;
  }

  async update(
    id: string,
    data: Partial<Flashcard>,
  ): Promise<Flashcard | null> {
    const updateData: Record<string, unknown> = {};
    if (data.front !== undefined) updateData["front"] = data.front;
    if (data.back !== undefined) updateData["back"] = data.back;
    if (data.notes !== undefined) updateData["notes"] = data.notes;
    if (data.state !== undefined) updateData["state"] = data.state;
    if (data.due !== undefined) updateData["due"] = data.due;
    if (data.stability !== undefined) updateData["stability"] = data.stability;
    if (data.difficulty !== undefined)
      updateData["difficulty"] = data.difficulty;
    if (data.elapsedDays !== undefined)
      updateData["elapsedDays"] = data.elapsedDays;
    if (data.scheduledDays !== undefined)
      updateData["scheduledDays"] = data.scheduledDays;
    if (data.reps !== undefined) updateData["reps"] = data.reps;
    if (data.lapses !== undefined) updateData["lapses"] = data.lapses;
    if (data.lastReviewAt !== undefined)
      updateData["lastReviewAt"] = data.lastReviewAt;

    this.db
      .update(schema.flashcards)
      .set(updateData)
      .where(eq(schema.flashcards.id, id))
      .run();
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db
      .delete(schema.flashcards)
      .where(eq(schema.flashcards.id, id))
      .run();
    return result.changes > 0;
  }

  async countByDeckId(deckId: string): Promise<number> {
    const rows = this.db
      .select()
      .from(schema.flashcards)
      .where(eq(schema.flashcards.deckId, deckId))
      .all();
    return rows.length;
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
