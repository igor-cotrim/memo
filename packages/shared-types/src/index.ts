// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  onboardingCompletedAt: string | null;
}

export type PublicUser = Omit<User, 'passwordHash'>;

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// ─── User Profile ───────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileResponse {
  user: PublicUser;
}

// ─── Deck ────────────────────────────────────────────────────────────────────

export interface Deck {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface CreateDeckRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateDeckRequest {
  name?: string;
  description?: string;
  color?: string;
}

// ─── Flashcard ───────────────────────────────────────────────────────────────

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  notes?: string;
  state: number;
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReviewAt: string | null;
  createdAt: string;
}

export interface CreateCardRequest {
  front: string;
  back: string;
  notes?: string;
}

export interface UpdateCardRequest {
  front?: string;
  back?: string;
  notes?: string;
}

// ─── Review ──────────────────────────────────────────────────────────────────

export type ReviewQuality = 1 | 2 | 3 | 4;

export interface ReviewResult {
  cardId: string;
  quality: ReviewQuality;
  timezoneOffset?: number;
}

export interface ReviewSession {
  deckId: string;
  cards: Flashcard[];
  totalDue: number;
}

export interface DueCountResponse {
  totalDue: number;
}

// ─── Import ─────────────────────────────────────────────────────────────────

export interface ImportCardRow {
  front: string;
  back: string;
  notes?: string;
}

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportDeckResponse {
  deck: Deck;
  cardsCreated: number;
  errors: ImportRowError[];
}

export interface ImportCardsResponse {
  cardsCreated: number;
  errors: ImportRowError[];
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface DailyReviewCount {
  date: string;
  count: number;
}

export interface DeckAccuracy {
  deckId: string;
  deckName: string;
  totalReviews: number;
  correctReviews: number;
  accuracy: number;
}

export interface ReviewStats {
  last7Days: DailyReviewCount[];
  last30Days: DailyReviewCount[];
  last365Days: DailyReviewCount[];
  deckAccuracies: DeckAccuracy[];
  currentStreak: number;
}
