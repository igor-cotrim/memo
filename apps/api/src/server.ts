import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import pino from "pino";

import * as schema from "./infra/db/schema";
import { createApp } from "./app";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

process.on("uncaughtException", (err) => {
  logger.fatal(err, "Uncaught Exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason, promise }, "Unhandled Rejection");
  process.exit(1);
});

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3333;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const NODE_ENV = process.env.NODE_ENV || "development";

if (!DATABASE_URL) {
  logger.fatal("DATABASE_URL is not defined");
  process.exit(1);
}

if (!JWT_SECRET) {
  logger.fatal("JWT_SECRET is not defined");
  process.exit(1);
}

if (NODE_ENV === "production" && !CLIENT_ORIGIN) {
  logger.fatal("CLIENT_ORIGIN is not defined in production");
  process.exit(1);
}

const sqlite = new Database(DATABASE_URL);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

const app = createApp(db, JWT_SECRET, logger);

app.listen(PORT, () => {
  logger.info(`🚀 API server running on port ${PORT}`);
});
