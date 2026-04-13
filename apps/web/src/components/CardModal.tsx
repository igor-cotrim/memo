import { useState } from 'react';

import type { Flashcard } from '@flashcard-app/shared-types';
import { useLocale } from '../hooks/useLocale';
import { useFormValidation } from '../hooks/useFormValidation';
import { Modal, Button, Label, Textarea, FieldError } from './ui';

type CardModalProps = {
  card?: Flashcard | null;
  onClose: () => void;
  onSave: (form: { front: string; back: string; notes: string }) => Promise<void>;
};

export default function CardModal({ card, onClose, onSave }: CardModalProps) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    front: card?.front ?? '',
    back: card?.back ?? '',
    notes: card?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const { errors, validate, clearFieldError } = useFormValidation(
    { front: { required: true }, back: { required: true } },
    t,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate({ front: form.front, back: form.back })) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} ariaLabelledBy="card-modal-title">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold tracking-tight" id="card-modal-title">
          {card ? t('cards.modalTitleEdit') : t('cards.modalTitleNew')}
        </h2>
        <button
          className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-sm bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-front">{t('cards.frontLabel')}</Label>
            <Textarea
              id="card-front"
              placeholder={t('cards.frontPlaceholder')}
              value={form.front}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, front: e.target.value }));
                clearFieldError('front');
              }}
              error={!!errors.front}
              autoFocus
              autoComplete="off"
            />
            <FieldError message={errors.front} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-back">{t('cards.backLabel')}</Label>
            <Textarea
              id="card-back"
              placeholder={t('cards.backPlaceholder')}
              value={form.back}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, back: e.target.value }));
                clearFieldError('back');
              }}
              error={!!errors.back}
              autoComplete="off"
            />
            <FieldError message={errors.back} />
            <p className="text-xs text-text-muted mt-1">{t('cards.codeHint')}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-notes">{t('cards.notesLabel')}</Label>
            <Textarea
              id="card-notes"
              placeholder={t('cards.notesPlaceholder')}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              autoComplete="off"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {card ? t('common.save') : t('cards.addCardSubmit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
