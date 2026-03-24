import type { ReviewQuality } from "@flashcard-app/shared-types";

export interface SM2Input {
  quality: ReviewQuality;
  repetitions: number;
  easeFactor: number;
  interval: number;
  now?: Date;
  timezoneOffset?: number;
}

export interface SM2Result {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: string;
}

const MIN_EASE_FACTOR = 1.3;

/**
 * SM-2 spaced repetition algorithm.
 *
 * Quality mapping (1–4 → SM-2's 0–5 scale):
 *   1 → 0 (complete blackout)
 *   2 → 2 (recalled with serious difficulty)
 *   3 → 3 (recalled with difficulty)
 *   4 → 5 (perfect recall)
 */
export function calculateSM2(input: SM2Input): SM2Result {
  const {
    quality,
    repetitions,
    easeFactor,
    interval,
    now = new Date(),
    timezoneOffset,
  } = input;

  // Map our 1-4 quality to SM-2's 0-5 scale
  const q = mapQuality(quality);

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  let newRepetitions: number;
  let newInterval: number;

  if (q < 3) {
    // Failed recall — reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful recall
    newRepetitions = repetitions + 1;

    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  // Calculate next review date honoring user timezone boundaries (start of day)
  const current = new Date(now);
  let localDate = new Date(current.getTime());

  if (timezoneOffset !== undefined) {
    // Convert current UTC time to user's local time (timezoneOffset is UTC - Local in minutes)
    localDate = new Date(current.getTime() - timezoneOffset * 60000);
  } else {
    // Fallback: use server's local time offset
    localDate = new Date(
      current.getTime() - current.getTimezoneOffset() * 60000,
    );
  }

  // Add the interval (in days)
  localDate.setUTCDate(localDate.getUTCDate() + newInterval);
  // Set to start of the day
  localDate.setUTCHours(0, 0, 0, 0);

  // Convert back to UTC
  let nextReviewUTC;
  if (timezoneOffset !== undefined) {
    nextReviewUTC = new Date(localDate.getTime() + timezoneOffset * 60000);
  } else {
    nextReviewUTC = new Date(
      localDate.getTime() + current.getTimezoneOffset() * 60000,
    );
  }

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReviewAt: nextReviewUTC.toISOString(),
  };
}

function mapQuality(quality: ReviewQuality): number {
  const mapping: Record<ReviewQuality, number> = {
    1: 0,
    2: 2,
    3: 3,
    4: 5,
  };
  return mapping[quality];
}
