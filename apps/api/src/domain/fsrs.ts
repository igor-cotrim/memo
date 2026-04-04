import { fsrs, Rating, State } from 'ts-fsrs';
import type { Card } from 'ts-fsrs';

import type { ReviewQuality } from '@flashcard-app/shared-types';

const f = fsrs({
  request_retention: 0.9, // 90% target retention
  maximum_interval: 36500,
});

/**
 * Maps our 1-4 quality scale to FSRS Rating.
 * 1: Again (Complete blackout / forgot)
 * 2: Hard (Recalled with serious difficulty)
 * 3: Good (Recalled with difficulty/normal)
 * 4: Easy (Perfect recall)
 */
export function mapQualityToRating(quality: ReviewQuality): Rating {
  const mapping: Record<ReviewQuality, Rating> = {
    1: Rating.Again,
    2: Rating.Hard,
    3: Rating.Good,
    4: Rating.Easy,
  };
  return mapping[quality];
}

export function calculateFSRS(cardState: Card, quality: ReviewQuality, nowStr?: string) {
  const rating = mapQualityToRating(quality);
  const now = nowStr ? new Date(nowStr) : new Date();

  // FSRS returns a Record<Rating, RecordLogItem>. We select the one for our specific rating.
  // The 'next' function calculates the scheduling for the specific rating.
  const result = f.next(cardState, now, rating as number);

  return result.card;
}

export { Rating, State, type Card as FSRSCard };
