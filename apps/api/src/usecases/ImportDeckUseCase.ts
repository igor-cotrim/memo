import { v4 as uuidv4 } from "uuid";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type {
  Deck,
  Flashcard,
  ImportCardRow,
  ImportDeckResponse,
  ImportRowError,
} from "@flashcard-app/shared-types";
import type * as schema from "../infra/db/schema";
import { PgDeckRepository } from "../infra/db/PgDeckRepository";
import { PgCardRepository } from "../infra/db/PgCardRepository";
import { ValidationError } from "../shared/errors";

const DECK_COLORS = [
  "#e2a83e",
  "#2dd4bf",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#f472b6",
  "#a78bfa",
  "#38bdf8",
  "#fb923c",
  "#818cf8",
];

export class ImportDeckUseCase {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async execute(
    userId: string,
    deckMeta: { name: string; description?: string },
    cards: ImportCardRow[],
    errors: ImportRowError[],
  ): Promise<ImportDeckResponse> {
    if (!deckMeta.name || deckMeta.name.trim().length === 0) {
      throw new ValidationError("Deck name is required");
    }
    if (cards.length === 0) {
      throw new ValidationError("At least one valid card is required");
    }

    const now = new Date().toISOString();
    const randomColor =
      DECK_COLORS[Math.floor(Math.random() * DECK_COLORS.length)]!;

    const deck: Deck = {
      id: uuidv4(),
      userId,
      name: deckMeta.name.trim(),
      description: deckMeta.description,
      color: randomColor,
      createdAt: now,
    };

    const flashcards: Flashcard[] = cards.map((c) => ({
      id: uuidv4(),
      deckId: deck.id,
      front: c.front.trim(),
      back: c.back.trim(),
      notes: c.notes,
      state: 0,
      due: now,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      lastReviewAt: null,
      createdAt: now,
    }));

    await this.db.transaction(async (tx) => {
      const txDeckRepo = new PgDeckRepository(tx);
      const txCardRepo = new PgCardRepository(tx);
      await txDeckRepo.create(deck);
      await txCardRepo.createMany(flashcards);
    });

    return { deck, cardsCreated: flashcards.length, errors };
  }
}
