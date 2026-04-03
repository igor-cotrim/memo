import { v4 as uuidv4 } from "uuid";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type {
  Flashcard,
  ImportCardRow,
  ImportCardsResponse,
  ImportRowError,
} from "@flashcard-app/shared-types";
import type * as schema from "../infra/db/schema";
import { PgDeckRepository } from "../infra/db/PgDeckRepository";
import { PgCardRepository } from "../infra/db/PgCardRepository";
import { NotFoundError, ForbiddenError, ValidationError } from "../shared/errors";

export class ImportCardsUseCase {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async execute(
    userId: string,
    deckId: string,
    cards: ImportCardRow[],
    errors: ImportRowError[],
  ): Promise<ImportCardsResponse> {
    if (cards.length === 0) {
      throw new ValidationError("At least one valid card is required");
    }

    const deckRepo = new PgDeckRepository(this.db);
    const deck = await deckRepo.findById(deckId);
    if (!deck) throw new NotFoundError("Deck", deckId);
    if (deck.userId !== userId) throw new ForbiddenError();

    const now = new Date().toISOString();

    const flashcards: Flashcard[] = cards.map((c) => ({
      id: uuidv4(),
      deckId,
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
      const txCardRepo = new PgCardRepository(tx);
      await txCardRepo.createMany(flashcards);
    });

    return { cardsCreated: flashcards.length, errors };
  }
}
