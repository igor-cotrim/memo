import { useState, useRef, useCallback } from "react";

import type { ImportCardRow, ImportRowError } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";
import * as api from "../services/api";
import { Modal, Button, Label, Alert } from "./ui";

const PREVIEW_LIMIT = 5;

const JSON_EXAMPLE = `[
  { "front": "Hola", "back": "Hello", "notes": "Greeting" },
  { "front": "Adiós", "back": "Goodbye" }
]`;

const CSV_EXAMPLE = `front,back,notes
"Hola","Hello","Greeting"
"Adiós","Goodbye",`;

type ImportCardsModalProps = {
  deckId: string;
  onClose: () => void;
  onSuccess: () => void;
};

function parsePreview(file: File): Promise<ImportCardRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "json") {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            resolve(data);
          } else {
            reject(new Error("JSON must be an array"));
          }
        } catch {
          reject(new Error("Invalid JSON"));
        }
      } else {
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length === 0) {
          reject(new Error("CSV file is empty"));
          return;
        }
        const headers = lines[0]!.split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
        if (!headers.includes("front") || !headers.includes("back")) {
          reject(new Error("CSV must have 'front' and 'back' columns"));
          return;
        }
        const frontIdx = headers.indexOf("front");
        const backIdx = headers.indexOf("back");
        const notesIdx = headers.indexOf("notes");
        const cards: ImportCardRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]!.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
          const front = cols[frontIdx] ?? "";
          const back = cols[backIdx] ?? "";
          if (front && back) {
            cards.push({ front, back, notes: (notesIdx >= 0 ? cols[notesIdx] : undefined) || undefined });
          }
        }
        resolve(cards);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export default function ImportCardsModal({
  deckId,
  onClose,
  onSuccess,
}: ImportCardsModalProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewCards, setPreviewCards] = useState<ImportCardRow[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [showExample, setShowExample] = useState(true);
  const [exampleTab, setExampleTab] = useState<"json" | "csv">("json");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<ImportRowError[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFile = useCallback(
    async (f: File) => {
      setError(null);
      setRowErrors([]);
      setSuccess(null);

      const ext = f.name.split(".").pop()?.toLowerCase();
      if (ext !== "json" && ext !== "csv") {
        setError(t("cards.importErrorFormat"));
        return;
      }
      if (f.size > 2 * 1024 * 1024) {
        setError("File too large (max 2MB)");
        return;
      }

      try {
        const cards = await parsePreview(f);
        setFile(f);
        setTotalCards(cards.length);
        setPreviewCards(cards.slice(0, PREVIEW_LIMIT));
        setShowExample(false);
      } catch {
        setError(t("cards.importErrorParse"));
      }
    },
    [t],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t("cards.importErrorFile"));
      return;
    }

    setLoading(true);
    setError(null);
    setRowErrors([]);
    setSuccess(null);

    try {
      const result = await api.importCards(deckId, file);
      if (result.errors.length > 0) {
        setRowErrors(result.errors);
      }
      setSuccess(
        t("cards.importSuccess").replace("{count}", String(result.cardsCreated)),
      );
      setTimeout(() => onSuccess(), 1000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? t("cards.importErrorParse");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} ariaLabelledBy="import-cards-modal-title">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="font-display text-xl font-bold tracking-tight"
          id="import-cards-modal-title"
        >
          {t("cards.importModalTitle")}
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
          {/* Format example */}
          {showExample && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>{t("cards.importExampleTitle")}</Label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${exampleTab === "json" ? "bg-accent-primary/20 text-accent-primary font-medium" : "text-text-secondary hover:text-text-primary"}`}
                    onClick={() => setExampleTab("json")}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${exampleTab === "csv" ? "bg-accent-primary/20 text-accent-primary font-medium" : "text-text-secondary hover:text-text-primary"}`}
                    onClick={() => setExampleTab("csv")}
                  >
                    CSV
                  </button>
                </div>
              </div>
              <pre className="bg-bg-primary/50 border border-border rounded-lg p-3 text-xs text-text-secondary overflow-x-auto whitespace-pre font-mono">
                {exampleTab === "json" ? JSON_EXAMPLE : CSV_EXAMPLE}
              </pre>
            </div>
          )}

          {/* File drop zone */}
          <div className="flex flex-col gap-1.5">
            <Label>{t("cards.importFileLabel")}</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {file ? (
                <p className="text-text-primary text-sm font-medium">
                  {file.name}{" "}
                  <span className="text-text-secondary">
                    ({totalCards} cards)
                  </span>
                </p>
              ) : (
                <p className="text-text-secondary text-sm">
                  {t("cards.importDropHint")}
                </p>
              )}
            </div>
            <p className="text-text-secondary text-xs">
              {t("cards.importFileHint")}
            </p>
          </div>

          {/* Preview */}
          {previewCards.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>{t("cards.importPreviewTitle")}</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-primary/50">
                      <th className="text-left px-3 py-2 font-medium text-text-secondary">
                        {t("cards.front")}
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-text-secondary">
                        {t("cards.back")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewCards.map((card, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 text-text-primary truncate max-w-[200px]">
                          {card.front}
                        </td>
                        <td className="px-3 py-2 text-text-primary truncate max-w-[200px]">
                          {card.back}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalCards > PREVIEW_LIMIT && (
                <p className="text-text-secondary text-xs text-center">
                  {t("cards.importPreviewShowing")
                    .replace("{shown}", String(PREVIEW_LIMIT))
                    .replace("{total}", String(totalCards))}
                </p>
              )}
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {rowErrors.length > 0 && (
            <Alert variant="danger">
              <p className="mb-1">{t("cards.importRowErrors")}</p>
              <ul className="list-disc list-inside text-xs">
                {rowErrors.slice(0, 5).map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
                {rowErrors.length > 5 && (
                  <li>...and {rowErrors.length - 5} more</li>
                )}
              </ul>
            </Alert>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={loading || !file}>
            {loading ? t("cards.importImporting") : t("cards.importSubmit")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
