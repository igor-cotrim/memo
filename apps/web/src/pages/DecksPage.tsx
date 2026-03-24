import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import type { Deck } from "@flashcard-app/shared-types";
import * as api from "../services/api";

const DECK_COLORS = [
  "#e2a83e",
  "#2dd4bf",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#f472b6",
  "#a78bfa",
  "#38bdf8",
  "#fb923c",
  "#818cf8",
];

export default function DecksPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#e2a83e",
  });

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
    setForm({ name: "", description: "", color: "#e2a83e" });
    setShowModal(true);
  }

  function openEdit(deck: Deck) {
    setEditingDeck(deck);
    setForm({
      name: deck.name,
      description: deck.description ?? "",
      color: deck.color ?? "#e2a83e",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingDeck) {
      await api.updateDeck(editingDeck.id, form);
    } else {
      await api.createDeck(form);
    }
    setShowModal(false);
    loadDecks();
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this deck and all its cards?")) {
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
            My Decks
          </h1>
          <p className="text-text-secondary text-[0.9375rem] mt-1">
            Organize your flashcards into study decks
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
          onClick={openCreate}
          id="create-deck-btn"
        >
          ＋ New Deck
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-20 px-8 text-text-secondary animate-fade-slide-up">
          <div className="text-[3.5rem] mb-4">📚</div>
          <h2 className="font-display text-xl font-bold mb-2 text-text-primary">
            No decks yet
          </h2>
          <p className="mb-6">Create your first deck to start studying</p>
          <button
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={openCreate}
          >
            Create a Deck
          </button>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck, i) => (
            <div
              key={deck.id}
              className={`cursor-pointer relative overflow-hidden bg-bg-card border border-border rounded-md p-6 transition-all hover:-translate-y-1 hover:scale-[1.005] hover:shadow-lg hover:shadow-glow hover:border-border-accent active:-translate-y-px active:scale-100 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-[var(--deck-color,var(--color-accent-primary))] before:rounded-t-md stagger-${Math.min(i + 1, 6)}`}
              style={{ "--deck-color": deck.color } as React.CSSProperties}
              onClick={() => navigate(`/decks/${deck.id}`)}
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
                  onClick={() => navigate(`/review/${deck.id}`)}
                >
                  ▶ Study
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-semibold text-[0.813rem] font-display transition-all whitespace-nowrap tracking-tight bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-45 disabled:cursor-not-allowed"
                  onClick={() => openEdit(deck)}
                >
                  ✎ Edit
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-semibold text-[0.813rem] font-display transition-all whitespace-nowrap tracking-tight bg-transparent text-accent-danger hover:text-accent-danger/80 hover:bg-white/5 disabled:opacity-45 disabled:cursor-not-allowed"
                  onClick={() => handleDelete(deck.id)}
                >
                  ✕ Delete
                </button>
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
            aria-labelledby="deck-modal-title"
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="font-display text-xl font-bold tracking-tight"
                id="deck-modal-title"
              >
                {editingDeck ? "Edit Deck" : "New Deck"}
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
                    htmlFor="deck-name"
                  >
                    Name
                  </label>
                  <input
                    id="deck-name"
                    className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full"
                    placeholder="e.g. Spanish Vocabulary…"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-display text-xs font-semibold text-text-secondary uppercase tracking-widest"
                    htmlFor="deck-desc"
                  >
                    Description
                  </label>
                  <textarea
                    id="deck-desc"
                    className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full min-h-[80px] resize-y"
                    placeholder="What will you study?"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-semibold text-text-secondary uppercase tracking-widest">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DECK_COLORS.map((color) => (
                      <div
                        key={color}
                        className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary ${form.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-bg-secondary" : ""}`}
                        style={{ background: color }}
                        onClick={() => setForm((prev) => ({ ...prev, color }))}
                        role="radio"
                        aria-checked={form.color === color}
                        aria-label={`Color ${color}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setForm((prev) => ({ ...prev, color }));
                          }
                        }}
                      />
                    ))}
                  </div>
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
                  {editingDeck ? "Save Changes" : "Create Deck"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
