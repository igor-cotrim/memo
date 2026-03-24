import type {
  ReviewStats,
  DailyReviewCount,
  DeckAccuracy,
} from "@flashcard-app/shared-types";
import type { IReviewLogRepository } from "../domain/repositories/IReviewLogRepository";
import type { IDeckRepository } from "../domain/repositories/IDeckRepository";

export class GetReviewStatsUseCase {
  constructor(
    private readonly reviewLogRepo: IReviewLogRepository,
    private readonly deckRepo: IDeckRepository,
  ) {}

  async execute(userId: string): Promise<ReviewStats> {
    const now = new Date();

    // Last 365 days
    const yearAgo = new Date(now);
    yearAgo.setDate(yearAgo.getDate() - 365);
    const allLogs = await this.reviewLogRepo.findByUserId(
      userId,
      yearAgo.toISOString(),
    );

    // Daily counts
    const dailyCounts = new Map<string, number>();
    for (const log of allLogs) {
      const date = log.reviewedAt.split("T")[0]!;
      dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
    }

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last365Days: DailyReviewCount[] = [];
    const last30Days: DailyReviewCount[] = [];
    const last7Days: DailyReviewCount[] = [];

    for (const [date, count] of dailyCounts.entries()) {
      last365Days.push({ date, count });
      if (new Date(date) >= thirtyDaysAgo) {
        last30Days.push({ date, count });
      }
      if (new Date(date) >= sevenDaysAgo) {
        last7Days.push({ date, count });
      }
    }

    // Deck accuracies
    const decks = await this.deckRepo.findAllByUserId(userId);
    const deckAccuracies: DeckAccuracy[] = [];

    for (const deck of decks) {
      const deckLogs = await this.reviewLogRepo.findByDeckId(
        deck.id,
        thirtyDaysAgo.toISOString(),
      );
      if (deckLogs.length === 0) continue;

      const correctReviews = deckLogs.filter((l) => l.quality >= 3).length;
      deckAccuracies.push({
        deckId: deck.id,
        deckName: deck.name,
        totalReviews: deckLogs.length,
        correctReviews,
        accuracy: correctReviews / deckLogs.length,
      });
    }

    // Streak
    const reviewDates = await this.reviewLogRepo.getReviewDates(userId);
    const currentStreak = this.calculateStreak(reviewDates, now);

    return {
      last7Days,
      last30Days,
      last365Days,
      deckAccuracies,
      currentStreak,
    };
  }

  private calculateStreak(dates: string[], now: Date): number {
    if (dates.length === 0) return 0;

    const uniqueDates = [...new Set(dates)].sort().reverse();
    const today = now.toISOString().split("T")[0]!;

    let streak = 0;
    const checkDate = new Date(today);

    // Check if started today or yesterday
    if (uniqueDates[0] !== today) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (uniqueDates[0] !== checkDate.toISOString().split("T")[0]) {
        return 0;
      }
    }

    for (const date of uniqueDates) {
      const expected = checkDate.toISOString().split("T")[0];
      if (date === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (date < expected!) {
        break;
      }
    }

    return streak;
  }
}
