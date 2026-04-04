import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CardsPage from '../../src/pages/CardsPage';
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

const baseDeck = {
  id: 'deck-1',
  userId: 'u1',
  name: 'Spanish',
  description: 'desc',
  color: '#e2a83e',
  createdAt: new Date().toISOString(),
};

const baseCard = {
  id: 'card-1',
  deckId: 'deck-1',
  front: 'Hola',
  back: 'Hello',
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

describe('CardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    mockedApi.getDeck.mockReturnValue(new Promise(() => {}));
    mockedApi.getCards.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<CardsPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no cards', async () => {
    mockedApi.getDeck.mockResolvedValue(baseDeck);
    mockedApi.getCards.mockResolvedValue([]);
    renderWithProviders(<CardsPage />);

    await waitFor(() => {
      // en locale: "No cards yet"
      expect(screen.getByText('No cards yet')).toBeInTheDocument();
    });
  });

  it('renders card list', async () => {
    mockedApi.getDeck.mockResolvedValue(baseDeck);
    mockedApi.getCards.mockResolvedValue([baseCard]);
    renderWithProviders(<CardsPage />);

    await waitFor(() => {
      expect(screen.getByText('Hola')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('shows deck name as header', async () => {
    mockedApi.getDeck.mockResolvedValue(baseDeck);
    mockedApi.getCards.mockResolvedValue([]);
    renderWithProviders(<CardsPage />);

    await waitFor(() => {
      expect(screen.getByText('Spanish')).toBeInTheDocument();
    });
  });

  it('opens create card modal', async () => {
    const user = userEvent.setup();
    mockedApi.getDeck.mockResolvedValue(baseDeck);
    mockedApi.getCards.mockResolvedValue([]);
    renderWithProviders(<CardsPage />);

    await waitFor(() => {
      expect(screen.getByText('No cards yet')).toBeInTheDocument();
    });

    // en locale: "＋ Add Card"
    await user.click(screen.getByText('＋ Add Card'));
    expect(screen.getByText('New Card')).toBeInTheDocument();
  });

  it('creates a card', async () => {
    const user = userEvent.setup();
    mockedApi.getDeck.mockResolvedValue(baseDeck);
    mockedApi.getCards.mockResolvedValue([]);
    mockedApi.createCard.mockResolvedValue(baseCard);

    renderWithProviders(<CardsPage />);

    await waitFor(() => {
      expect(screen.getByText('No cards yet')).toBeInTheDocument();
    });

    await user.click(screen.getByText('＋ Add Card'));
    await user.type(screen.getByLabelText('Front (Question)'), 'Q');
    await user.type(screen.getByLabelText('Back (Answer)'), 'A');
    await user.click(screen.getByText('Add Card'));

    expect(mockedApi.createCard).toHaveBeenCalledWith('deck-1', {
      front: 'Q',
      back: 'A',
      notes: '',
    });
  });

  it('deletes a card with confirmation', async () => {
    const user = userEvent.setup();
    mockedApi.getDeck.mockResolvedValue(baseDeck);
    mockedApi.getCards.mockResolvedValue([baseCard]);
    mockedApi.deleteCard.mockResolvedValue(undefined);

    renderWithProviders(<CardsPage />);

    await waitFor(() => {
      expect(screen.getByText('Hola')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Delete card'));

    // Click the "Delete" button in the confirmation dialog
    const dialog = screen.getByRole('dialog');
    await user.click(
      Array.from(dialog.querySelectorAll('button')).find((btn) => btn.textContent === 'Delete')!,
    );
    expect(mockedApi.deleteCard).toHaveBeenCalledWith('deck-1', 'card-1');
  });
});
