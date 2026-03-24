import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import type { Flashcard, ReviewQuality } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";
import * as api from "../services/api";

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

  const qualityOptions: {
    quality: ReviewQuality;
    label: string;
    emoji: string;
  }[] = [
    { quality: 1, label: t("review.qualityBlackout"), emoji: "😵" },
    { quality: 2, label: t("review.qualityHard"), emoji: "😰" },
    { quality: 3, label: t("review.qualityGood"), emoji: "🤔" },
    { quality: 4, label: t("review.qualityEasy"), emoji: "😎" },
  ];

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
        <div className="flex flex-col items-center justify-center flex-1 text-center py-20 px-4 animate-fade-slide-up">
          <div className="text-[4rem] mb-6">🎉</div>
          <h2 className="font-display text-2xl font-bold mb-3 text-text-primary tracking-tight">
            {t("review.allCaughtUpTitle")}
          </h2>
          <p className="text-text-secondary mb-8">
            {t("review.allCaughtUpText")}
          </p>
          <button
            className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 rounded-md font-bold text-base font-display text-bg-primary bg-accent-primary shadow-sm transition-all tracking-tight hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={() => navigate("/decks")}
          >
            {t("review.backToDecks")}
          </button>
        </div>
      ) : isComplete ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-20 px-4 animate-fade-slide-up">
          <div className="text-[4rem] mb-6">🏆</div>
          <h2 className="font-display text-2xl font-bold mb-3 text-text-primary tracking-tight">
            {t("review.sessionCompleteTitle")}
          </h2>
          <p className="text-text-secondary mb-8">
            {t("review.youReviewed")} {completed}{" "}
            {completed !== 1 ? t("review.cards") : t("review.card")}
          </p>
          <div className="flex gap-3 justify-center w-full max-w-sm">
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
        </div>
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

          <div
            className="perspective-[1200px] w-full aspect-[3/2] mx-auto cursor-pointer"
            onClick={handleFlip}
          >
            <div
              className={`w-full h-full relative [transform-style:preserve-3d] transition-transform duration-[650ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
            >
              <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col items-center justify-center p-10 rounded-xl border border-border text-center shadow-lg bg-bg-card">
                <div className="absolute top-4 left-4 font-display text-[0.7rem] font-semibold text-text-muted uppercase tracking-[0.1em]">
                  {t("review.front")}
                </div>
                <div className="font-display text-[1.5rem] font-semibold leading-snug tracking-tight text-balance">
                  {currentCard.front}
                </div>
                <div className="absolute bottom-4 text-xs text-text-muted">
                  {t("review.flipHint")}
                </div>
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col items-center justify-center p-10 rounded-xl border border-border text-center shadow-lg bg-bg-card-hover border-border-accent [transform:rotateY(180deg)]">
                <div className="absolute top-4 left-4 font-display text-[0.7rem] font-semibold text-text-muted uppercase tracking-[0.1em]">
                  {t("review.back")}
                </div>
                <div className="font-display text-[1.5rem] font-semibold leading-snug tracking-tight text-balance">
                  {currentCard.back}
                </div>
                {currentCard.notes && (
                  <div className="absolute bottom-4 text-xs text-text-secondary">
                    📝 {currentCard.notes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isFlipped && (
            <div className="flex gap-4 w-full mt-8 animate-fade-slide-up">
              {qualityOptions.map(({ quality, label, emoji }) => (
                <button
                  key={quality}
                  className={`flex-1 p-4 border rounded-md bg-bg-card text-text-primary font-display cursor-pointer transition-all text-center hover:-translate-y-[3px] hover:shadow-md active:-translate-y-px ${
                    quality === 1
                      ? "border-accent-danger hover:bg-accent-danger/10 text-accent-danger"
                      : quality === 2
                        ? "border-accent-warning hover:bg-accent-warning/10 text-accent-warning"
                        : quality === 3
                          ? "border-accent-secondary hover:bg-accent-secondary/10 text-accent-secondary"
                          : "border-accent-success hover:bg-accent-success/10 text-accent-success"
                  }`}
                  onClick={() => handleRate(quality)}
                  disabled={submitting}
                >
                  <span style={{ fontSize: "1.5rem" }}>{emoji}</span>
                  <span className="block text-xs mt-1 font-medium">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
