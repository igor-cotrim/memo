import { describe, it, expect, beforeEach } from 'vitest';

import type { Deck } from '@flashcard-app/shared-types';
import type { IDeckRepository } from '../../src/domain/repositories/IDeckRepository';
import {
  CreateDeckUseCase,
  ListDecksUseCase,
  GetDeckUseCase,
  UpdateDeckUseCase,
  DeleteDeckUseCase,
} from '../../src/usecases/DeckUseCases';
import { NotFoundError, ValidationError, ForbiddenError } from '../../src/shared/errors';

function createMockDeckRepo(): IDeckRepository {
  const decks: Deck[] = [];
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

describe('Deck Use Cases', () => {
  let deckRepo: IDeckRepository;
  const userId = 'user-1';

  beforeEach(() => {
    deckRepo = createMockDeckRepo();
  });

  describe('CreateDeckUseCase', () => {
    it('should create a deck', async () => {
      const useCase = new CreateDeckUseCase(deckRepo);
      const deck = await useCase.execute(userId, {
        name: 'Spanish',
        color: '#ff0000',
      });
      expect(deck.name).toBe('Spanish');
      expect(deck.userId).toBe(userId);
      expect(deck.color).toBe('#ff0000');
    });

    it('should throw ValidationError for empty name', async () => {
      const useCase = new CreateDeckUseCase(deckRepo);
      await expect(useCase.execute(userId, { name: '' })).rejects.toThrow(ValidationError);
    });
  });

  describe('ListDecksUseCase', () => {
    it('should return only user decks', async () => {
      const create = new CreateDeckUseCase(deckRepo);
      await create.execute('user-1', { name: 'Deck A' });
      await create.execute('user-2', { name: 'Deck B' });

      const list = new ListDecksUseCase(deckRepo);
      const results = await list.execute('user-1');
      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('Deck A');
    });
  });

  describe('GetDeckUseCase', () => {
    it('should return deck for owner', async () => {
      const create = new CreateDeckUseCase(deckRepo);
      const deck = await create.execute(userId, { name: 'Test' });

      const get = new GetDeckUseCase(deckRepo);
      const result = await get.execute(userId, deck.id);
      expect(result.name).toBe('Test');
    });

    it('should throw ForbiddenError for non-owner', async () => {
      const create = new CreateDeckUseCase(deckRepo);
      const deck = await create.execute('user-1', { name: 'Test' });

      const get = new GetDeckUseCase(deckRepo);
      await expect(get.execute('user-2', deck.id)).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for invalid id', async () => {
      const get = new GetDeckUseCase(deckRepo);
      await expect(get.execute(userId, 'nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('UpdateDeckUseCase', () => {
    it('should update deck fields', async () => {
      const create = new CreateDeckUseCase(deckRepo);
      const deck = await create.execute(userId, { name: 'Old', color: '#000' });

      const update = new UpdateDeckUseCase(deckRepo);
      const result = await update.execute(userId, deck.id, {
        name: 'New',
        color: '#fff',
      });
      expect(result.name).toBe('New');
      expect(result.color).toBe('#fff');
    });
  });

  describe('DeleteDeckUseCase', () => {
    it('should delete deck', async () => {
      const create = new CreateDeckUseCase(deckRepo);
      const deck = await create.execute(userId, { name: 'ToDelete' });

      const del = new DeleteDeckUseCase(deckRepo);
      await del.execute(userId, deck.id);

      const list = new ListDecksUseCase(deckRepo);
      const results = await list.execute(userId);
      expect(results).toHaveLength(0);
    });
  });
});
