import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

import { RegisterUseCase } from '../../../usecases/RegisterUseCase';
import { LoginUseCase } from '../../../usecases/LoginUseCase';
import { RefreshTokenUseCase } from '../../../usecases/RefreshTokenUseCase';
import { AuthMeUseCase } from '../../../usecases/AuthMeUseCase';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createAuthRoutes(
  userRepo: IUserRepository,
  refreshTokenRepo: IRefreshTokenRepository,
  jwtSecret: string,
): Router {
  const router = Router();
  const loginRegisterLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  const registerUseCase = new RegisterUseCase(userRepo, refreshTokenRepo, jwtSecret);
  const loginUseCase = new LoginUseCase(userRepo, refreshTokenRepo, jwtSecret);
  const refreshTokenUseCase = new RefreshTokenUseCase(userRepo, refreshTokenRepo, jwtSecret);
  const authMeUseCase = new AuthMeUseCase(userRepo);
  const auth = authMiddleware(jwtSecret);

  router.get('/me', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new Error('Missing user ID');
      const result = await authMeUseCase.execute(req.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/register',
    loginRegisterLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await registerUseCase.execute(req.body);
        res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: COOKIE_MAX_AGE,
        });
        res.status(201).json({ user: result.user, accessToken: result.accessToken });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/login',
    loginRegisterLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await loginUseCase.execute(req.body);
        res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: COOKIE_MAX_AGE,
        });
        res.json({ user: result.user, accessToken: result.accessToken });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
      if (!token) {
        res.status(401).json({ error: 'No refresh token' });
        return;
      }
      const result = await refreshTokenUseCase.execute(token);
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
      });
      res.json({ accessToken: result.accessToken });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    res.json({ message: 'Logged out' });
  });

  return router;
}
