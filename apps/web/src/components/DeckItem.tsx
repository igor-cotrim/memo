import { memo } from 'react';

import type { Deck } from '@flashcard-app/shared-types';
import { useLocale } from '../hooks/useLocale';
import { Button } from './ui';

type DeckItemProps = {
  deck: Deck;
  index: number;
  onStudy: (id: string) => void;
  onEdit: (deck: Deck) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
};

const DeckItem = memo(function DeckItem({
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
      className={`deck-card cursor-pointer relative overflow-hidden bg-bg-card border border-border rounded-md p-6 hover:-translate-y-1 hover:scale-[1.005] hover:border-border-accent active:-translate-y-px active:scale-100 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-(--deck-color,var(--color-accent-primary)) before:rounded-t-md stagger-${Math.min(index + 1, 6)} [content-visibility:auto]`}
      style={{ '--deck-color': deck.color } as React.CSSProperties}
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
        <Button variant="ghost" size="sm" onClick={() => onStudy(deck.id)}>
          {t('decks.study')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(deck)}>
          {t('decks.edit')}
        </Button>
        <Button variant="danger-ghost" size="sm" onClick={() => onDelete(deck.id)}>
          {t('decks.deleteDeck')}
        </Button>
      </div>
    </div>
  );
});

export default DeckItem;
