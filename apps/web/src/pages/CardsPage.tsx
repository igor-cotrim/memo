import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import type { Deck, Flashcard } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";
import * as api from "../services/api";
import CardItem from "../components/CardItem";
import CardModal from "../components/CardModal";
import EmptyState from "../components/EmptyState";

export default function CardsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

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

  async function handleSave(form: {
    front: string;
    back: string;
    notes: string;
  }) {
    if (editingCard) {
      await api.updateCard(deckId!, editingCard.id, form);
    } else {
      await api.createCard(deckId!, form);
    }
    setShowModal(false);
    loadData();
  }

  async function handleDelete(cardId: string) {
    if (confirm(t("cards.confirmDelete"))) {
      await api.deleteCard(deckId!, cardId);
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-10 animate-fade-slide-up">
        <div className="w-full">
          <button
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-semibold text-[0.813rem] font-display transition-all whitespace-nowrap tracking-tight bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-45 disabled:cursor-not-allowed mb-2 -ml-3"
            onClick={() => navigate("/decks")}
          >
            {t("cards.backToDecks")}
          </button>
          <h1
            className="font-display text-[1.85rem] font-extrabold tracking-tight text-balance break-words truncate max-w-full"
            style={{ color: deck?.color }}
          >
            {deck?.name}
          </h1>
          <p className="text-text-secondary text-[0.9375rem] mt-1 line-clamp-2">
            {cards.length} {t("cards.cardsCount")}
            {deck?.description ? ` · ${deck.description}` : ""}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-semibold text-sm font-display border border-border bg-bg-card text-text-primary transition-all whitespace-nowrap tracking-tight hover:-translate-y-px hover:bg-bg-card-hover hover:border-border-light disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={() => navigate(`/review/${deckId}`)}
          >
            {t("cards.studyNow")}
          </button>
          <button
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={openCreate}
            id="create-card-btn"
          >
            {t("cards.addCard")}
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon="🃏"
          title={t("cards.noCardsTitle")}
          description={t("cards.noCardsText")}
          action={
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
              onClick={openCreate}
            >
              {t("cards.addACard")}
            </button>
          }
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

      {showModal && (
        <CardModal
          card={editingCard}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
