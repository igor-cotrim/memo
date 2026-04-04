import { v4 as uuidv4 } from "uuid";

import type {
  DueCountResponse,
  Flashcard,
  ReviewResult,
  ReviewSession,
} from "@flashcard-app/shared-types";
import type { ICardRepository } from "../domain/repositories/ICardRepository";
import type { IDeckRepository } from "../domain/repositories/IDeckRepository";
import type { IReviewLogRepository } from "../domain/repositories/IReviewLogRepository";
import { calculateFSRS } from "../domain/fsrs";
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

export class GetDueCountUseCase {
  constructor(private readonly cardRepo: ICardRepository) {}

  async execute(userId: string): Promise<DueCountResponse> {
    const now = new Date().toISOString();
    const totalDue = await this.cardRepo.countAllDueByUserId(userId, now);
    return { totalDue };
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

    const fsrsCard = calculateFSRS(
      {
        due: new Date(card.due),
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsedDays,
        scheduled_days: card.scheduledDays,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        learning_steps: 0,
        last_review: card.lastReviewAt
          ? new Date(card.lastReviewAt)
          : undefined,
      },
      review.quality,
      new Date().toISOString(),
    );

    const updatedCard = await this.cardRepo.update(review.cardId, {
      state: fsrsCard.state,
      due: fsrsCard.due.toISOString(),
      stability: fsrsCard.stability,
      difficulty: fsrsCard.difficulty,
      elapsedDays: fsrsCard.elapsed_days,
      scheduledDays: fsrsCard.scheduled_days,
      reps: fsrsCard.reps,
      lapses: fsrsCard.lapses,
      lastReviewAt: fsrsCard.last_review
        ? fsrsCard.last_review.toISOString()
        : new Date().toISOString(),
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
