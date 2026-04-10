import { describe, it, expect, beforeEach } from 'vitest';

import type { Flashcard, Deck } from '@flashcard-app/shared-types';
import type { ICardRepository } from '../../src/domain/repositories/ICardRepository';
import type { IDeckRepository } from '../../src/domain/repositories/IDeckRepository';
import { GetAllDueCardsUseCase } from '../../src/usecases/ReviewUseCases';

function makeCard(overrides: Partial<Flashcard> & { id: string; deckId: string }): Flashcard {
  return {
    front: 'Q',
    back: 'A',
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

function makeDeck(overrides: Partial<Deck> & { id: string; userId: string; name: string }): Deck {
  return {
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCardRepo(cards: Flashcard[], decks: Deck[]): ICardRepository {
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
      const userDeckIds = decks.filter((d) => d.userId === userId).map((d) => d.id);
      return cards.filter((c) => userDeckIds.includes(c.deckId) && c.due <= now);
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
      const userDeckIds = decks.filter((d) => d.userId === userId).map((d) => d.id);
      return cards.filter((c) => userDeckIds.includes(c.deckId) && c.due <= now).length;
    },
  };
}

function createMockDeckRepo(decks: Deck[]): IDeckRepository {
  return {
    async findById(id) {
      return decks.find((d) => d.id === id) ?? null;
    },
    async findAllByUserId(userId) {
      return decks.filter((d) => d.userId === userId);
    },
    async create(deck) {
      return deck;
    },
    async update(id, data) {
      const deck = decks.find((d) => d.id === id);
      if (!deck) return null;
      return { ...deck, ...data };
    },
    async delete() {
      return true;
    },
  };
}

const deck1 = makeDeck({ id: 'deck-1', userId: 'user-1', name: 'Spanish' });
const deck2 = makeDeck({ id: 'deck-2', userId: 'user-1', name: 'French' });
const otherUserDeck = makeDeck({ id: 'deck-3', userId: 'user-2', name: 'German' });

describe('GetAllDueCardsUseCase', () => {
  let useCase: GetAllDueCardsUseCase;

  describe('when user has due cards across multiple decks', () => {
    beforeEach(() => {
      const cards = [
        makeCard({ id: 'c1', deckId: 'deck-1' }),
        makeCard({ id: 'c2', deckId: 'deck-1' }),
        makeCard({ id: 'c3', deckId: 'deck-2' }),
      ];
      const decks = [deck1, deck2];
      useCase = new GetAllDueCardsUseCase(createMockCardRepo(cards, decks), createMockDeckRepo(decks));
    });

    it('returns all due cards', async () => {
      const result = await useCase.execute('user-1');
      expect(result.cards).toHaveLength(3);
      expect(result.totalDue).toBe(3);
    });

    it('includes deckNames map with all user decks', async () => {
      const result = await useCase.execute('user-1');
      expect(result.deckNames).toEqual({
        'deck-1': 'Spanish',
        'deck-2': 'French',
      });
    });
  });

  describe('when user has no due cards', () => {
    beforeEach(() => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const cards = [
        makeCard({ id: 'c1', deckId: 'deck-1', due: futureDate }),
        makeCard({ id: 'c2', deckId: 'deck-2', due: futureDate }),
      ];
      const decks = [deck1, deck2];
      useCase = new GetAllDueCardsUseCase(createMockCardRepo(cards, decks), createMockDeckRepo(decks));
    });

    it('returns empty cards array', async () => {
      const result = await useCase.execute('user-1');
      expect(result.cards).toHaveLength(0);
      expect(result.totalDue).toBe(0);
    });

    it('still returns deckNames', async () => {
      const result = await useCase.execute('user-1');
      expect(result.deckNames['deck-1']).toBe('Spanish');
      expect(result.deckNames['deck-2']).toBe('French');
    });
  });

  describe('when user has no decks', () => {
    beforeEach(() => {
      useCase = new GetAllDueCardsUseCase(createMockCardRepo([], []), createMockDeckRepo([]));
    });

    it('returns empty result', async () => {
      const result = await useCase.execute('user-1');
      expect(result.cards).toHaveLength(0);
      expect(result.totalDue).toBe(0);
      expect(result.deckNames).toEqual({});
    });
  });

  describe('when another user has due cards', () => {
    beforeEach(() => {
      const cards = [
        makeCard({ id: 'c1', deckId: 'deck-1' }),
        makeCard({ id: 'c2', deckId: 'deck-3' }), // other user's card
      ];
      const decks = [deck1, otherUserDeck];
      useCase = new GetAllDueCardsUseCase(createMockCardRepo(cards, decks), createMockDeckRepo(decks));
    });

    it('only returns cards belonging to the requesting user', async () => {
      const result = await useCase.execute('user-1');
      expect(result.cards).toHaveLength(1);
      expect(result.cards[0]!.deckId).toBe('deck-1');
    });

    it('only includes the requesting user decks in deckNames', async () => {
      const result = await useCase.execute('user-1');
      expect(result.deckNames).toHaveProperty('deck-1');
      expect(result.deckNames).not.toHaveProperty('deck-3');
    });
  });

  describe('when some cards are due and others are not', () => {
    beforeEach(() => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const cards = [
        makeCard({ id: 'c1', deckId: 'deck-1' }),               // due now
        makeCard({ id: 'c2', deckId: 'deck-1', due: futureDate }), // not due
        makeCard({ id: 'c3', deckId: 'deck-2' }),               // due now
      ];
      const decks = [deck1, deck2];
      useCase = new GetAllDueCardsUseCase(createMockCardRepo(cards, decks), createMockDeckRepo(decks));
    });

    it('returns only the due cards', async () => {
      const result = await useCase.execute('user-1');
      expect(result.cards).toHaveLength(2);
      expect(result.totalDue).toBe(2);
    });
  });
});
