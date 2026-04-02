import { useState } from "react";

import type { Deck } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";
import { Modal, Button, Input, Label, Textarea } from "./ui";

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
    <Modal onClose={onClose} ariaLabelledBy="deck-modal-title">
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
            <Label htmlFor="deck-name">{t("decks.nameLabel")}</Label>
            <Input
              id="deck-name"
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
            <Label htmlFor="deck-desc">{t("decks.descriptionLabel")}</Label>
            <Textarea
              id="deck-desc"
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
            <Label>{t("decks.colorLabel")}</Label>
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
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit">
            {deck ? t("common.save") : t("decks.createDeckSubmit")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
