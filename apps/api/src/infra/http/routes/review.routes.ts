import { Router } from "express";
import type { Response, NextFunction } from "express";

import type { AuthRequest } from "../middleware/auth";
import type { ICardRepository } from "../../../domain/repositories/ICardRepository";
import type { IDeckRepository } from "../../../domain/repositories/IDeckRepository";
import type { IReviewLogRepository } from "../../../domain/repositories/IReviewLogRepository";
import {
  GetDueCardsUseCase,
  GetDueCountUseCase,
  SubmitReviewUseCase,
} from "../../../usecases/ReviewUseCases";

export function createReviewRoutes(
  cardRepo: ICardRepository,
  deckRepo: IDeckRepository,
  reviewLogRepo: IReviewLogRepository,
): Router {
  const router = Router();

  const getDueCards = new GetDueCardsUseCase(cardRepo, deckRepo);
  const getDueCount = new GetDueCountUseCase(cardRepo);
  const submitReview = new SubmitReviewUseCase(
    cardRepo,
    deckRepo,
    reviewLogRepo,
  );

  // GET /review/due-count — get total due cards count across all decks
  router.get(
    "/due-count",
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const result = await getDueCount.execute(req.userId!);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /review/:deckId — get due cards for a deck
  router.get(
    "/:deckId",
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const session = await getDueCards.execute(
          req.userId!,
          req.params.deckId!,
        );
        res.json(session);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /review — submit a review result
  router.post(
    "/",
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const card = await submitReview.execute(req.userId!, req.body);
        res.json(card);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
