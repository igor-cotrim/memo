import type { Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

import { UnauthorizedError } from '../../../shared/errors';

export interface AuthRequest<Params = Record<string, string>> extends Request<Params> {
  userId?: string;
}

export function authMiddleware(supabase: SupabaseClient) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or invalid authorization header'));
    }

    const token = authHeader.slice(7);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return next(new UnauthorizedError('Invalid or expired token'));
      }

      req.userId = user.id;
      next();
    } catch {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  };
}
