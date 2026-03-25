import axios from "axios";

import type {
  AuthResponse,
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
} from "@flashcard-app/shared-types";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

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
        original.url?.includes("/auth/register")
      ) {
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        const { data } = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true },
        );
        localStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
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
