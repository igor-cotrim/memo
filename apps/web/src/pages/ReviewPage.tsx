import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import type { Flashcard, ReviewQuality } from '@flashcard-app/shared-types';
import { useLocale } from '../hooks/useLocale';
import * as api from '../services/api';
import { Button, Spinner } from '../components/ui';
import ReviewCard from '../components/ReviewCard';
import ReviewScoreButtons from '../components/ReviewScoreButtons';
import EmptyState from '../components/EmptyState';

export default function ReviewPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const isAllMode = deckId === 'all';

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [deckNames, setDeckNames] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeQuality, setActiveQuality] = useState<ReviewQuality | null>(null);
  const [totalCards, setTotalCards] = useState(0);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!deckId) return;
    let cancelled = false;
    const fetch = isAllMode ? api.getAllDueCards() : api.getDueCards(deckId);
    fetch
      .then((session) => {
        if (cancelled) return;
        setCards(session.cards);
        setTotalCards(session.totalDue);
        if ('deckNames' in session) setDeckNames(session.deckNames);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deckId, isAllMode]);

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  async function handleRate(quality: ReviewQuality) {
    const card = cards[currentIndex];
    if (!card || submitting) return;

    setSubmitting(true);
    setActiveQuality(quality);
    try {
      await api.submitReview({
        cardId: card.id,
        quality,
        timezoneOffset: new Date().getTimezoneOffset(),
      });
      setCompleted((c) => c + 1);
      setIsFlipped(false);

      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setCurrentIndex(cards.length);
      }
    } finally {
      setSubmitting(false);
      setActiveQuality(null);
    }
  }

  const handleKeyRef = useRef<(e: KeyboardEvent) => void>();

  useEffect(() => {
    handleKeyRef.current = (e: KeyboardEvent) => {
      const currentCard = cards[currentIndex];
      const isComplete = !currentCard || currentIndex >= cards.length;

      if (isComplete && cards.length > 0) {
        if (e.key === 'Enter') {
          e.preventDefault();
          navigate('/');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          navigate('/decks');
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        navigate(isAllMode ? '/decks' : `/decks/${deckId}`);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
        handleRate(parseInt(e.key) as ReviewQuality);
      }
    };
  });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      handleKeyRef.current?.(e);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (loading) {
    return <Spinner />;
  }

  const currentCard = cards[currentIndex];
  const isComplete = !currentCard || currentIndex >= cards.length;
  const currentDeckName = currentCard ? deckNames[currentCard.deckId] : undefined;

  return (
    <div className="flex flex-col flex-1 bg-bg-primary max-w-2xl mx-auto w-full pt-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 self-start"
        onClick={() => navigate(isAllMode ? '/decks' : `/decks/${deckId}`)}
      >
        {isAllMode ? t('review.backToDecks') : t('review.backToDeck')}
      </Button>

      {cards.length === 0 ? (
        <EmptyState
          icon="🎉"
          title={t('review.allCaughtUpTitle')}
          description={t('review.allCaughtUpText')}
          action={
            <Button size="lg" className="w-full md:w-auto" onClick={() => navigate('/decks')}>
              {t('review.backToDecks')}
            </Button>
          }
        />
      ) : isComplete ? (
        <EmptyState
          icon="🏆"
          title={t('review.sessionCompleteTitle')}
          description={`${t('review.youReviewed')} ${completed} ${completed !== 1 ? t('review.cards') : t('review.card')}`}
          action={
            <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
              <div className="flex gap-3 justify-center w-full">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate('/decks')}
                >
                  {t('review.backToDecks')}
                  <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-[0.6rem] font-mono rounded border border-current/20 bg-current/5 opacity-50">
                    Esc
                  </kbd>
                </Button>
                <Button size="lg" className="flex-1" onClick={() => navigate('/')}>
                  {t('layout.dashboard')}
                  <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-[0.6rem] font-mono rounded border border-current/20 bg-current/5 opacity-50">
                    Enter
                  </kbd>
                </Button>
              </div>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-col mt-4 mb-8">
            <div className="flex justify-between text-sm text-text-secondary font-display mb-2">
              <span>
                {t('review.card')} {currentIndex + 1} / {totalCards}
              </span>
              <span>
                {completed} {t('review.reviewed')}
              </span>
            </div>
            <div className="w-full h-1.5 bg-bg-card rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-primary transition-[width] duration-500"
                style={{ width: `${(completed / totalCards) * 100}%` }}
              />
            </div>
          </div>

          {isAllMode && currentDeckName && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-card border border-border text-xs font-display font-semibold text-text-secondary">
                <span aria-hidden="true">📂</span>
                {currentDeckName}
              </span>
            </div>
          )}

          <ReviewCard card={currentCard} isFlipped={isFlipped} onFlip={handleFlip} />

          {isFlipped && (
            <ReviewScoreButtons
              onRate={handleRate}
              disabled={submitting}
              activeQuality={activeQuality}
            />
          )}
        </>
      )}
    </div>
  );
}
