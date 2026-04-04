import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DeckModal from '../../src/components/DeckModal';
import { renderWithProviders } from '../test-utils';

describe('DeckModal', () => {
  it("renders 'New Deck' title when no deck is provided", () => {
    renderWithProviders(<DeckModal onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText('New Deck')).toBeInTheDocument();
  });

  it("renders 'Edit Deck' title with deck data pre-filled", () => {
    const deck = {
      id: 'd-1',
      userId: 'u-1',
      name: 'Spanish',
      description: 'Learn Spanish',
      color: '#2dd4bf',
      createdAt: new Date().toISOString(),
    };

    renderWithProviders(<DeckModal deck={deck} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText('Edit Deck')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Spanish')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Learn Spanish')).toBeInTheDocument();
  });

  it('calls onSave with form data on submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<DeckModal onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByPlaceholderText('e.g. Spanish Vocabulary…'), 'French');

    await user.click(screen.getByText('Create Deck'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'French',
        color: '#e2a83e', // default color
      }),
    );
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<DeckModal onClose={onClose} onSave={vi.fn()} />);

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('allows selecting a color', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<DeckModal onClose={vi.fn()} onSave={onSave} />);

    // Click the second color swatch (#2dd4bf)
    const colorSwatches = screen.getAllByRole('radio');
    await user.click(colorSwatches[1]!);

    await user.type(screen.getByPlaceholderText('e.g. Spanish Vocabulary…'), 'Test');
    await user.click(screen.getByText('Create Deck'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#2dd4bf',
      }),
    );
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(<DeckModal onClose={vi.fn()} onSave={onSave} />);

    await user.click(screen.getByText('Create Deck'));

    expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('disables submit button while saving', async () => {
    const user = userEvent.setup();
    let resolveSave!: () => void;
    const onSave = vi.fn(() => new Promise<void>((r) => (resolveSave = r)));

    renderWithProviders(<DeckModal onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByPlaceholderText('e.g. Spanish Vocabulary…'), 'Test');
    await user.click(screen.getByText('Create Deck'));

    expect(screen.getByText('Create Deck', { selector: 'button' })).toBeDisabled();

    resolveSave();
  });

  it('supports keyboard selection of color', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<DeckModal onClose={vi.fn()} onSave={onSave} />);

    const colorSwatches = screen.getAllByRole('radio');
    colorSwatches[2]!.focus();
    await user.keyboard('{Enter}');

    await user.type(screen.getByPlaceholderText('e.g. Spanish Vocabulary…'), 'Test');
    await user.click(screen.getByText('Create Deck'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#34d399',
      }),
    );
  });
});
