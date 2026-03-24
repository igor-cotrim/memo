import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type { Deck } from "@flashcard-app/shared-types";
import type { IDeckRepository } from "../../domain/repositories/IDeckRepository";
import * as schema from "./schema";

export class SqliteDeckRepository implements IDeckRepository {
  constructor(private readonly db: BetterSQLite3Database<typeof schema>) {}

  async findById(id: string): Promise<Deck | null> {
    const row = this.db
      .select()
      .from(schema.decks)
      .where(eq(schema.decks.id, id))
      .get();
    return row ? this.toDeck(row) : null;
  }

  async findAllByUserId(userId: string): Promise<Deck[]> {
    const rows = this.db
      .select()
      .from(schema.decks)
      .where(eq(schema.decks.userId, userId))
      .all();
    return rows.map(this.toDeck);
  }

  async create(deck: Deck): Promise<Deck> {
    this.db
      .insert(schema.decks)
      .values({
        id: deck.id,
        userId: deck.userId,
        name: deck.name,
        description: deck.description ?? null,
        color: deck.color ?? null,
        createdAt: deck.createdAt,
      })
      .run();
    return deck;
  }

  async update(
    id: string,
    data: Partial<Pick<Deck, "name" | "description" | "color">>,
  ): Promise<Deck | null> {
    this.db.update(schema.decks).set(data).where(eq(schema.decks.id, id)).run();
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db
      .delete(schema.decks)
      .where(eq(schema.decks.id, id))
      .run();
    return result.changes > 0;
  }

  private toDeck(row: typeof schema.decks.$inferSelect): Deck {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description ?? undefined,
      color: row.color ?? undefined,
      createdAt: row.createdAt,
    };
  }
}
