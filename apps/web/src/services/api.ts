import axios from "axios";

import type {
  AuthResponse,
  PublicUser,
  Deck,
  Flashcard,
  ReviewSession,
  ReviewStats,
  CreateDeckRequest,
  UpdateDeckRequest,
  CreateCardRequest,
  UpdateCardRequest,
  ReviewResult,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
} from "@flashcard-app/shared-types";

const baseURL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? undefined : "/api");
if (!baseURL && import.meta.env.PROD) {
  throw new Error("VITE_API_URL is undefined in production");
}

const api = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

// Interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: handle 401 and refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (
        original.url?.includes("/auth/login") ||
        original.url?.includes("/auth/register") ||
        original.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post<{ accessToken: string }>("/auth/refresh")
            .then((res) => res.data.accessToken)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const accessToken = await refreshPromise;
        localStorage.setItem("accessToken", accessToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", data);
  localStorage.setItem("accessToken", res.data.accessToken);
  return res.data;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", data);
  localStorage.setItem("accessToken", res.data.accessToken);
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
  localStorage.removeItem("accessToken");
}

export async function getMe(): Promise<{ user: PublicUser }> {
  const res = await api.get<{ user: PublicUser }>("/auth/me");
  return res.data;
}

// ─── User Profile ───────────────────────────────────────────────────────────

export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse> {
  const res = await api.put<UpdateProfileResponse>("/users/profile", data);
  return res.data;
}

export async function changePassword(
  data: ChangePasswordRequest,
): Promise<void> {
  await api.put("/users/password", data);
}

// ─── Decks ───────────────────────────────────────────────────────────────────

export async function getDecks(): Promise<Deck[]> {
  const res = await api.get<Deck[]>("/decks");
  return res.data;
}

export async function getDeck(id: string): Promise<Deck> {
  const res = await api.get<Deck>(`/decks/${id}`);
  return res.data;
}

export async function createDeck(data: CreateDeckRequest): Promise<Deck> {
  const res = await api.post<Deck>("/decks", data);
  return res.data;
}

export async function updateDeck(
  id: string,
  data: UpdateDeckRequest,
): Promise<Deck> {
  const res = await api.put<Deck>(`/decks/${id}`, data);
  return res.data;
}

export async function deleteDeck(id: string): Promise<void> {
  await api.delete(`/decks/${id}`);
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export async function getCards(deckId: string): Promise<Flashcard[]> {
  const res = await api.get<Flashcard[]>(`/decks/${deckId}/cards`);
  return res.data;
}

export async function createCard(
  deckId: string,
  data: CreateCardRequest,
): Promise<Flashcard> {
  const res = await api.post<Flashcard>(`/decks/${deckId}/cards`, data);
  return res.data;
}

export async function updateCard(
  deckId: string,
  cardId: string,
  data: UpdateCardRequest,
): Promise<Flashcard> {
  const res = await api.put<Flashcard>(
    `/decks/${deckId}/cards/${cardId}`,
    data,
  );
  return res.data;
}

export async function deleteCard(
  deckId: string,
  cardId: string,
): Promise<void> {
  await api.delete(`/decks/${deckId}/cards/${cardId}`);
}

// ─── Review ──────────────────────────────────────────────────────────────────

export async function getDueCards(deckId: string): Promise<ReviewSession> {
  const res = await api.get<ReviewSession>(`/review/${deckId}`);
  return res.data;
}

export async function submitReview(data: ReviewResult): Promise<Flashcard> {
  const res = await api.post<Flashcard>("/review", data);
  return res.data;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getStats(): Promise<ReviewStats> {
  const res = await api.get<ReviewStats>("/stats");
  return res.data;
}
