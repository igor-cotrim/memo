import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

import { RegisterUseCase } from '../../../usecases/RegisterUseCase';
import { AuthMeUseCase } from '../../../usecases/AuthMeUseCase';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

export function createAuthRoutes(userRepo: IUserRepository, supabase: SupabaseClient): Router {
  const router = Router();

  const registerUseCase = new RegisterUseCase(userRepo);
  const authMeUseCase = new AuthMeUseCase(userRepo);
  const auth = authMiddleware(supabase);

  router.get('/me', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new Error('Missing user ID');
      const result = await authMeUseCase.execute(req.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/register', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new Error('Missing user ID');

      const authHeader = req.headers.authorization!;
      const token = authHeader.slice(7);
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser(token);

      const result = await registerUseCase.execute({
        userId: req.userId,
        email: supabaseUser!.email!,
        name: req.body.name,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
