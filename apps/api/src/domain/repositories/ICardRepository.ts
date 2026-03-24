import type { Flashcard } from "@flashcard-app/shared-types";

export interface ICardRepository {
  findById(id: string): Promise<Flashcard | null>;
  findAllByDeckId(deckId: string): Promise<Flashcard[]>;
  findDueCards(deckId: string, now: string): Promise<Flashcard[]>;
  findAllDueCardsByUserId(userId: string, now: string): Promise<Flashcard[]>;
  create(card: Flashcard): Promise<Flashcard>;
  update(id: string, data: Partial<Flashcard>): Promise<Flashcard | null>;
  delete(id: string): Promise<boolean>;
  countByDeckId(deckId: string): Promise<number>;
}
