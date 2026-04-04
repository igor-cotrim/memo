import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ImportCardsUseCase } from '../../src/usecases/ImportCardsUseCase';
import { ImportDeckUseCase } from '../../src/usecases/ImportDeckUseCase';
import { NotFoundError, ForbiddenError, ValidationError } from '../../src/shared/errors';

vi.mock('../../src/infra/db/PgDeckRepository', () => {
  return {
    PgDeckRepository: vi.fn().mockImplementation(() => ({
      findById: vi.fn(),
      create: vi.fn(),
    })),
  };
});

vi.mock('../../src/infra/db/PgCardRepository', () => {
  return {
    PgCardRepository: vi.fn().mockImplementation(() => ({
      createMany: vi.fn(),
    })),
  };
});

import { PgDeckRepository } from '../../src/infra/db/PgDeckRepository';
import { PgCardRepository } from '../../src/infra/db/PgCardRepository';

describe('Import Use Cases', () => {
  let mockDb: any;
  let mockTxDeckRepo: any;
  let mockTxCardRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      transaction: vi.fn(async (callback) => {
        return callback(mockDb);
      }),
    };

    // Access the mocked instances to set up responses
    const deckRepoMock = new PgDeckRepository(mockDb as any);
    const cardRepoMock = new PgCardRepository(mockDb as any);

    // Reset default behavior
  });

  describe('ImportCardsUseCase', () => {
    it('throws ValidationError if cards array is empty', async () => {
      const useCase = new ImportCardsUseCase(mockDb);
      await expect(useCase.execute('user1', 'deck1', [], [])).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError if deck does not exist', async () => {
      const deckRepoSpy = new PgDeckRepository(mockDb as any);
      vi.mocked(PgDeckRepository).mockImplementation(() => deckRepoSpy as any);
      deckRepoSpy.findById = vi.fn().mockResolvedValue(null);

      const useCase = new ImportCardsUseCase(mockDb);
      await expect(
        useCase.execute('user1', 'deck1', [{ front: 'F', back: 'B' }], []),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError if deck belongs to another user', async () => {
      const deckRepoSpy = new PgDeckRepository(mockDb as any);
      vi.mocked(PgDeckRepository).mockImplementation(() => deckRepoSpy as any);
      deckRepoSpy.findById = vi.fn().mockResolvedValue({ id: 'deck1', userId: 'user2' });

      const useCase = new ImportCardsUseCase(mockDb);
      await expect(
        useCase.execute('user1', 'deck1', [{ front: 'F', back: 'B' }], []),
      ).rejects.toThrow(ForbiddenError);
    });

    it('imports cards successfully', async () => {
      const deckRepoSpy = new PgDeckRepository(mockDb as any);
      const cardRepoSpy = new PgCardRepository(mockDb as any);

      vi.mocked(PgDeckRepository).mockImplementation(() => deckRepoSpy as any);
      vi.mocked(PgCardRepository).mockImplementation(() => cardRepoSpy as any);

      deckRepoSpy.findById = vi.fn().mockResolvedValue({ id: 'deck1', userId: 'user1' });
      cardRepoSpy.createMany = vi.fn().mockResolvedValue(undefined);

      const useCase = new ImportCardsUseCase(mockDb);
      const result = await useCase.execute(
        'user1',
        'deck1',
        [{ front: 'F', back: 'B', notes: 'N' }],
        [{ row: 2, message: 'err' }],
      );

      expect(result.cardsCreated).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(cardRepoSpy.createMany).toHaveBeenCalled();
    });
  });

  describe('ImportDeckUseCase', () => {
    it('throws ValidationError if name is empty', async () => {
      const useCase = new ImportDeckUseCase(mockDb);
      await expect(
        useCase.execute('user1', { name: '' }, [{ front: 'F', back: 'B' }], []),
      ).rejects.toThrow(ValidationError);
      await expect(
        useCase.execute('user1', { name: '   ' }, [{ front: 'F', back: 'B' }], []),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError if cards array is empty', async () => {
      const useCase = new ImportDeckUseCase(mockDb);
      await expect(useCase.execute('user1', { name: 'Deck' }, [], [])).rejects.toThrow(
        ValidationError,
      );
    });

    it('imports deck and cards successfully', async () => {
      const deckRepoSpy = new PgDeckRepository(mockDb as any);
      const cardRepoSpy = new PgCardRepository(mockDb as any);

      vi.mocked(PgDeckRepository).mockImplementation(() => deckRepoSpy as any);
      vi.mocked(PgCardRepository).mockImplementation(() => cardRepoSpy as any);

      deckRepoSpy.create = vi.fn().mockResolvedValue(undefined);
      cardRepoSpy.createMany = vi.fn().mockResolvedValue(undefined);

      const useCase = new ImportDeckUseCase(mockDb);
      const result = await useCase.execute(
        'user1',
        { name: 'New Deck', description: 'Desc' },
        [{ front: 'F', back: 'B' }],
        [],
      );

      expect(result.cardsCreated).toBe(1);
      expect(result.deck.name).toBe('New Deck');
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(deckRepoSpy.create).toHaveBeenCalled();
      expect(cardRepoSpy.createMany).toHaveBeenCalled();
    });
  });
});
