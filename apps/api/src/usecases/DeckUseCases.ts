import { v4 as uuidv4 } from 'uuid';

import type { Deck, CreateDeckRequest, UpdateDeckRequest } from '@flashcard-app/shared-types';
import type { IDeckRepository } from '../domain/repositories/IDeckRepository';
import { NotFoundError, ValidationError, ForbiddenError } from '../shared/errors';

export class CreateDeckUseCase {
  constructor(private readonly deckRepo: IDeckRepository) {}

  async execute(userId: string, input: CreateDeckRequest): Promise<Deck> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Deck name is required');
    }

    const deck: Deck = {
      id: uuidv4(),
      userId,
      name: input.name.trim(),
      description: input.description,
      color: input.color,
      createdAt: new Date().toISOString(),
    };

    return this.deckRepo.create(deck);
  }
}

export class ListDecksUseCase {
  constructor(private readonly deckRepo: IDeckRepository) {}

  async execute(userId: string): Promise<Deck[]> {
    return this.deckRepo.findAllByUserId(userId);
  }
}

export class GetDeckUseCase {
  constructor(private readonly deckRepo: IDeckRepository) {}

  async execute(userId: string, deckId: string): Promise<Deck> {
    const deck = await this.deckRepo.findById(deckId);
    if (!deck) throw new NotFoundError('Deck', deckId);
    if (deck.userId !== userId) throw new ForbiddenError();
    return deck;
  }
}

export class UpdateDeckUseCase {
  constructor(private readonly deckRepo: IDeckRepository) {}

  async execute(userId: string, deckId: string, input: UpdateDeckRequest): Promise<Deck> {
    const deck = await this.deckRepo.findById(deckId);
    if (!deck) throw new NotFoundError('Deck', deckId);
    if (deck.userId !== userId) throw new ForbiddenError();

    const updated = await this.deckRepo.update(deckId, input);
    if (!updated) throw new NotFoundError('Deck', deckId);
    return updated;
  }
}

export class DeleteDeckUseCase {
  constructor(private readonly deckRepo: IDeckRepository) {}

  async execute(userId: string, deckId: string): Promise<void> {
    const deck = await this.deckRepo.findById(deckId);
    if (!deck) throw new NotFoundError('Deck', deckId);
    if (deck.userId !== userId) throw new ForbiddenError();
    await this.deckRepo.delete(deckId);
  }
}
