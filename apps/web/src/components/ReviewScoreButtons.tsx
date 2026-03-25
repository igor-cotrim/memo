import type { ReviewQuality } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";

type ReviewScoreButtonsProps = {
  onRate: (quality: ReviewQuality) => void;
  disabled: boolean;
};

export default function ReviewScoreButtons({
  onRate,
  disabled,
}: ReviewScoreButtonsProps) {
  const { t } = useLocale();

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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-6 sm:mt-8 animate-fade-slide-up px-2 sm:px-0">
      {qualityOptions.map(({ quality, label, emoji }) => (
        <button
          key={quality}
          className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-md bg-bg-card text-text-primary font-display cursor-pointer transition-all text-center hover:-translate-y-[3px] hover:shadow-md active:-translate-y-px ${
            quality === 1
              ? "border-accent-danger hover:bg-accent-danger/10 text-accent-danger"
              : quality === 2
                ? "border-accent-warning hover:bg-accent-warning/10 text-accent-warning"
                : quality === 3
                  ? "border-accent-secondary hover:bg-accent-secondary/10 text-accent-secondary"
                  : "border-accent-success hover:bg-accent-success/10 text-accent-success"
          }`}
          onClick={() => onRate(quality)}
          disabled={disabled}
        >
          <span style={{ fontSize: "1.5rem" }}>{emoji}</span>
          <span className="block text-xs mt-1 font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
