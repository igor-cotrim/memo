import type {
  ReviewStats,
  DailyReviewCount,
  DeckAccuracy,
} from "@flashcard-app/shared-types";
import type { IReviewLogRepository } from "../domain/repositories/IReviewLogRepository";
import type { IDeckRepository } from "../domain/repositories/IDeckRepository";

/**
 * Converts a UTC ISO string to the user's local YYYY-MM-DD date string.
 * timezoneOffset is in minutes (same as Date.getTimezoneOffset()),
 * e.g. -180 for UTC+3, 180 for UTC-3 (BRT).
 */
function toLocalDateString(utcIso: string, timezoneOffset: number): string {
  const date = new Date(utcIso);
  // getTimezoneOffset() returns minutes to ADD to get UTC.
  // So to get local time from UTC, we SUBTRACT the offset.
  const localMs = date.getTime() - timezoneOffset * 60 * 1000;
  const local = new Date(localMs);
  return local.toISOString().split("T")[0]!;
}

export class GetReviewStatsUseCase {
  constructor(
    private readonly reviewLogRepo: IReviewLogRepository,
    private readonly deckRepo: IDeckRepository,
  ) {}

  async execute(
    userId: string,
    timezoneOffset: number = 0,
  ): Promise<ReviewStats> {
    const now = new Date();

    // Last 365 days
    const yearAgo = new Date(now);
    yearAgo.setDate(yearAgo.getDate() - 365);
    const allLogs = await this.reviewLogRepo.findByUserId(
      userId,
      yearAgo.toISOString(),
    );

    // Daily counts — group by user's local date
    const dailyCounts = new Map<string, number>();
    for (const log of allLogs) {
      const date = toLocalDateString(log.reviewedAt, timezoneOffset);
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

    // Streak — also using user's local dates
    const reviewDates = await this.reviewLogRepo.getReviewDates(
      userId,
      timezoneOffset,
    );
    const currentStreak = this.calculateStreak(reviewDates, now, timezoneOffset);

    return {
      last7Days,
      last30Days,
      last365Days,
      deckAccuracies,
      currentStreak,
    };
  }

  private calculateStreak(
    dates: string[],
    now: Date,
    timezoneOffset: number,
  ): number {
    if (dates.length === 0) return 0;

    const uniqueDates = [...new Set(dates)].sort().reverse();
    const today = toLocalDateString(now.toISOString(), timezoneOffset);

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
