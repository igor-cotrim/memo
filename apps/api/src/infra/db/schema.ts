import { pgTable, text, integer, doublePrecision } from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

// ─── Decks ───────────────────────────────────────────────────────────────────

export const decks = pgTable("decks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: text("created_at").notNull(),
});

// ─── Flashcards ──────────────────────────────────────────────────────────────

export const flashcards = pgTable("flashcards", {
  id: text("id").primaryKey(),
  deckId: text("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  notes: text("notes"),
  state: integer("state").notNull().default(0), // 0=New, 1=Learning, 2=Review, 3=Relearning
  due: text("due").notNull(),
  stability: doublePrecision("stability").notNull().default(0),
  difficulty: doublePrecision("difficulty").notNull().default(0),
  elapsedDays: integer("elapsed_days").notNull().default(0),
  scheduledDays: integer("scheduled_days").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  lastReviewAt: text("last_review_at"),

  createdAt: text("created_at").notNull(),
});

// ─── Review Logs ─────────────────────────────────────────────────────────────

export const reviewLogs = pgTable("review_logs", {
  id: text("id").primaryKey(),
  cardId: text("card_id")
    .notNull()
    .references(() => flashcards.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quality: integer("quality").notNull(),
  reviewedAt: text("reviewed_at").notNull(),
});

// ─── Refresh Tokens ──────────────────────────────────────────────────────────

export const refreshTokens = pgTable("refresh_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  revokedAt: text("revoked_at"),
});
