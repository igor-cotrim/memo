import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CardModal from '../../src/components/CardModal';
import { renderWithProviders } from '../test-utils';

describe('CardModal', () => {
  it("renders 'New Card' title when no card is provided", () => {
    renderWithProviders(<CardModal onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText('New Card')).toBeInTheDocument();
  });

  it("renders 'Edit Card' title when card is provided", () => {
    const card = {
      id: 'c-1',
      deckId: 'd-1',
      front: 'Hello',
      back: 'World',
      notes: 'note',
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

    renderWithProviders(<CardModal card={card} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText('Edit Card')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    expect(screen.getByDisplayValue('World')).toBeInTheDocument();
    expect(screen.getByDisplayValue('note')).toBeInTheDocument();
  });

  it('calls onSave with form data on submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<CardModal onClose={vi.fn()} onSave={onSave} />);

    // Use label text from locale: "Front (Question)" and "Back (Answer)"
    await user.type(screen.getByLabelText('Front (Question)'), 'Q1');
    await user.type(screen.getByLabelText('Back (Answer)'), 'A1');

    await user.click(screen.getByText('Add Card'));

    expect(onSave).toHaveBeenCalledWith({
      front: 'Q1',
      back: 'A1',
      notes: '',
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<CardModal onClose={onClose} onSave={vi.fn()} />);

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows validation error when front is empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(<CardModal onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText('Back (Answer)'), 'A1');
    await user.click(screen.getByText('Add Card'));

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows validation error when back is empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(<CardModal onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText('Front (Question)'), 'Q1');
    await user.click(screen.getByText('Add Card'));

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('disables submit button while saving', async () => {
    const user = userEvent.setup();
    let resolveSave!: () => void;
    const onSave = vi.fn(() => new Promise<void>((r) => (resolveSave = r)));

    renderWithProviders(<CardModal onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText('Front (Question)'), 'Q1');
    await user.type(screen.getByLabelText('Back (Answer)'), 'A1');
    await user.click(screen.getByText('Add Card'));

    expect(screen.getByText('Add Card', { selector: 'button' })).toBeDisabled();

    resolveSave();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<CardModal onClose={onClose} onSave={vi.fn()} />);

    // Portal renders into document.body
    const backdrop = document.querySelector('.fixed.inset-0')!;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
