# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
pnpm dev          # Run all apps in parallel
pnpm dev:api      # API only (port 3333)
pnpm dev:web      # Web only (port 5173)
```

### Build, Lint & Format

```bash
pnpm build        # Build packages then apps
pnpm lint         # Lint all workspaces (ESLint)
pnpm format       # Format all files (Prettier)
pnpm format:check # Check formatting without writing
```

### Testing

```bash
pnpm test         # All tests
pnpm test:api     # API tests only
pnpm test:web     # Web tests only

# From within apps/api:
pnpm test:unit          # Unit tests only (tests/unit/)
pnpm test:integration   # Integration tests only (tests/integration/)
pnpm test:watch         # Watch mode

# From within apps/web:
pnpm test:watch         # Watch mode
pnpm test:coverage      # With coverage report

# Run a single test file (from repo root):
pnpm --filter api run test -- tests/unit/card-review.test.ts
pnpm --filter web run test -- tests/components/DeckItem.test.tsx
```

### Database (from repo root)

```bash
pnpm --filter api run db:generate  # Generate migration files from schema changes
pnpm --filter api run db:migrate   # Run pending migrations
pnpm --filter api run db:push      # Push schema directly (dev only)
```

## Architecture

**Monorepo** managed with pnpm workspaces:

- `apps/api` — Express backend
- `apps/web` — React frontend
- `packages/shared-types` — Shared TypeScript interfaces used by both apps

### Backend (`apps/api`)

Layered architecture:

- `src/domain/` — Business logic and FSRS (spaced repetition) algorithm
- `src/usecases/` — Application use cases orchestrating domain logic
- `src/infra/db/` — Drizzle ORM schema and PostgreSQL repositories
- `src/infra/http/` — Express routes and middleware
- `src/shared/` — Shared error types and utilities
- `src/server.ts` — Entry point; connects to PostgreSQL via postgres.js and starts server
- `src/app.ts` — Express setup: pino-http, helmet, CORS, rate limiting (100 req/15 min), cookie parser; registers all routes

Auth uses JWT access tokens + refresh token rotation. Refresh tokens are stored in the database.

### Frontend (`apps/web`)

- `src/App.tsx` — Root routing with React Router v7; all pages are lazy-loaded with `Suspense`
- `src/pages/` — Route-level components (Dashboard, Decks, Cards, Review, Login, Register)
- `src/components/` — Reusable UI components
- `src/hooks/` — `useAuth()` (AuthContext + AuthProvider), `useLocale()` (i18n)
- `src/services/api.ts` — Axios client; auto-attaches `Authorization: Bearer` header from localStorage; handles 401 → refresh → retry with race-condition coalescing
- `src/locale/` — i18n strings for EN and PT-BR

**State management**: Context API only (no Redux/Zustand). Auth state (user, token, login/logout) lives in `AuthContext`. Access token stored in localStorage; refresh token in httpOnly cookies.

### Shared Types (`packages/shared-types`)

All API request/response types are defined here and imported by both apps, ensuring end-to-end type safety.

## Environment

Copy `.env.example` to `.env` at the repo root. Required variables:

- `JWT_SECRET` — signing key for access tokens
- `DATABASE_URL` — PostgreSQL connection string (e.g. Supabase)
- `CLIENT_ORIGIN` — frontend origin for CORS
- `PORT` — API port (default `3333`)
- `VITE_API_URL` — frontend API base URL (dev proxy defaults to `http://localhost:3333`)

## Key Dependencies

- **TS-FSRS** (`ts-fsrs`) — Free Spaced Repetition Scheduler algorithm powering review scheduling
- **Drizzle ORM** — type-safe PostgreSQL access with `postgres` (postgres.js)
- **Vitest** — test runner for both apps; API uses Node environment, web uses jsdom
