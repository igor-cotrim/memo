import type { ImportCardRow } from '@flashcard-app/shared-types';

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export type ParsePreviewResult = {
  cards: ImportCardRow[];
  name?: string;
  description?: string;
  format: 'json' | 'csv';
};

export function parsePreview(file: File): Promise<ParsePreviewResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'json') {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            resolve({ cards: data, format: 'json' });
          } else if (data && typeof data === 'object' && Array.isArray(data.cards)) {
            resolve({
              cards: data.cards,
              name: data.name,
              description: data.description,
              format: 'json',
            });
          } else {
            reject(new Error('Invalid JSON structure'));
          }
        } catch {
          reject(new Error('Invalid JSON'));
        }
      } else {
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        const headers = lines[0]!
          .split(',')
          .map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());
        if (!headers.includes('front') || !headers.includes('back')) {
          reject(new Error("CSV must have 'front' and 'back' columns"));
          return;
        }
        const frontIdx = headers.indexOf('front');
        const backIdx = headers.indexOf('back');
        const notesIdx = headers.indexOf('notes');
        const cards: ImportCardRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]!.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          const front = cols[frontIdx] ?? '';
          const back = cols[backIdx] ?? '';
          if (front && back) {
            cards.push({
              front,
              back,
              notes: (notesIdx >= 0 ? cols[notesIdx] : undefined) || undefined,
            });
          }
        }
        resolve({ cards, format: 'csv' });
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
