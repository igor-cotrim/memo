import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { UnauthorizedError } from "../../../shared/errors";

export interface AuthRequest<
  Params = Record<string, string>,
> extends Request<Params> {
  userId?: string;
}

export function authMiddleware(jwtSecret: string) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next(
        new UnauthorizedError("Missing or invalid authorization header"),
      );
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(token, jwtSecret) as { userId: string };
      req.userId = payload.userId;
      next();
    } catch (err) {
      console.error("JWT Verify Error:", err);
      next(new UnauthorizedError("Invalid or expired token"));
    }
  };
}
