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
    useParams: () => ({ deckId: 'all' }),
    useNavigate: () => mockNavigate,
  };
});

const mockNavigate = vi.fn();
const mockedApi = vi.mocked(api);

const baseCard = (id: string, deckId: string, front = 'Question') => ({
  id,
  deckId,
  front,
  back: 'Answer',
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
});

const baseAllDecksSession = {
  cards: [
    baseCard('card-1', 'deck-1', 'Question 1'),
    baseCard('card-2', 'deck-2', 'Question 2'),
  ],
  totalDue: 2,
  deckNames: {
    'deck-1': 'Spanish',
    'deck-2': 'French',
  },
};

describe('ReviewPage — all decks mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('shows loading spinner initially', () => {
    mockedApi.getAllDueCards.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ReviewPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('calls getAllDueCards instead of getDueCards', async () => {
    mockedApi.getAllDueCards.mockResolvedValue(baseAllDecksSession);
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(mockedApi.getAllDueCards).toHaveBeenCalledTimes(1);
      expect(mockedApi.getDueCards).not.toHaveBeenCalled();
    });
  });

  it('shows card front for review', async () => {
    mockedApi.getAllDueCards.mockResolvedValue(baseAllDecksSession);
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });
  });

  it('shows the deck name badge for the current card', async () => {
    mockedApi.getAllDueCards.mockResolvedValue(baseAllDecksSession);
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Spanish')).toBeInTheDocument();
    });
  });

  it('back button reads "Back to Decks" (not "Back to Deck")', async () => {
    mockedApi.getAllDueCards.mockResolvedValue(baseAllDecksSession);
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText(/Back to Decks/)).toBeInTheDocument();
      expect(screen.queryByText(/Back to Deck$/)).not.toBeInTheDocument();
    });
  });

  it('back button navigates to /decks', async () => {
    const user = userEvent.setup();
    mockedApi.getAllDueCards.mockResolvedValue(baseAllDecksSession);
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText(/Back to Decks/)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Back to Decks/));
    expect(mockNavigate).toHaveBeenCalledWith('/decks');
  });

  it("shows 'all caught up' when no due cards", async () => {
    mockedApi.getAllDueCards.mockResolvedValue({ cards: [], totalDue: 0, deckNames: {} });
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('shows deck name of second card after rating the first', async () => {
    const user = userEvent.setup();
    mockedApi.getAllDueCards.mockResolvedValue(baseAllDecksSession);
    mockedApi.submitReview.mockResolvedValue({ ...baseCard('card-1', 'deck-1'), reps: 1 });
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    // Flip and rate
    await user.click(screen.getByText('Question 1'));
    await user.click(screen.getByText('😎'));

    await waitFor(() => {
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('French')).toBeInTheDocument();
    });
  });

  it('shows session complete after reviewing all cards', async () => {
    const user = userEvent.setup();
    mockedApi.getAllDueCards.mockResolvedValue({
      cards: [baseCard('card-1', 'deck-1', 'Q1')],
      totalDue: 1,
      deckNames: { 'deck-1': 'Spanish' },
    });
    mockedApi.submitReview.mockResolvedValue({ ...baseCard('card-1', 'deck-1'), reps: 1 });
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Q1')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Q1'));
    await user.click(screen.getByText('😎'));

    await waitFor(() => {
      expect(screen.getByText('Session complete!')).toBeInTheDocument();
    });
  });
});
