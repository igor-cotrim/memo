import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Express } from "express";
import pino from "pino";

import * as schema from "../../src/infra/db/schema";
import { createApp } from "../../src/app";

export const TEST_JWT_SECRET = "test-secret-key";

export async function createTestApp(): Promise<{
  app: Express;
  cleanup: () => Promise<void>;
}> {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  // Create tables
  await db.execute(`CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE decks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    created_at TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE flashcards (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    notes TEXT,
    state INTEGER NOT NULL DEFAULT 0,
    due TEXT NOT NULL,
    stability DOUBLE PRECISION NOT NULL DEFAULT 0,
    difficulty DOUBLE PRECISION NOT NULL DEFAULT 0,
    elapsed_days INTEGER NOT NULL DEFAULT 0,
    scheduled_days INTEGER NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    last_review_at TEXT,
    created_at TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE review_logs (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quality INTEGER NOT NULL,
    reviewed_at TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    revoked_at TEXT
  )`);

  const logger = pino({ level: "silent" });
  const app = createApp(db as any, TEST_JWT_SECRET, logger);

  return {
    app,
    cleanup: () => client.close(),
  };
}
