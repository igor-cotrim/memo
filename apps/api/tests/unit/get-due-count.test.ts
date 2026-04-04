import { describe, it, expect, beforeEach } from "vitest";

import type { Flashcard, Deck } from "@flashcard-app/shared-types";
import type { ICardRepository } from "../../src/domain/repositories/ICardRepository";
import { GetDueCountUseCase } from "../../src/usecases/ReviewUseCases";

const testDeck: Deck = {
  id: "deck-1",
  userId: "user-1",
  name: "Test Deck",
  createdAt: new Date().toISOString(),
};

const testDeck2: Deck = {
  id: "deck-2",
  userId: "user-1",
  name: "Test Deck 2",
  createdAt: new Date().toISOString(),
};

function makeCard(
  overrides: Partial<Flashcard> & { id: string; deckId: string },
): Flashcard {
  return {
    front: "Q",
    back: "A",
    state: 0,
    due: new Date().toISOString(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReviewAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCardRepo(
  cards: Flashcard[],
  decks: Deck[],
): ICardRepository {
  return {
    async findById(id) {
      return cards.find((c) => c.id === id) ?? null;
    },
    async findAllByDeckId(deckId) {
      return cards.filter((c) => c.deckId === deckId);
    },
    async findDueCards(deckId, now) {
      return cards.filter((c) => c.deckId === deckId && c.due <= now);
    },
    async findAllDueCardsByUserId(userId, now) {
      const userDeckIds = decks
        .filter((d) => d.userId === userId)
        .map((d) => d.id);
      return cards.filter(
        (c) => userDeckIds.includes(c.deckId) && c.due <= now,
      );
    },
    async create(card) {
      return card;
    },
    async createMany(newCards) {
      return newCards;
    },
    async update(id, data) {
      const card = cards.find((c) => c.id === id);
      if (!card) return null;
      return { ...card, ...data };
    },
    async delete() {
      return true;
    },
    async countByDeckId(deckId) {
      return cards.filter((c) => c.deckId === deckId).length;
    },
    async countAllDueByUserId(userId, now) {
      const userDeckIds = decks
        .filter((d) => d.userId === userId)
        .map((d) => d.id);
      return cards.filter(
        (c) => userDeckIds.includes(c.deckId) && c.due <= now,
      ).length;
    },
  };
}

describe("GetDueCountUseCase", () => {
  let useCase: GetDueCountUseCase;

  describe("when user has due cards across multiple decks", () => {
    beforeEach(() => {
      const cards = [
        makeCard({ id: "c1", deckId: "deck-1" }),
        makeCard({ id: "c2", deckId: "deck-1" }),
        makeCard({ id: "c3", deckId: "deck-2" }),
      ];
      const cardRepo = createMockCardRepo(cards, [testDeck, testDeck2]);
      useCase = new GetDueCountUseCase(cardRepo);
    });

    it("should return the total due count across all decks", async () => {
      const result = await useCase.execute("user-1");
      expect(result.totalDue).toBe(3);
    });
  });

  describe("when user has no due cards", () => {
    beforeEach(() => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const cards = [
        makeCard({ id: "c1", deckId: "deck-1", due: futureDate }),
      ];
      const cardRepo = createMockCardRepo(cards, [testDeck]);
      useCase = new GetDueCountUseCase(cardRepo);
    });

    it("should return zero", async () => {
      const result = await useCase.execute("user-1");
      expect(result.totalDue).toBe(0);
    });
  });

  describe("when user has no decks", () => {
    beforeEach(() => {
      const cardRepo = createMockCardRepo([], []);
      useCase = new GetDueCountUseCase(cardRepo);
    });

    it("should return zero", async () => {
      const result = await useCase.execute("user-1");
      expect(result.totalDue).toBe(0);
    });
  });

  describe("when another user has due cards", () => {
    beforeEach(() => {
      const otherDeck: Deck = {
        id: "deck-other",
        userId: "user-2",
        name: "Other",
        createdAt: new Date().toISOString(),
      };
      const cards = [
        makeCard({ id: "c1", deckId: "deck-other" }),
        makeCard({ id: "c2", deckId: "deck-1" }),
      ];
      const cardRepo = createMockCardRepo(cards, [testDeck, otherDeck]);
      useCase = new GetDueCountUseCase(cardRepo);
    });

    it("should only count the requesting user's due cards", async () => {
      const result = await useCase.execute("user-1");
      expect(result.totalDue).toBe(1);
    });
  });
});
