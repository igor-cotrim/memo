import axios from 'axios';

import type {
  AllDecksReviewSession,
  AuthResponse,
  User,
  Deck,
  Flashcard,
  ReviewSession,
  ReviewStats,
  CreateDeckRequest,
  UpdateDeckRequest,
  CreateCardRequest,
  UpdateCardRequest,
  ReviewResult,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ImportDeckResponse,
  ImportCardsResponse,
  DueCountResponse,
} from '@flashcard-app/shared-types';

import { supabase } from '../lib/supabase';

const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? undefined : '/api');
if (!baseURL && import.meta.env.PROD) {
  throw new Error('VITE_API_URL is undefined in production');
}

const api = axios.create({
  baseURL,
});

// Interceptor: attach Supabase access token
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ─── Auth ──────────���──────────────────────────────────��──────────────────────

export async function registerUser(name: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', { name });
  return res.data;
}

export async function getMe(): Promise<{ user: User }> {
  const res = await api.get<{ user: User }>('/auth/me');
  return res.data;
}

// ─── User Profile ──────────────��────────────────────────────────────────────

export async function updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  const res = await api.put<UpdateProfileResponse>('/users/profile', data);
  return res.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await api.put('/users/password', data);
}

export async function completeOnboarding(): Promise<UpdateProfileResponse> {
  const res = await api.patch<UpdateProfileResponse>('/users/onboarding-complete');
  return res.data;
}

// ─── Decks ───────────��───────────────────────────��───────────────────────────

export async function getDecks(): Promise<Deck[]> {
  const res = await api.get<Deck[]>('/decks');
  return res.data;
}

export async function getDeck(id: string): Promise<Deck> {
  const res = await api.get<Deck>(`/decks/${id}`);
  return res.data;
}

export async function createDeck(data: CreateDeckRequest): Promise<Deck> {
  const res = await api.post<Deck>('/decks', data);
  return res.data;
}

export async function updateDeck(id: string, data: UpdateDeckRequest): Promise<Deck> {
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

export async function createCard(deckId: string, data: CreateCardRequest): Promise<Flashcard> {
  const res = await api.post<Flashcard>(`/decks/${deckId}/cards`, data);
  return res.data;
}

export async function updateCard(
  deckId: string,
  cardId: string,
  data: UpdateCardRequest,
): Promise<Flashcard> {
  const res = await api.put<Flashcard>(`/decks/${deckId}/cards/${cardId}`, data);
  return res.data;
}

export async function deleteCard(deckId: string, cardId: string): Promise<void> {
  await api.delete(`/decks/${deckId}/cards/${cardId}`);
}

// ─── Import ─────────────────────────────────────────────────────────────────

export async function importDeck(
  file: File,
  meta: { name?: string; description?: string },
): Promise<ImportDeckResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (meta.name) formData.append('name', meta.name);
  if (meta.description) formData.append('description', meta.description);
  const res = await api.post<ImportDeckResponse>('/decks/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function importCards(deckId: string, file: File): Promise<ImportCardsResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<ImportCardsResponse>(`/decks/${deckId}/cards/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// ─── Review ────────────���─────────────────────────────────────────────────────

export async function getDueCount(): Promise<DueCountResponse> {
  const res = await api.get<DueCountResponse>('/review/due-count');
  return res.data;
}

export async function getDueCards(deckId: string): Promise<ReviewSession> {
  const res = await api.get<ReviewSession>(`/review/${deckId}`);
  return res.data;
}

export async function getAllDueCards(): Promise<AllDecksReviewSession> {
  const res = await api.get<AllDecksReviewSession>('/review/all');
  return res.data;
}

export async function submitReview(data: ReviewResult): Promise<Flashcard> {
  const res = await api.post<Flashcard>('/review', data);
  return res.data;
}

// ─── Stats ───────────���────────────────────────────���──────────────────────────

export async function getStats(): Promise<ReviewStats> {
  const timezoneOffset = new Date().getTimezoneOffset();
  const res = await api.get<ReviewStats>('/stats', {
    params: { timezoneOffset },
  });
  return res.data;
}
