import type { Flashcard } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";

type ReviewCardProps = {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
};

export default function ReviewCard({
  card,
  isFlipped,
  onFlip,
}: ReviewCardProps) {
  const { t } = useLocale();

  return (
    <div
      className="perspective-distant w-full aspect-square sm:aspect-3/2 mx-auto cursor-pointer"
      onClick={onFlip}
    >
      <div
        className={`w-full h-full relative transform-3d transition-transform duration-650 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isFlipped ? "transform-[rotateY(180deg)]" : ""}`}
      >
        <div className="absolute inset-0 backface-hidden flex flex-col p-6 sm:p-10 rounded-xl border border-border text-center shadow-lg bg-bg-card overflow-y-auto">
          <div className="w-full shrink-0 flex justify-start">
            <span className="font-display text-[0.7rem] font-semibold text-text-muted uppercase tracking-widest">
              {t("review.front")}
            </span>
          </div>
          <div className="flex-1 flex flex-col w-full py-6">
            <div className="w-full font-display text-xl sm:text-[1.5rem] font-semibold leading-snug tracking-tight text-balance wrap-break-word whitespace-pre-wrap my-auto">
              {card.front}
            </div>
          </div>
          <div className="w-full shrink-0 flex justify-center mt-auto">
            <span className="text-xs text-text-muted">
              {t("review.flipHint")}
            </span>
          </div>
        </div>
        <div className="absolute inset-0 backface-hidden flex flex-col p-6 sm:p-10 rounded-xl border border-border text-center shadow-lg bg-bg-card-hover transform-[rotateY(180deg)] overflow-y-auto">
          <div className="w-full shrink-0 flex justify-start">
            <span className="font-display text-[0.7rem] font-semibold text-text-muted uppercase tracking-widest">
              {t("review.back")}
            </span>
          </div>
          <div className="flex-1 flex flex-col w-full py-6">
            <div className="w-full font-display text-xl sm:text-[1.5rem] font-semibold leading-snug tracking-tight text-balance wrap-break-word whitespace-pre-wrap my-auto">
              {card.back}
            </div>
            {card.notes && (
              <div className="text-xs text-text-secondary wrap-break-word max-w-[80%] mt-6 opacity-80 mx-auto">
                📝 {card.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
