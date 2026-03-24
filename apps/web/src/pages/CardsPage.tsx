import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import type { Deck, Flashcard } from "@flashcard-app/shared-types";
import * as api from "../services/api";

export default function CardsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [form, setForm] = useState({ front: "", back: "", notes: "" });

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
    setForm({ front: "", back: "", notes: "" });
    setShowModal(true);
  }

  function openEdit(card: Flashcard) {
    setEditingCard(card);
    setForm({ front: card.front, back: card.back, notes: card.notes ?? "" });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingCard) {
      await api.updateCard(deckId!, editingCard.id, form);
    } else {
      await api.createCard(deckId!, form);
    }
    setShowModal(false);
    loadData();
  }

  async function handleDelete(cardId: string) {
    if (confirm("Delete this card?")) {
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
      <div className="flex items-center justify-between mb-10 animate-fade-slide-up">
        <div>
          <button
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-semibold text-[0.813rem] font-display transition-all whitespace-nowrap tracking-tight bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-45 disabled:cursor-not-allowed mb-2"
            onClick={() => navigate("/decks")}
          >
            ← Back to Decks
          </button>
          <h1
            className="font-display text-[1.85rem] font-extrabold tracking-tight text-balance"
            style={{ color: deck?.color }}
          >
            {deck?.name}
          </h1>
          <p className="text-text-secondary text-[0.9375rem] mt-1">
            {cards.length} cards
            {deck?.description ? ` · ${deck.description}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-semibold text-sm font-display border border-border bg-bg-card text-text-primary transition-all whitespace-nowrap tracking-tight hover:-translate-y-px hover:bg-bg-card-hover hover:border-border-light disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={() => navigate(`/review/${deckId}`)}
          >
            ▶ Study Now
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={openCreate}
            id="create-card-btn"
          >
            ＋ Add Card
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-20 px-8 text-text-secondary animate-fade-slide-up">
          <div className="text-[3.5rem] mb-4">🃏</div>
          <h2 className="font-display text-xl font-bold mb-2 text-text-primary">
            No cards yet
          </h2>
          <p className="mb-6">Add your first flashcard to start studying</p>
          <button
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={openCreate}
          >
            Add a Card
          </button>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          {cards.map((card, i) => (
            <div
              key={card.id}
              className={`bg-bg-card border border-border rounded-md p-6 transition-all hover:border-border-light hover:shadow-md stagger-${Math.min(i + 1, 6)}`}
              id={`card-${card.id}`}
            >
              <div className="flex flex-row items-center justify-between mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full font-display text-[0.7rem] font-semibold tracking-wide bg-accent-primary/10 text-accent-primary">
                  {card.repetitions === 0 ? "New" : `Rep ${card.repetitions}`}
                </span>
                <div className="flex gap-1">
                  <button
                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-semibold text-[0.813rem] font-display transition-all whitespace-nowrap tracking-tight bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-45 disabled:cursor-not-allowed"
                    onClick={() => openEdit(card)}
                    aria-label="Edit card"
                  >
                    ✎
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-semibold text-[0.813rem] font-display transition-all whitespace-nowrap tracking-tight bg-transparent text-accent-danger hover:text-accent-danger/80 hover:bg-white/5 disabled:opacity-45 disabled:cursor-not-allowed"
                    onClick={() => handleDelete(card.id)}
                    aria-label="Delete card"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mb-2">
                <div className="text-sm text-muted mb-2">Front</div>
                <div className="font-bold">{card.front}</div>
              </div>
              <div>
                <div className="text-sm text-muted mb-2">Back</div>
                <div>{card.back}</div>
              </div>
              {card.notes && (
                <div
                  className="mt-2 text-sm text-muted"
                  style={{ fontStyle: "italic" }}
                >
                  📝 {card.notes}
                </div>
              )}
              <div className="mt-4 text-sm text-muted">
                Next review: {new Date(card.nextReviewAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[1000] p-8 animate-fade-in overscroll-contain"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-bg-secondary border border-border rounded-lg w-full max-w-[500px] p-8 shadow-lg animate-modal-slide-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-modal-title"
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="font-display text-xl font-bold tracking-tight"
                id="card-modal-title"
              >
                {editingCard ? "Edit Card" : "New Card"}
              </h2>
              <button
                className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-sm bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-display text-xs font-semibold text-text-secondary uppercase tracking-widest"
                    htmlFor="card-front"
                  >
                    Front (Question)
                  </label>
                  <textarea
                    id="card-front"
                    className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full min-h-[80px] resize-y"
                    placeholder="What do you want to remember?…"
                    value={form.front}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, front: e.target.value }))
                    }
                    required
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-display text-xs font-semibold text-text-secondary uppercase tracking-widest"
                    htmlFor="card-back"
                  >
                    Back (Answer)
                  </label>
                  <textarea
                    id="card-back"
                    className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full min-h-[80px] resize-y"
                    placeholder="The answer…"
                    value={form.back}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, back: e.target.value }))
                    }
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-display text-xs font-semibold text-text-secondary uppercase tracking-widest"
                    htmlFor="card-notes"
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="card-notes"
                    className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full min-h-[80px] resize-y"
                    placeholder="Extra notes, mnemonics, etc.…"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-semibold text-sm font-display border border-border bg-bg-card text-text-primary transition-all whitespace-nowrap tracking-tight hover:-translate-y-px hover:bg-bg-card-hover hover:border-border-light disabled:opacity-45 disabled:cursor-not-allowed"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {editingCard ? "Save Changes" : "Add Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
