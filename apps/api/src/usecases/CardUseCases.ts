import { v4 as uuidv4 } from 'uuid';

import type { Flashcard, CreateCardRequest, UpdateCardRequest } from '@flashcard-app/shared-types';
import type { ICardRepository } from '../domain/repositories/ICardRepository';
import type { IDeckRepository } from '../domain/repositories/IDeckRepository';
import { NotFoundError, ValidationError, ForbiddenError } from '../shared/errors';

export class CreateCardUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
  ) {}

  async execute(userId: string, deckId: string, input: CreateCardRequest): Promise<Flashcard> {
    const deck = await this.deckRepo.findById(deckId);
    if (!deck) throw new NotFoundError('Deck', deckId);
    if (deck.userId !== userId) throw new ForbiddenError();

    if (!input.front || input.front.trim().length === 0) {
      throw new ValidationError('Card front is required');
    }
    if (!input.back || input.back.trim().length === 0) {
      throw new ValidationError('Card back is required');
    }

    const now = new Date().toISOString();
    const card: Flashcard = {
      id: uuidv4(),
      deckId,
      front: input.front.trim(),
      back: input.back.trim(),
      notes: input.notes,
      state: 0,
      due: now,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      lastReviewAt: null,
      createdAt: now,
    };

    return this.cardRepo.create(card);
  }
}

export class ListCardsUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
  ) {}

  async execute(userId: string, deckId: string): Promise<Flashcard[]> {
    const deck = await this.deckRepo.findById(deckId);
    if (!deck) throw new NotFoundError('Deck', deckId);
    if (deck.userId !== userId) throw new ForbiddenError();
    return this.cardRepo.findAllByDeckId(deckId);
  }
}

export class GetCardUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
  ) {}

  async execute(userId: string, cardId: string): Promise<Flashcard> {
    const card = await this.cardRepo.findById(cardId);
    if (!card) throw new NotFoundError('Card', cardId);

    const deck = await this.deckRepo.findById(card.deckId);
    if (!deck || deck.userId !== userId) throw new ForbiddenError();

    return card;
  }
}

export class UpdateCardUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
  ) {}

  async execute(userId: string, cardId: string, input: UpdateCardRequest): Promise<Flashcard> {
    const card = await this.cardRepo.findById(cardId);
    if (!card) throw new NotFoundError('Card', cardId);

    const deck = await this.deckRepo.findById(card.deckId);
    if (!deck || deck.userId !== userId) throw new ForbiddenError();

    const updated = await this.cardRepo.update(cardId, input);
    if (!updated) throw new NotFoundError('Card', cardId);
    return updated;
  }
}

export class DeleteCardUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
  ) {}

  async execute(userId: string, cardId: string): Promise<void> {
    const card = await this.cardRepo.findById(cardId);
    if (!card) throw new NotFoundError('Card', cardId);

    const deck = await this.deckRepo.findById(card.deckId);
    if (!deck || deck.userId !== userId) throw new ForbiddenError();

    await this.cardRepo.delete(cardId);
  }
}
