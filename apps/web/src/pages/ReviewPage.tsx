import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import type { Flashcard, ReviewQuality } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";
import * as api from "../services/api";
import ReviewCard from "../components/ReviewCard";
import ReviewScoreButtons from "../components/ReviewScoreButtons";
import EmptyState from "../components/EmptyState";

export default function ReviewPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalCards, setTotalCards] = useState(0);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!deckId) return;
    loadDueCards();
  }, [deckId]);

  async function loadDueCards() {
    try {
      const session = await api.getDueCards(deckId!);
      setCards(session.cards);
      setTotalCards(session.totalDue);
    } finally {
      setLoading(false);
    }
  }

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  async function handleRate(quality: ReviewQuality) {
    const card = cards[currentIndex];
    if (!card || submitting) return;

    setSubmitting(true);
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
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped && ["1", "2", "3", "4"].includes(e.key)) {
        handleRate(parseInt(e.key) as ReviewQuality);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFlipped, currentIndex, handleFlip]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isComplete = !currentCard || currentIndex >= cards.length;

  return (
    <div className="flex flex-col flex-1 bg-bg-primary max-w-2xl mx-auto w-full pt-8">
      <button
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-semibold text-[0.813rem] font-display transition-all whitespace-nowrap tracking-tight bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-45 disabled:cursor-not-allowed mb-4 self-start"
        onClick={() => navigate(`/decks/${deckId}`)}
      >
        {t("review.backToDeck")}
      </button>

      {cards.length === 0 ? (
        <EmptyState
          icon="🎉"
          title={t("review.allCaughtUpTitle")}
          description={t("review.allCaughtUpText")}
          action={
            <button
              className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 rounded-md font-bold text-base font-display text-bg-primary bg-accent-primary shadow-sm transition-all tracking-tight hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
              onClick={() => navigate("/decks")}
            >
              {t("review.backToDecks")}
            </button>
          }
        />
      ) : isComplete ? (
        <EmptyState
          icon="🏆"
          title={t("review.sessionCompleteTitle")}
          description={`${t("review.youReviewed")} ${completed} ${completed !== 1 ? t("review.cards") : t("review.card")}`}
          action={
            <div className="flex gap-3 justify-center w-full max-w-sm mx-auto">
              <button
                className="inline-flex flex-1 items-center justify-center gap-2 px-8 py-3.5 rounded-md font-semibold text-base font-display border border-border bg-bg-card text-text-primary transition-all whitespace-nowrap tracking-tight hover:-translate-y-px hover:bg-bg-card-hover hover:border-border-light disabled:opacity-45 disabled:cursor-not-allowed"
                onClick={() => navigate("/decks")}
              >
                {t("review.backToDecks")}
              </button>
              <button
                className="inline-flex flex-1 items-center justify-center gap-2 px-8 py-3.5 rounded-md font-bold text-base font-display text-bg-primary bg-accent-primary shadow-sm transition-all tracking-tight hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
                onClick={() => navigate("/")}
              >
                {t("layout.dashboard")}
              </button>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-col mt-4 mb-8">
            <div className="flex justify-between text-sm text-text-secondary font-display mb-2">
              <span>
                {t("review.card")} {currentIndex + 1} / {totalCards}
              </span>
              <span>
                {completed} {t("review.reviewed")}
              </span>
            </div>
            <div className="w-full h-1.5 bg-bg-card rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-primary transition-[width] duration-500"
                style={{ width: `${(completed / totalCards) * 100}%` }}
              />
            </div>
          </div>

          <ReviewCard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />

          {isFlipped && (
            <ReviewScoreButtons onRate={handleRate} disabled={submitting} />
          )}
        </>
      )}
    </div>
  );
}
