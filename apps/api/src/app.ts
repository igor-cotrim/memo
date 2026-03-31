import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { sql } from "drizzle-orm";
import type { Logger } from "pino";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as schema from "./infra/db/schema";
import { PgUserRepository } from "./infra/db/PgUserRepository";
import { PgDeckRepository } from "./infra/db/PgDeckRepository";
import { PgCardRepository } from "./infra/db/PgCardRepository";
import { PgReviewLogRepository } from "./infra/db/PgReviewLogRepository";
import { PgRefreshTokenRepository } from "./infra/db/PgRefreshTokenRepository";
import { authMiddleware } from "./infra/http/middleware/auth";
import { errorHandler } from "./infra/http/middleware/errorHandler";
import { createAuthRoutes } from "./infra/http/routes/auth.routes";
import { createDeckRoutes } from "./infra/http/routes/deck.routes";
import { createCardRoutes } from "./infra/http/routes/card.routes";
import { createReviewRoutes } from "./infra/http/routes/review.routes";
import { createStatsRoutes } from "./infra/http/routes/stats.routes";

export function createApp(
  db: PostgresJsDatabase<typeof schema>,
  jwtSecret: string,
  logger: Logger,
): express.Express {
  const app = express();

  app.use(pinoHttp({ logger }));

  // Security Middlewares
  app.use(helmet());

  // General Rate limiting setup
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    }),
  );

  app.use(apiLimiter);
  app.use(express.json());
  app.use(cookieParser());

  // Repositories
  const userRepo = new PgUserRepository(db);
  const deckRepo = new PgDeckRepository(db);
  const cardRepo = new PgCardRepository(db);
  const reviewLogRepo = new PgReviewLogRepository(db);
  const refreshTokenRepo = new PgRefreshTokenRepository(db);

  // Health check
  app.get("/health", async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok", db: "connected" });
    } catch (err) {
      logger.error({ err }, "Database health check failed");
      res.status(503).json({ status: "error", db: "disconnected" });
    }
  });

  // Auth (public)
  app.use("/auth", createAuthRoutes(userRepo, refreshTokenRepo, jwtSecret));

  // Protected routes
  const auth = authMiddleware(jwtSecret);
  app.use("/decks", auth, createDeckRoutes(deckRepo));
  app.use("/decks/:deckId/cards", auth, createCardRoutes(cardRepo, deckRepo));
  app.use(
    "/review",
    auth,
    createReviewRoutes(cardRepo, deckRepo, reviewLogRepo),
  );
  app.use("/stats", auth, createStatsRoutes(reviewLogRepo, deckRepo));

  // Error handling
  app.use(errorHandler);

  return app;
}
