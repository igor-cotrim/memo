import type { Deck } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";

type DeckItemProps = {
  deck: Deck;
  index: number;
  onStudy: (id: string) => void;
  onEdit: (deck: Deck) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
};

export default function DeckItem({
  deck,
  index,
  onStudy,
  onEdit,
  onDelete,
  onClick,
}: DeckItemProps) {
  const { t } = useLocale();

  return (
    <div
      className={`cursor-pointer relative overflow-hidden bg-bg-card border border-border rounded-md p-6 transition-all hover:-translate-y-1 hover:scale-[1.005] hover:shadow-lg hover:border-border-accent active:-translate-y-px active:scale-100 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-(--deck-color,var(--color-accent-primary)) before:rounded-t-md stagger-${Math.min(index + 1, 6)}`}
      style={{ "--deck-color": deck.color } as React.CSSProperties}
      onClick={() => onClick(deck.id)}
      id={`deck-${deck.id}`}
    >
      <div className="font-display text-[1.125rem] font-bold mb-1 tracking-tight truncate">
        {deck.name}
      </div>
      {deck.description && (
        <div className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-2">
          {deck.description}
        </div>
      )}
      <div
        className="flex gap-2 mt-4 pt-4 border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onStudy(deck.id)}
        >
          {t("decks.study")}
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-semibold text-[0.813rem] font-display transition-all whitespace-nowrap tracking-tight bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-45 disabled:cursor-not-allowed"
          onClick={() => onEdit(deck)}
        >
          {t("decks.edit")}
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-semibold text-[0.813rem] font-display transition-all whitespace-nowrap tracking-tight bg-transparent text-accent-danger hover:text-accent-danger/80 hover:bg-white/5 disabled:opacity-45 disabled:cursor-not-allowed"
          onClick={() => onDelete(deck.id)}
        >
          {t("decks.deleteDeck")}
        </button>
      </div>
    </div>
  );
}
