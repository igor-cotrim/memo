import { Router } from "express";
import type { Response, NextFunction } from "express";

import type { AuthRequest } from "../middleware/auth";
import type { ICardRepository } from "../../../domain/repositories/ICardRepository";
import type { IDeckRepository } from "../../../domain/repositories/IDeckRepository";
import type { IReviewLogRepository } from "../../../domain/repositories/IReviewLogRepository";
import {
  GetDueCardsUseCase,
  SubmitReviewUseCase,
} from "../../../usecases/ReviewUseCases";

export function createReviewRoutes(
  cardRepo: ICardRepository,
  deckRepo: IDeckRepository,
  reviewLogRepo: IReviewLogRepository,
): Router {
  const router = Router();

  const getDueCards = new GetDueCardsUseCase(cardRepo, deckRepo);
  const submitReview = new SubmitReviewUseCase(
    cardRepo,
    deckRepo,
    reviewLogRepo,
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
