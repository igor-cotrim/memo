import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'pino';

import { AppError } from '../../../shared/errors';

export function createErrorHandler(logger: Logger) {
  return function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }

    logger.error(err, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  };
}
