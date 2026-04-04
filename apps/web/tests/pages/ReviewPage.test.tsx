import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ReviewPage from '../../src/pages/ReviewPage';
import * as api from '../../src/services/api';
import { renderWithProviders } from '../test-utils';

vi.mock('../../src/services/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ deckId: 'deck-1' }),
  };
});

const mockedApi = vi.mocked(api);

const baseCard = {
  id: 'card-1',
  deckId: 'deck-1',
  front: 'Question 1',
  back: 'Answer 1',
  notes: '',
  state: 0,
  due: new Date().toISOString(),
  stability: 0,
  difficulty: 0,
  elapsedDays: 0,
  scheduledDays: 0,
  reps: 0,
  lapses: 0,
  lastReviewAt: null,
  createdAt: new Date().toISOString(),
};

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    mockedApi.getDueCards.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ReviewPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it("shows 'all caught up' when no due cards", async () => {
    mockedApi.getDueCards.mockResolvedValue({
      deckId: 'deck-1',
      cards: [],
      totalDue: 0,
    });
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      // en locale: "All caught up!"
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('shows card front for review', async () => {
    mockedApi.getDueCards.mockResolvedValue({
      deckId: 'deck-1',
      cards: [baseCard],
      totalDue: 1,
    });
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });
  });

  it('shows progress indicator', async () => {
    mockedApi.getDueCards.mockResolvedValue({
      deckId: 'deck-1',
      cards: [baseCard],
      totalDue: 1,
    });
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      // en locale: "card 1 / 1"
      expect(screen.getByText(/card 1 \/ 1/)).toBeInTheDocument();
    });
  });

  it('flips the card on click', async () => {
    const user = userEvent.setup();
    mockedApi.getDueCards.mockResolvedValue({
      deckId: 'deck-1',
      cards: [baseCard],
      totalDue: 1,
    });
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    // Click to flip
    await user.click(screen.getByText('Question 1'));

    // Should show rating buttons after flipping
    expect(screen.getByText('😵')).toBeInTheDocument();
  });

  it('submits review and shows completion', async () => {
    const user = userEvent.setup();
    mockedApi.getDueCards.mockResolvedValue({
      deckId: 'deck-1',
      cards: [baseCard],
      totalDue: 1,
    });
    mockedApi.submitReview.mockResolvedValue({
      ...baseCard,
      reps: 1,
      state: 2,
    });

    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    // Flip
    await user.click(screen.getByText('Question 1'));

    // Rate as Easy
    await user.click(screen.getByText('😎'));

    await waitFor(() => {
      // en locale: "Session complete!"
      expect(screen.getByText('Session complete!')).toBeInTheDocument();
    });
  });
});
