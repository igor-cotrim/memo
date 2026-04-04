import { useState } from 'react';

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (loading) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onCancel} ariaLabelledBy="confirm-dialog-title">
      <h2 className="font-display text-xl font-bold tracking-tight mb-3" id="confirm-dialog-title">
        {title}
      </h2>
      <p className="text-text-secondary text-[0.9375rem] mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export { ConfirmDialog, type ConfirmDialogProps };
