# Memô - A modern flashcard application

A modern, high-performance flashcard application built with a focus on efficient learning using the **FSRS (Free Spaced Repetition Scheduler)** algorithm.

## Features

- **Spaced Repetition**: Optimized review cycles powered by the FSRS algorithm.
- **Decks & Cards**: Organize your flashcards into decks with custom colors and descriptions.
- **Authentication**: Secure JWT-based authentication with high-entropy hashing (bcrypt) and refresh token rotation.
- **Import/Export**: Import flashcards from CSV files to quickly build your decks.
- **Statistics**: Track your progress with detailed review logs and performance metrics.
- **Internationalization**: Available in English and Brazilian Portuguese (PT-BR).
- **Responsive Design**: Modern UI built with React and Tailwind CSS v4, optimized for both desktop and mobile.
- **Dark Mode Support**: Deeply integrated dark mode for comfortable late-night study sessions.

## Tech Stack

### Monorepo

- **pnpm workspaces**: Efficient dependency management and shared packages.
- **TypeScript**: End-to-end type safety across the entire stack.

### Backend (`/apps/api`)

- **Node.js & Express**: Fast and minimalist web framework.
- **Drizzle ORM**: Type-safe ORM for interacting with the database.
- **PostgreSQL**: Hosted on Supabase, accessed via `postgres` (postgres.js) driver.
- **TS-FSRS**: Modern implementation of the Free Spaced Repetition Scheduler.
- **Security**: Hardened with `helmet`, `express-rate-limit`, and VPC-optimized CORS.

### Frontend (`/apps/web`)

- **React**: Component-based UI library.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS v4**: Utility-first CSS framework for rapid UI development.
- **Axios**: Promised-based HTTP client for API communication.
- **React Router**: Client-side routing for seamless navigation.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v9 or higher)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd flashcards
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory.
   - Adjust the values as needed (especially `DATABASE_URL` and `JWT_SECRET`).

### Development

Run all applications in parallel:

```bash
pnpm dev
```

Or run them individually:

- API: `pnpm dev:api`
- Web: `pnpm dev:web`

### Database Management

The API uses Drizzle ORM for database migrations and schema management.

- Generate migrations: `pnpm --filter api run db:generate`
- Run migrations: `pnpm --filter api run db:migrate`
- Push schema directly (dev): `pnpm --filter api run db:push`

### Linting & Formatting

```bash
pnpm lint            # Lint all workspaces (ESLint)
pnpm format          # Format all files (Prettier)
pnpm format:check    # Check formatting without writing
```

### Testing

```bash
pnpm test            # Run all tests
pnpm test:api        # API tests only
pnpm test:web        # Web tests only
pnpm test:coverage   # All tests with coverage
```

## Project Structure

```bash
├── apps
│   ├── api          # Express.js backend
│   └── web          # React frontend
├── packages
│   └── shared-types # Shared TypeScript interfaces
├── .env.example     # Environment variables template
└── pnpm-workspace.yaml
```

## Production

To build the project for production:

```bash
pnpm build
```

The built assets will be in `apps/web/dist` and `apps/api/dist`.
