import { Router } from 'express';
import type { Response, NextFunction } from 'express';

import type { AuthRequest } from '../middleware/auth';
import type { ICardRepository } from '../../../domain/repositories/ICardRepository';
import type { IDeckRepository } from '../../../domain/repositories/IDeckRepository';
import {
  CreateCardUseCase,
  ListCardsUseCase,
  GetCardUseCase,
  UpdateCardUseCase,
  DeleteCardUseCase,
} from '../../../usecases/CardUseCases';

export function createCardRoutes(cardRepo: ICardRepository, deckRepo: IDeckRepository): Router {
  const router = Router({ mergeParams: true });

  const createCard = new CreateCardUseCase(cardRepo, deckRepo);
  const listCards = new ListCardsUseCase(cardRepo, deckRepo);
  const getCard = new GetCardUseCase(cardRepo, deckRepo);
  const updateCard = new UpdateCardUseCase(cardRepo, deckRepo);
  const deleteCard = new DeleteCardUseCase(cardRepo, deckRepo);

  // POST /decks/:deckId/cards
  router.post(
    '/',
    async (req: AuthRequest<{ deckId: string }>, res: Response, next: NextFunction) => {
      try {
        const card = await createCard.execute(req.userId!, req.params.deckId!, req.body);
        res.status(201).json(card);
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /decks/:deckId/cards
  router.get(
    '/',
    async (req: AuthRequest<{ deckId: string }>, res: Response, next: NextFunction) => {
      try {
        const cards = await listCards.execute(req.userId!, req.params.deckId!);
        res.json(cards);
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /decks/:deckId/cards/:cardId
  router.get(
    '/:cardId',
    async (
      req: AuthRequest<{ deckId: string; cardId: string }>,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const card = await getCard.execute(req.userId!, req.params.cardId!);
        res.json(card);
      } catch (err) {
        next(err);
      }
    },
  );

  // PUT /decks/:deckId/cards/:cardId
  router.put(
    '/:cardId',
    async (
      req: AuthRequest<{ deckId: string; cardId: string }>,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const card = await updateCard.execute(req.userId!, req.params.cardId!, req.body);
        res.json(card);
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /decks/:deckId/cards/:cardId
  router.delete(
    '/:cardId',
    async (
      req: AuthRequest<{ deckId: string; cardId: string }>,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        await deleteCard.execute(req.userId!, req.params.cardId!);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
