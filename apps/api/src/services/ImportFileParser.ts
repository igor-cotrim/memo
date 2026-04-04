import Papa from 'papaparse';

import type { ImportCardRow, ImportRowError } from '@flashcard-app/shared-types';
import { ValidationError } from '../shared/errors';

function safeJsonParse(text: string): unknown {
  const data = JSON.parse(text);
  if (typeof data === 'object' && data !== null) {
    const str = JSON.stringify(data);
    if (
      str.includes('"__proto__"') ||
      str.includes('"constructor"') ||
      str.includes('"prototype"')
    ) {
      throw new Error('Forbidden keys in JSON');
    }
  }
  return data;
}

const MAX_CARDS = 5000;
const MAX_FIELD_LENGTH = 5000;

interface ParsedDeckImport {
  name: string;
  description?: string;
  cards: ImportCardRow[];
  errors: ImportRowError[];
}

interface ParsedCardsImport {
  cards: ImportCardRow[];
  errors: ImportRowError[];
}

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

function stripControlChars(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export function sanitizeField(str: string): string {
  let cleaned = stripControlChars(str);
  cleaned = stripHtmlTags(cleaned);
  return cleaned.trim();
}

function validateCardRows(rawCards: unknown[]): {
  cards: ImportCardRow[];
  errors: ImportRowError[];
} {
  if (rawCards.length > MAX_CARDS) {
    throw new ValidationError(`Too many cards. Maximum is ${MAX_CARDS}`);
  }

  const cards: ImportCardRow[] = [];
  const errors: ImportRowError[] = [];

  for (let i = 0; i < rawCards.length; i++) {
    const row = rawCards[i] as Record<string, unknown>;
    const rowNum = i + 1;

    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      errors.push({ row: rowNum, message: 'Invalid row format' });
      continue;
    }

    const front = typeof row.front === 'string' ? sanitizeField(row.front) : '';
    const back = typeof row.back === 'string' ? sanitizeField(row.back) : '';
    const notes = typeof row.notes === 'string' ? sanitizeField(row.notes) : undefined;

    if (!front) {
      errors.push({ row: rowNum, message: "Missing 'front' field" });
      continue;
    }
    if (!back) {
      errors.push({ row: rowNum, message: "Missing 'back' field" });
      continue;
    }
    if (front.length > MAX_FIELD_LENGTH || back.length > MAX_FIELD_LENGTH) {
      errors.push({
        row: rowNum,
        message: `Field exceeds max length of ${MAX_FIELD_LENGTH} characters`,
      });
      continue;
    }
    if (notes && notes.length > MAX_FIELD_LENGTH) {
      errors.push({
        row: rowNum,
        message: `Notes field exceeds max length of ${MAX_FIELD_LENGTH} characters`,
      });
      continue;
    }

    cards.push({ front, back, notes: notes || undefined });
  }

  return { cards, errors };
}

export function parseJsonDeckImport(buffer: Buffer): ParsedDeckImport {
  let data: unknown;
  try {
    data = safeJsonParse(buffer.toString('utf-8'));
  } catch {
    throw new ValidationError('Invalid JSON file');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError("JSON must be an object with 'name' and 'cards' fields");
  }

  const obj = data as Record<string, unknown>;

  if (!obj.name || typeof obj.name !== 'string' || !obj.name.trim()) {
    throw new ValidationError("JSON must include a non-empty 'name' field");
  }

  if (!Array.isArray(obj.cards) || obj.cards.length === 0) {
    throw new ValidationError("JSON must include a non-empty 'cards' array");
  }

  const { cards, errors } = validateCardRows(obj.cards);

  const name = sanitizeField(obj.name);
  const description =
    typeof obj.description === 'string' ? sanitizeField(obj.description) || undefined : undefined;

  if (!name) {
    throw new ValidationError('Deck name is empty after sanitization');
  }
  if (name.length > 200) {
    throw new ValidationError('Deck name exceeds 200 characters');
  }
  if (description && description.length > 1000) {
    throw new ValidationError('Deck description exceeds 1000 characters');
  }

  return { name, description, cards, errors };
}

export function parseJsonCardsImport(buffer: Buffer): ParsedCardsImport {
  let data: unknown;
  try {
    data = safeJsonParse(buffer.toString('utf-8'));
  } catch {
    throw new ValidationError('Invalid JSON file');
  }

  if (!Array.isArray(data)) {
    throw new ValidationError(
      "JSON must be an array of card objects with 'front' and 'back' fields",
    );
  }

  if (data.length === 0) {
    throw new ValidationError('JSON array is empty');
  }

  return validateCardRows(data);
}

export function parseCsvImport(buffer: Buffer): ParsedCardsImport {
  const result = Papa.parse<Record<string, string>>(buffer.toString('utf-8'), {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new ValidationError(`CSV parse error: ${result.errors[0]?.message ?? 'Unknown error'}`);
  }

  if (result.data.length === 0) {
    throw new ValidationError('CSV file has no data rows');
  }

  const headers = result.meta.fields ?? [];
  if (!headers.includes('front') || !headers.includes('back')) {
    throw new ValidationError(
      `CSV headers must include 'front' and 'back' columns. Found: ${headers.join(', ')}`,
    );
  }

  return validateCardRows(result.data);
}
