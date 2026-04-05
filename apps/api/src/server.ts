import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import pino from 'pino';

import * as schema from './infra/db/schema';
import { createApp } from './app';
import { createSupabaseAdmin } from './infra/supabase';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

process.on('uncaughtException', (err) => {
  logger.fatal(err, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled Rejection');
  process.exit(1);
});

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const PORT = process.env.PORT || 3333;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!DATABASE_URL) {
  logger.fatal('DATABASE_URL is not defined');
  process.exit(1);
}

if (!SUPABASE_URL) {
  logger.fatal('SUPABASE_URL is not defined');
  process.exit(1);
}

if (!SUPABASE_SECRET_KEY) {
  logger.fatal('SUPABASE_SECRET_KEY is not defined');
  process.exit(1);
}

if (NODE_ENV === 'production' && !CLIENT_ORIGIN) {
  logger.fatal('CLIENT_ORIGIN is not defined in production');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });
const supabase = createSupabaseAdmin(SUPABASE_URL, SUPABASE_SECRET_KEY);

const app = createApp(db, supabase, logger);

app.listen(PORT, () => {
  logger.info(`🚀 API server running on port ${PORT}`);
});
