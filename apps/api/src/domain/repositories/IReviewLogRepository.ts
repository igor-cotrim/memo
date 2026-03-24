export interface ReviewLog {
  id: string;
  cardId: string;
  userId: string;
  quality: number;
  reviewedAt: string;
}

export interface IReviewLogRepository {
  create(log: ReviewLog): Promise<ReviewLog>;
  findByUserId(userId: string, since: string): Promise<ReviewLog[]>;
  findByDeckId(deckId: string, since: string): Promise<ReviewLog[]>;
  getReviewDates(userId: string): Promise<string[]>;
}
