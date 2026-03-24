import type { Deck } from "@flashcard-app/shared-types";

export interface IDeckRepository {
  findById(id: string): Promise<Deck | null>;
  findAllByUserId(userId: string): Promise<Deck[]>;
  create(deck: Deck): Promise<Deck>;
  update(
    id: string,
    data: Partial<Pick<Deck, "name" | "description" | "color">>,
  ): Promise<Deck | null>;
  delete(id: string): Promise<boolean>;
}
