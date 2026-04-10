import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DecksPage from '../../src/pages/DecksPage';
import * as api from '../../src/services/api';
import { renderWithProviders } from '../test-utils';

const mockNavigate = vi.fn();

vi.mock('../../src/services/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockedApi = vi.mocked(api);

const testDeck = {
  id: 'd-1',
  userId: 'u-1',
  name: 'Spanish',
  description: 'desc',
  color: '#000',
  createdAt: new Date().toISOString(),
};

describe('DecksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('shows loading spinner initially', () => {
    mockedApi.getDecks.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<DecksPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no decks', async () => {
    mockedApi.getDecks.mockResolvedValue([]);
    renderWithProviders(<DecksPage />);

    await waitFor(() => {
      // en locale: "No decks yet"
      expect(screen.getByText('No decks yet')).toBeInTheDocument();
    });
  });

  it('renders deck list', async () => {
    mockedApi.getDecks.mockResolvedValue([
      {
        id: 'd-1',
        userId: 'u-1',
        name: 'Spanish',
        description: 'desc',
        color: '#000',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'd-2',
        userId: 'u-1',
        name: 'French',
        createdAt: new Date().toISOString(),
      },
    ]);
    renderWithProviders(<DecksPage />);

    await waitFor(() => {
      expect(screen.getByText('Spanish')).toBeInTheDocument();
      expect(screen.getByText('French')).toBeInTheDocument();
    });
  });

  it('opens create modal', async () => {
    const user = userEvent.setup();
    mockedApi.getDecks.mockResolvedValue([]);
    renderWithProviders(<DecksPage />);

    await waitFor(() => {
      expect(screen.getByText('No decks yet')).toBeInTheDocument();
    });

    // en locale: "＋ New Deck"
    await user.click(screen.getByText('＋ New Deck'));
    expect(screen.getByText('New Deck')).toBeInTheDocument();
  });

  it('creates a deck via modal', async () => {
    const user = userEvent.setup();
    mockedApi.getDecks.mockResolvedValue([]);
    mockedApi.createDeck.mockResolvedValue({
      id: 'd-new',
      userId: 'u-1',
      name: 'German',
      createdAt: new Date().toISOString(),
    });
    renderWithProviders(<DecksPage />);

    await waitFor(() => {
      expect(screen.getByText('No decks yet')).toBeInTheDocument();
    });

    await user.click(screen.getByText('＋ New Deck'));
    // en locale: placeholder "e.g. Spanish Vocabulary…"
    await user.type(screen.getByPlaceholderText('e.g. Spanish Vocabulary…'), 'German');
    await user.click(screen.getByText('Create Deck'));

    expect(mockedApi.createDeck).toHaveBeenCalledWith(expect.objectContaining({ name: 'German' }));
  });

  it('shows "Review All" button when decks exist', async () => {
    mockedApi.getDecks.mockResolvedValue([testDeck]);
    renderWithProviders(<DecksPage />);

    await waitFor(() => {
      expect(screen.getByText('▶ Review All')).toBeInTheDocument();
    });
  });

  it('does not show "Review All" button when there are no decks', async () => {
    mockedApi.getDecks.mockResolvedValue([]);
    renderWithProviders(<DecksPage />);

    await waitFor(() => {
      expect(screen.getByText('No decks yet')).toBeInTheDocument();
    });

    expect(screen.queryByText('▶ Review All')).not.toBeInTheDocument();
  });

  it('"Review All" button navigates to /review/all', async () => {
    const user = userEvent.setup();
    mockedApi.getDecks.mockResolvedValue([testDeck]);
    renderWithProviders(<DecksPage />);

    await waitFor(() => {
      expect(screen.getByText('▶ Review All')).toBeInTheDocument();
    });

    await user.click(screen.getByText('▶ Review All'));
    expect(mockNavigate).toHaveBeenCalledWith('/review/all');
  });

  it('deletes a deck with confirmation', async () => {
    const user = userEvent.setup();
    mockedApi.getDecks.mockResolvedValue([
      {
        id: 'd-1',
        userId: 'u-1',
        name: 'ToDelete',
        createdAt: new Date().toISOString(),
      },
    ]);
    mockedApi.deleteDeck.mockResolvedValue(undefined);

    renderWithProviders(<DecksPage />);

    await waitFor(() => {
      expect(screen.getByText('ToDelete')).toBeInTheDocument();
    });

    // Button text: "✕ Delete" — opens confirmation dialog
    await user.click(screen.getByText('✕ Delete'));

    // Click the "Delete" button in the confirmation dialog
    const dialog = screen.getByRole('dialog');
    await user.click(
      Array.from(dialog.querySelectorAll('button')).find((btn) => btn.textContent === 'Delete')!,
    );
    expect(mockedApi.deleteDeck).toHaveBeenCalledWith('d-1');
  });
});
