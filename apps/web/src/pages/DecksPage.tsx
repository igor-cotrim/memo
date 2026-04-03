import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import type { Deck } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";
import * as api from "../services/api";
import { Button, PageHeader, Spinner } from "../components/ui";
import DeckItem from "../components/DeckItem";
import DeckModal from "../components/DeckModal";
import ImportDeckModal from "../components/ImportDeckModal";
import EmptyState from "../components/EmptyState";

export default function DecksPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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
      setShowModal(false);
      loadDecks();
    } else {
      const newDeck = await api.createDeck(form);
      setShowModal(false);
      navigate(`/decks/${newDeck.id}`);
    }
  }

  async function handleDelete(id: string) {
    if (confirm(t("decks.confirmDelete"))) {
      await api.deleteDeck(id);
      loadDecks();
    }
  }

  const handleStudy = useCallback(
    (id: string) => navigate(`/review/${id}`),
    [navigate],
  );

  const handleClick = useCallback(
    (id: string) => navigate(`/decks/${id}`),
    [navigate],
  );

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <PageHeader
        title={t("decks.title")}
        subtitle={t("decks.subtitle")}
        action={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setShowImportModal(true)}
            >
              {t("decks.importDeck")}
            </Button>
            <Button className="w-full sm:w-auto" onClick={openCreate} id="create-deck-btn">
              {t("decks.newDeck")}
            </Button>
          </div>
        }
      />

      {decks.length === 0 ? (
        <EmptyState
          icon="📚"
          title={t("decks.noDecksTitle")}
          description={t("decks.noDecksText")}
          action={<Button onClick={openCreate}>{t("decks.createDeck")}</Button>}
        />
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck, i) => (
            <DeckItem
              key={deck.id}
              deck={deck}
              index={i}
              onStudy={handleStudy}
              onEdit={openEdit}
              onDelete={handleDelete}
              onClick={handleClick}
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

      {showImportModal && (
        <ImportDeckModal
          onClose={() => setShowImportModal(false)}
          onSuccess={(deck) => {
            setShowImportModal(false);
            navigate(`/decks/${deck.id}`);
          }}
        />
      )}
    </div>
  );
}
