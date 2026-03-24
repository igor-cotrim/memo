import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type * as schema from "./infra/db/schema";
import { SqliteUserRepository } from "./infra/db/SqliteUserRepository";
import { SqliteDeckRepository } from "./infra/db/SqliteDeckRepository";
import { SqliteCardRepository } from "./infra/db/SqliteCardRepository";
import { SqliteReviewLogRepository } from "./infra/db/SqliteReviewLogRepository";
import { SqliteRefreshTokenRepository } from "./infra/db/SqliteRefreshTokenRepository";
import { authMiddleware } from "./infra/http/middleware/auth";
import { errorHandler } from "./infra/http/middleware/errorHandler";
import { createAuthRoutes } from "./infra/http/routes/auth.routes";
import { createDeckRoutes } from "./infra/http/routes/deck.routes";
import { createCardRoutes } from "./infra/http/routes/card.routes";
import { createReviewRoutes } from "./infra/http/routes/review.routes";
import { createStatsRoutes } from "./infra/http/routes/stats.routes";

export function createApp(
  db: BetterSQLite3Database<typeof schema>,
  jwtSecret: string,
): express.Express {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  // Repositories
  const userRepo = new SqliteUserRepository(db);
  const deckRepo = new SqliteDeckRepository(db);
  const cardRepo = new SqliteCardRepository(db);
  const reviewLogRepo = new SqliteReviewLogRepository(db);
  const refreshTokenRepo = new SqliteRefreshTokenRepository(db);

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
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
