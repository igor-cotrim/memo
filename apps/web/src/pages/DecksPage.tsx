import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import type { Deck } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";
import * as api from "../services/api";
import DeckItem from "../components/DeckItem";
import DeckModal from "../components/DeckModal";
import EmptyState from "../components/EmptyState";

export default function DecksPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      const data = await api.getDecks();
      setDecks(data);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingDeck(null);
    setShowModal(true);
  }

  function openEdit(deck: Deck) {
    setEditingDeck(deck);
    setShowModal(true);
  }

  async function handleSave(form: {
    name: string;
    description: string;
    color: string;
  }) {
    if (editingDeck) {
      await api.updateDeck(editingDeck.id, form);
    } else {
      await api.createDeck(form);
    }
    setShowModal(false);
    loadDecks();
  }

  async function handleDelete(id: string) {
    if (confirm(t("decks.confirmDelete"))) {
      await api.deleteDeck(id);
      loadDecks();
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
      <div className="flex items-center justify-between mb-10 animate-fade-slide-up">
        <div>
          <h1 className="font-display text-[1.85rem] font-extrabold tracking-tight text-balance">
            {t("decks.title")}
          </h1>
          <p className="text-text-secondary text-[0.9375rem] mt-1">
            {t("decks.subtitle")}
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
          onClick={openCreate}
          id="create-deck-btn"
        >
          {t("decks.newDeck")}
        </button>
      </div>

      {decks.length === 0 ? (
        <EmptyState
          icon="📚"
          title={t("decks.noDecksTitle")}
          description={t("decks.noDecksText")}
          action={
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
              onClick={openCreate}
            >
              {t("decks.createDeck")}
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck, i) => (
            <DeckItem
              key={deck.id}
              deck={deck}
              index={i}
              onStudy={(id) => navigate(`/review/${id}`)}
              onEdit={openEdit}
              onDelete={handleDelete}
              onClick={(id) => navigate(`/decks/${id}`)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <DeckModal
          deck={editingDeck}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
