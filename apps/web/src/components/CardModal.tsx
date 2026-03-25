import { useState } from "react";

import type { Flashcard } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";

type CardModalProps = {
  card?: Flashcard | null;
  onClose: () => void;
  onSave: (form: {
    front: string;
    back: string;
    notes: string;
  }) => Promise<void>;
};

export default function CardModal({ card, onClose, onSave }: CardModalProps) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    front: card?.front ?? "",
    back: card?.back ?? "",
    notes: card?.notes ?? "",
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
        aria-labelledby="card-modal-title"
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="font-display text-xl font-bold tracking-tight"
            id="card-modal-title"
          >
            {card ? t("cards.modalTitleEdit") : t("cards.modalTitleNew")}
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
                htmlFor="card-front"
              >
                {t("cards.frontLabel")}
              </label>
              <textarea
                id="card-front"
                className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full min-h-[80px] resize-y"
                placeholder={t("cards.frontPlaceholder")}
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
                {t("cards.backLabel")}
              </label>
              <textarea
                id="card-back"
                className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full min-h-[80px] resize-y"
                placeholder={t("cards.backPlaceholder")}
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
                {t("cards.notesLabel")}
              </label>
              <textarea
                id="card-notes"
                className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full min-h-[80px] resize-y"
                placeholder={t("cards.notesPlaceholder")}
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
              onClick={onClose}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm font-display border-none cursor-pointer transition-all whitespace-nowrap tracking-tight bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow hover:shadow-md active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {card ? t("common.save") : t("cards.addCardSubmit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
