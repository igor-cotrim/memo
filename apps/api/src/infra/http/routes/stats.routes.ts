import { Router } from 'express';
import type { Response, NextFunction } from 'express';

import type { AuthRequest } from '../middleware/auth';
import type { IReviewLogRepository } from '../../../domain/repositories/IReviewLogRepository';
import type { IDeckRepository } from '../../../domain/repositories/IDeckRepository';
import { GetReviewStatsUseCase } from '../../../usecases/StatsUseCase';

export function createStatsRoutes(
  reviewLogRepo: IReviewLogRepository,
  deckRepo: IDeckRepository,
): Router {
  const router = Router();

  const getStats = new GetReviewStatsUseCase(reviewLogRepo, deckRepo);

  // GET /stats
  router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const timezoneOffset = req.query.timezoneOffset
        ? parseInt(req.query.timezoneOffset as string, 10)
        : 0;
      const stats = await getStats.execute(req.userId!, timezoneOffset);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
