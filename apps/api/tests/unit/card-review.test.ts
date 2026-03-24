import { describe, it, expect, beforeEach } from "vitest";

import type { Flashcard, Deck } from "@flashcard-app/shared-types";
import type { ICardRepository } from "../../src/domain/repositories/ICardRepository";
import type { IDeckRepository } from "../../src/domain/repositories/IDeckRepository";
import type {
  IReviewLogRepository,
  ReviewLog,
} from "../../src/domain/repositories/IReviewLogRepository";
import {
  CreateCardUseCase,
  ListCardsUseCase,
} from "../../src/usecases/CardUseCases";
import {
  GetDueCardsUseCase,
  SubmitReviewUseCase,
} from "../../src/usecases/ReviewUseCases";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../src/shared/errors";

function createMockCardRepo(): ICardRepository {
  const cards: Flashcard[] = [];
  return {
    async findById(id) {
      return cards.find((c) => c.id === id) ?? null;
    },
    async findAllByDeckId(deckId) {
      return cards.filter((c) => c.deckId === deckId);
    },
    async findDueCards(deckId, now) {
      return cards.filter((c) => c.deckId === deckId && c.nextReviewAt <= now);
    },
    async findAllDueCardsByUserId() {
      return [];
    },
    async create(card) {
      cards.push(card);
      return card;
    },
    async update(id, data) {
      const idx = cards.findIndex((c) => c.id === id);
      if (idx < 0) return null;
      cards[idx] = { ...cards[idx]!, ...data };
      return cards[idx]!;
    },
    async delete(id) {
      const idx = cards.findIndex((c) => c.id === id);
      if (idx < 0) return false;
      cards.splice(idx, 1);
      return true;
    },
    async countByDeckId(deckId) {
      return cards.filter((c) => c.deckId === deckId).length;
    },
  };
}

function createMockDeckRepo(initialDecks: Deck[] = []): IDeckRepository {
  const decks = [...initialDecks];
  return {
    async findById(id) {
      return decks.find((d) => d.id === id) ?? null;
    },
    async findAllByUserId(userId) {
      return decks.filter((d) => d.userId === userId);
    },
    async create(deck) {
      decks.push(deck);
      return deck;
    },
    async update(id, data) {
      const idx = decks.findIndex((d) => d.id === id);
      if (idx < 0) return null;
      decks[idx] = { ...decks[idx]!, ...data };
      return decks[idx]!;
    },
    async delete(id) {
      const idx = decks.findIndex((d) => d.id === id);
      if (idx < 0) return false;
      decks.splice(idx, 1);
      return true;
    },
  };
}

function createMockReviewLogRepo(): IReviewLogRepository {
  const logs: ReviewLog[] = [];
  return {
    async create(log) {
      logs.push(log);
      return log;
    },
    async findByUserId(userId, since) {
      return logs.filter((l) => l.userId === userId && l.reviewedAt >= since);
    },
    async findByDeckId() {
      return [];
    },
    async getReviewDates() {
      return [];
    },
  };
}

const testDeck: Deck = {
  id: "deck-1",
  userId: "user-1",
  name: "Test Deck",
  createdAt: new Date().toISOString(),
};

describe("Card Use Cases", () => {
  let cardRepo: ICardRepository;
  let deckRepo: IDeckRepository;

  beforeEach(() => {
    cardRepo = createMockCardRepo();
    deckRepo = createMockDeckRepo([testDeck]);
  });

  describe("CreateCardUseCase", () => {
    it("should create a card in a deck", async () => {
      const useCase = new CreateCardUseCase(cardRepo, deckRepo);
      const card = await useCase.execute("user-1", "deck-1", {
        front: "Hello",
        back: "Hola",
      });

      expect(card.front).toBe("Hello");
      expect(card.back).toBe("Hola");
      expect(card.deckId).toBe("deck-1");
      expect(card.easeFactor).toBe(2.5);
      expect(card.repetitions).toBe(0);
    });

    it("should throw ValidationError for empty front", async () => {
      const useCase = new CreateCardUseCase(cardRepo, deckRepo);
      await expect(
        useCase.execute("user-1", "deck-1", { front: "", back: "Hola" }),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ForbiddenError for non-owner", async () => {
      const useCase = new CreateCardUseCase(cardRepo, deckRepo);
      await expect(
        useCase.execute("user-2", "deck-1", { front: "Hi", back: "Hola" }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw NotFoundError for invalid deck", async () => {
      const useCase = new CreateCardUseCase(cardRepo, deckRepo);
      await expect(
        useCase.execute("user-1", "nonexistent", { front: "Hi", back: "Hola" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("ListCardsUseCase", () => {
    it("should list cards in a deck", async () => {
      const create = new CreateCardUseCase(cardRepo, deckRepo);
      await create.execute("user-1", "deck-1", { front: "A", back: "B" });
      await create.execute("user-1", "deck-1", { front: "C", back: "D" });

      const list = new ListCardsUseCase(cardRepo, deckRepo);
      const result = await list.execute("user-1", "deck-1");
      expect(result).toHaveLength(2);
    });
  });
});

describe("Review Use Cases", () => {
  let cardRepo: ICardRepository;
  let deckRepo: IDeckRepository;
  let reviewLogRepo: IReviewLogRepository;

  beforeEach(() => {
    cardRepo = createMockCardRepo();
    deckRepo = createMockDeckRepo([testDeck]);
    reviewLogRepo = createMockReviewLogRepo();
  });

  describe("GetDueCardsUseCase", () => {
    it("should return due cards", async () => {
      const create = new CreateCardUseCase(cardRepo, deckRepo);
      // New cards have nextReviewAt = now, so they are immediately due
      await create.execute("user-1", "deck-1", { front: "A", back: "B" });
      await create.execute("user-1", "deck-1", { front: "C", back: "D" });

      const getDue = new GetDueCardsUseCase(cardRepo, deckRepo);
      const session = await getDue.execute("user-1", "deck-1");
      expect(session.totalDue).toBe(2);
      expect(session.cards).toHaveLength(2);
    });
  });

  describe("SubmitReviewUseCase", () => {
    it("should apply SM-2 and update card", async () => {
      const create = new CreateCardUseCase(cardRepo, deckRepo);
      const card = await create.execute("user-1", "deck-1", {
        front: "A",
        back: "B",
      });

      const submit = new SubmitReviewUseCase(cardRepo, deckRepo, reviewLogRepo);
      const result = await submit.execute("user-1", {
        cardId: card.id,
        quality: 4,
      });

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeGreaterThan(card.easeFactor);
    });

    it("should reset on quality = 1", async () => {
      const create = new CreateCardUseCase(cardRepo, deckRepo);
      const card = await create.execute("user-1", "deck-1", {
        front: "A",
        back: "B",
      });

      // First review to get some progress
      const submit = new SubmitReviewUseCase(cardRepo, deckRepo, reviewLogRepo);
      await submit.execute("user-1", { cardId: card.id, quality: 4 });

      // Then fail
      const result = await submit.execute("user-1", {
        cardId: card.id,
        quality: 1,
      });
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it("should throw NotFoundError for invalid card", async () => {
      const submit = new SubmitReviewUseCase(cardRepo, deckRepo, reviewLogRepo);
      await expect(
        submit.execute("user-1", { cardId: "nonexistent", quality: 3 }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
