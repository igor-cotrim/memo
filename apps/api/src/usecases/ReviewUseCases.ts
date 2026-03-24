import { v4 as uuidv4 } from "uuid";

import type {
  Flashcard,
  ReviewResult,
  ReviewSession,
} from "@flashcard-app/shared-types";
import type { ICardRepository } from "../domain/repositories/ICardRepository";
import type { IDeckRepository } from "../domain/repositories/IDeckRepository";
import type { IReviewLogRepository } from "../domain/repositories/IReviewLogRepository";
import { calculateSM2 } from "../domain/sm2";
import { NotFoundError, ForbiddenError } from "../shared/errors";

export class GetDueCardsUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
  ) {}

  async execute(userId: string, deckId: string): Promise<ReviewSession> {
    const deck = await this.deckRepo.findById(deckId);
    if (!deck) throw new NotFoundError("Deck", deckId);
    if (deck.userId !== userId) throw new ForbiddenError();

    const now = new Date().toISOString();
    const dueCards = await this.cardRepo.findDueCards(deckId, now);

    return {
      deckId,
      cards: dueCards,
      totalDue: dueCards.length,
    };
  }
}

export class SubmitReviewUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
    private readonly reviewLogRepo: IReviewLogRepository,
  ) {}

  async execute(userId: string, review: ReviewResult): Promise<Flashcard> {
    const card = await this.cardRepo.findById(review.cardId);
    if (!card) throw new NotFoundError("Card", review.cardId);

    const deck = await this.deckRepo.findById(card.deckId);
    if (!deck || deck.userId !== userId) throw new ForbiddenError();

    const sm2Result = calculateSM2({
      quality: review.quality,
      repetitions: card.repetitions,
      easeFactor: card.easeFactor,
      interval: card.interval,
      timezoneOffset: review.timezoneOffset,
    });

    const updatedCard = await this.cardRepo.update(review.cardId, {
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReviewAt: sm2Result.nextReviewAt,
    });

    if (!updatedCard) throw new NotFoundError("Card", review.cardId);

    // Log the review
    await this.reviewLogRepo.create({
      id: uuidv4(),
      cardId: review.cardId,
      userId,
      quality: review.quality,
      reviewedAt: new Date().toISOString(),
    });

    return updatedCard;
  }
}
