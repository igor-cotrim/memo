import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type { Deck } from "@flashcard-app/shared-types";
import type { IDeckRepository } from "../../domain/repositories/IDeckRepository";
import * as schema from "./schema";

export class PgDeckRepository implements IDeckRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async findById(id: string): Promise<Deck | null> {
    const rows = await this.db
      .select()
      .from(schema.decks)
      .where(eq(schema.decks.id, id));
    return rows[0] ? this.toDeck(rows[0]) : null;
  }

  async findAllByUserId(userId: string): Promise<Deck[]> {
    const rows = await this.db
      .select()
      .from(schema.decks)
      .where(eq(schema.decks.userId, userId));
    return rows.map(this.toDeck);
  }

  async create(deck: Deck): Promise<Deck> {
    await this.db.insert(schema.decks).values({
      id: deck.id,
      userId: deck.userId,
      name: deck.name,
      description: deck.description ?? null,
      color: deck.color ?? null,
      createdAt: deck.createdAt,
    });
    return deck;
  }

  async update(
    id: string,
    data: Partial<Pick<Deck, "name" | "description" | "color">>,
  ): Promise<Deck | null> {
    await this.db.update(schema.decks).set(data).where(eq(schema.decks.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.decks)
      .where(eq(schema.decks.id, id))
      .returning({ id: schema.decks.id });
    return result.length > 0;
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
