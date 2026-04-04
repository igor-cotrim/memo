import { Router } from 'express';
import type { Response, NextFunction } from 'express';

import type { AuthRequest } from '../middleware/auth';
import type { IDeckRepository } from '../../../domain/repositories/IDeckRepository';
import {
  CreateDeckUseCase,
  ListDecksUseCase,
  GetDeckUseCase,
  UpdateDeckUseCase,
  DeleteDeckUseCase,
} from '../../../usecases/DeckUseCases';

export function createDeckRoutes(deckRepo: IDeckRepository): Router {
  const router = Router();

  const createDeck = new CreateDeckUseCase(deckRepo);
  const listDecks = new ListDecksUseCase(deckRepo);
  const getDeck = new GetDeckUseCase(deckRepo);
  const updateDeck = new UpdateDeckUseCase(deckRepo);
  const deleteDeck = new DeleteDeckUseCase(deckRepo);

  router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const deck = await createDeck.execute(req.userId!, req.body);
      res.status(201).json(deck);
    } catch (err) {
      next(err);
    }
  });

  router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const decks = await listDecks.execute(req.userId!);
      res.json(decks);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const deck = await getDeck.execute(req.userId!, req.params.id!);
      res.json(deck);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const deck = await updateDeck.execute(req.userId!, req.params.id!, req.body);
      res.json(deck);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await deleteDeck.execute(req.userId!, req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
