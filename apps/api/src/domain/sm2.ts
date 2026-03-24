import type { ReviewQuality } from "@flashcard-app/shared-types";

export interface SM2Input {
  quality: ReviewQuality;
  repetitions: number;
  easeFactor: number;
  interval: number;
  now?: Date;
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

  // Calculate next review date
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReviewAt: nextReview.toISOString(),
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
