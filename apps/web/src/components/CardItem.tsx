import { memo } from "react";

import type { Flashcard } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";
import { getRelativeTimeString } from "../utils/date";
import { Button } from "./ui";

type CardItemProps = {
  card: Flashcard;
  index: number;
  onEdit: (card: Flashcard) => void;
  onDelete: (id: string) => void;
};

const CardItem = memo(function CardItem({
  card,
  index,
  onEdit,
  onDelete,
}: CardItemProps) {
  const { t, locale } = useLocale();

  return (
    <div
      className={`bg-bg-card border border-border rounded-md p-6 transition-all hover:border-border-light hover:shadow-md stagger-${Math.min(index + 1, 6)} [content-visibility:auto]`}
      id={`card-${card.id}`}
    >
      <div className="flex flex-row items-center justify-between mb-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-display text-[0.7rem] font-semibold tracking-wide bg-accent-primary/10 text-accent-primary">
          {card.reps === 0 ? t("cards.new") : `${t("cards.rep")} ${card.reps}`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0! rounded-full bg-[#ffffff]/10! text-base"
            onClick={() => onEdit(card)}
            aria-label="Edit card"
          >
            ✎
          </Button>
          <Button
            variant="danger-ghost"
            size="sm"
            className="w-9 h-9 p-0! rounded-full bg-[#ffffff]/10! text-base"
            onClick={() => onDelete(card.id)}
            aria-label="Delete card"
          >
            ✕
          </Button>
        </div>
      </div>
      <div className="mb-2">
        <div className="text-sm text-text-muted mb-2">{t("cards.front")}</div>
        <div className="font-bold whitespace-pre-wrap wrap-break-word">
          {card.front}
        </div>
      </div>
      <div>
        <div className="text-sm text-text-muted mb-2">{t("cards.back")}</div>
        <div className="whitespace-pre-wrap wrap-break-word">{card.back}</div>
      </div>
      {card.notes && (
        <div
          className="mt-2 text-sm text-text-muted whitespace-pre-wrap wrap-break-word"
          style={{ fontStyle: "italic" }}
        >
          📝 {card.notes}
        </div>
      )}
      <div className="mt-4 text-sm text-text-muted">
        {t("cards.nextReview")} {getRelativeTimeString(card.due, locale)}
      </div>
    </div>
  );
});

export default CardItem;
