import { useState } from "react";

import type { Deck } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";

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

type DeckModalProps = {
  deck?: Deck | null;
  onClose: () => void;
  onSave: (form: {
    name: string;
    description: string;
    color: string;
  }) => Promise<void>;
};

export default function DeckModal({ deck, onClose, onSave }: DeckModalProps) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: deck?.name ?? "",
    description: deck?.description ?? "",
    color: deck?.color ?? "#e2a83e",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[1000] p-8 animate-fade-in overscroll-contain"
      onClick={onClose}
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
            {deck ? t("decks.modalTitleEdit") : t("decks.modalTitleNew")}
          </h2>
          <button
            className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-sm bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
            onClick={onClose}
            aria-label={t("common.close")}
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
                {t("decks.nameLabel")}
              </label>
              <input
                id="deck-name"
                className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full"
                placeholder={t("decks.namePlaceholder")}
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
                {t("decks.descriptionLabel")}
              </label>
              <textarea
                id="deck-desc"
                className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full min-h-[80px] resize-y"
                placeholder={t("decks.descriptionPlaceholder")}
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
                {t("decks.colorLabel")}
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
              onClick={onClose}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {deck ? t("common.save") : t("decks.createDeckSubmit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
