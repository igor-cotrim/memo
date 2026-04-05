import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

// Mock supabase
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  },
}));

// Mock axios at module level
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  mockAxios.create.mockReturnValue(mockAxios);
  return { default: mockAxios };
});

const mockedAxios = vi.mocked(axios);
const api = mockedAxios.create();

import * as apiModule from '../../src/services/api';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth endpoints', () => {
    it('registerUser calls POST /auth/register', async () => {
      const response = {
        data: {
          user: { id: '1', email: 'a@b.com', name: 'Test' },
        },
      };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const result = await apiModule.registerUser('Test');

      expect(api.post).toHaveBeenCalledWith('/auth/register', { name: 'Test' });
      expect(result.user.email).toBe('a@b.com');
    });

    it('getMe calls GET /auth/me', async () => {
      const response = {
        data: { user: { id: '1', email: 'a@b.com', name: 'Test' } },
      };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const result = await apiModule.getMe();
      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result.user.name).toBe('Test');
    });
  });

  describe('Deck endpoints', () => {
    it('getDecks calls GET /decks', async () => {
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

      const result = await apiModule.getDecks();
      expect(api.get).toHaveBeenCalledWith('/decks');
      expect(result).toEqual([]);
    });

    it('getDeck calls GET /decks/:id', async () => {
      const deck = { id: 'd1', name: 'Test', userId: 'u1', createdAt: '' };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: deck });

      const result = await apiModule.getDeck('d1');
      expect(api.get).toHaveBeenCalledWith('/decks/d1');
      expect(result.name).toBe('Test');
    });

    it('createDeck calls POST /decks', async () => {
      const deck = { id: 'd1', name: 'New', userId: 'u1', createdAt: '' };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: deck });

      const result = await apiModule.createDeck({ name: 'New' });
      expect(api.post).toHaveBeenCalledWith('/decks', { name: 'New' });
      expect(result.name).toBe('New');
    });

    it('updateDeck calls PUT /decks/:id', async () => {
      const deck = { id: 'd1', name: 'Updated', userId: 'u1', createdAt: '' };
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: deck });

      const result = await apiModule.updateDeck('d1', { name: 'Updated' });
      expect(api.put).toHaveBeenCalledWith('/decks/d1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('deleteDeck calls DELETE /decks/:id', async () => {
      (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await apiModule.deleteDeck('d1');
      expect(api.delete).toHaveBeenCalledWith('/decks/d1');
    });
  });

  describe('Card endpoints', () => {
    it('getCards calls GET /decks/:deckId/cards', async () => {
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

      const result = await apiModule.getCards('d1');
      expect(api.get).toHaveBeenCalledWith('/decks/d1/cards');
      expect(result).toEqual([]);
    });

    it('createCard calls POST /decks/:deckId/cards', async () => {
      const card = {
        id: 'c1',
        deckId: 'd1',
        front: 'Q',
        back: 'A',
      };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: card });

      const result = await apiModule.createCard('d1', {
        front: 'Q',
        back: 'A',
      });
      expect(api.post).toHaveBeenCalledWith('/decks/d1/cards', {
        front: 'Q',
        back: 'A',
      });
      expect(result.front).toBe('Q');
    });

    it('updateCard calls PUT /decks/:deckId/cards/:cardId', async () => {
      const card = { id: 'c1', deckId: 'd1', front: 'Updated', back: 'A' };
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: card });

      const result = await apiModule.updateCard('d1', 'c1', {
        front: 'Updated',
      });
      expect(api.put).toHaveBeenCalledWith('/decks/d1/cards/c1', {
        front: 'Updated',
      });
      expect(result.front).toBe('Updated');
    });

    it('deleteCard calls DELETE /decks/:deckId/cards/:cardId', async () => {
      (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await apiModule.deleteCard('d1', 'c1');
      expect(api.delete).toHaveBeenCalledWith('/decks/d1/cards/c1');
    });
  });

  describe('Review endpoints', () => {
    it('getDueCards calls GET /review/:deckId', async () => {
      const session = { deckId: 'd1', cards: [], totalDue: 0 };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: session,
      });

      const result = await apiModule.getDueCards('d1');
      expect(api.get).toHaveBeenCalledWith('/review/d1');
      expect(result.totalDue).toBe(0);
    });

    it('submitReview calls POST /review', async () => {
      const card = { id: 'c1', reps: 1 };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: card });

      const result = await apiModule.submitReview({
        cardId: 'c1',
        quality: 4 as const,
      });
      expect(api.post).toHaveBeenCalledWith('/review', {
        cardId: 'c1',
        quality: 4,
      });
      expect(result.reps).toBe(1);
    });
  });

  describe('Stats endpoints', () => {
    it('getStats calls GET /stats', async () => {
      const stats = {
        currentStreak: 5,
        last7Days: [],
        last30Days: [],
        last365Days: [],
        deckAccuracies: [],
      };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: stats });

      const result = await apiModule.getStats();
      expect(api.get).toHaveBeenCalledWith('/stats', {
        params: { timezoneOffset: expect.any(Number) },
      });
      expect(result.currentStreak).toBe(5);
    });
  });
});
