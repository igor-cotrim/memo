import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import type { Deck, Flashcard } from '@flashcard-app/shared-types';
import { useLocale } from '../hooks/useLocale';
import * as api from '../services/api';
import { Button, Spinner, ConfirmDialog } from '../components/ui';
import CardItem from '../components/CardItem';
import CardModal from '../components/CardModal';
import ImportCardsModal from '../components/ImportCardsModal';
import EmptyState from '../components/EmptyState';

export default function CardsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) return;
    loadData();
  }, [deckId]);

  async function loadData() {
    try {
      const [deckData, cardsData] = await Promise.all([
        api.getDeck(deckId!),
        api.getCards(deckId!),
      ]);
      setDeck(deckData);
      setCards(cardsData);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingCard(null);
    setShowModal(true);
  }

  function openEdit(card: Flashcard) {
    setEditingCard(card);
    setShowModal(true);
  }

  async function handleSave(form: { front: string; back: string; notes: string }) {
    if (editingCard) {
      await api.updateCard(deckId!, editingCard.id, form);
    } else {
      await api.createCard(deckId!, form);
    }
    setShowModal(false);
    loadData();
  }

  function handleDelete(cardId: string) {
    setDeletingCardId(cardId);
  }

  async function confirmDelete() {
    if (deletingCardId) {
      await api.deleteCard(deckId!, deletingCardId);
      setDeletingCardId(null);
      loadData();
    }
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-10 animate-fade-slide-up">
        <div className="w-full">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-3"
            onClick={() => navigate('/decks')}
          >
            {t('cards.backToDecks')}
          </Button>
          <h1
            className="font-display text-[1.85rem] font-extrabold tracking-tight text-balance wrap-break-word truncate max-w-full"
            style={{ color: deck?.color }}
          >
            {deck?.name}
          </h1>
          <p className="text-text-secondary text-[0.9375rem] mt-1 line-clamp-2">
            {cards.length} {t('cards.cardsCount')}
            {deck?.description ? ` · ${deck.description}` : ''}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => navigate(`/review/${deckId}`)}
          >
            {t('cards.studyNow')}
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setShowImportModal(true)}
          >
            {t('cards.importCards')}
          </Button>
          <Button className="w-full sm:w-auto" onClick={openCreate} id="create-card-btn">
            {t('cards.addCard')}
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon="🃏"
          title={t('cards.noCardsTitle')}
          description={t('cards.noCardsText')}
          action={<Button onClick={openCreate}>{t('cards.addACard')}</Button>}
        />
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          {cards.map((card, i) => (
            <CardItem
              key={card.id}
              card={card}
              index={i}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {deletingCardId && (
        <ConfirmDialog
          title={t('common.delete')}
          message={t('cards.confirmDelete')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingCardId(null)}
        />
      )}

      {showModal && (
        <CardModal card={editingCard} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}

      {showImportModal && deckId && (
        <ImportCardsModal
          deckId={deckId}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
