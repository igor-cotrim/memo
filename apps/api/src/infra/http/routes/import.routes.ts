import { Router } from "express";
import type { Response, NextFunction } from "express";
import multer from "multer";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type { AuthRequest } from "../middleware/auth";
import type * as schema from "../../db/schema";
import { ValidationError } from "../../../shared/errors";
import {
  parseJsonDeckImport,
  parseJsonCardsImport,
  parseCsvImport,
  sanitizeField,
} from "../../../services/ImportFileParser";
import { ImportDeckUseCase } from "../../../usecases/ImportDeckUseCase";
import { ImportCardsUseCase } from "../../../usecases/ImportCardsUseCase";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/json",
      "text/csv",
      "text/plain",
      "application/vnd.ms-excel",
    ];
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (allowed.includes(file.mimetype) || ext === "json" || ext === "csv") {
      cb(null, true);
    } else {
      cb(new ValidationError("Only .json and .csv files are accepted"));
    }
  },
});

function getFileFormat(file: Express.Multer.File): "json" | "csv" {
  const ext = file.originalname.split(".").pop()?.toLowerCase();
  if (ext === "json") return "json";
  if (ext === "csv") return "csv";
  if (file.mimetype === "application/json") return "json";
  return "csv";
}

export function createImportRoutes(
  db: PostgresJsDatabase<typeof schema>,
): Router {
  const router = Router();

  const importDeckUseCase = new ImportDeckUseCase(db);
  const importCardsUseCase = new ImportCardsUseCase(db);

  // POST /decks/import - Import a new deck with cards
  router.post(
    "/import",
    upload.single("file"),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          throw new ValidationError("File is required");
        }

        const format = getFileFormat(req.file);
        let name: string;
        let description: string | undefined;
        let cards;
        let errors;

        if (format === "json") {
          const parsed = parseJsonDeckImport(req.file.buffer);
          name = parsed.name;
          description = parsed.description;
          cards = parsed.cards;
          errors = parsed.errors;
        } else {
          // CSV: deck metadata from form fields
          const rawName = req.body?.name;
          const rawDesc = req.body?.description;
          if (!rawName || typeof rawName !== "string" || !rawName.trim()) {
            throw new ValidationError(
              "Deck name is required in form fields for CSV import",
            );
          }
          name = sanitizeField(rawName);
          description = typeof rawDesc === "string" ? sanitizeField(rawDesc) || undefined : undefined;
          if (!name) {
            throw new ValidationError("Deck name is empty after sanitization");
          }
          const parsed = parseCsvImport(req.file.buffer);
          cards = parsed.cards;
          errors = parsed.errors;
        }

        const result = await importDeckUseCase.execute(
          req.userId!,
          { name, description },
          cards,
          errors,
        );

        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /decks/:deckId/cards/import - Import cards into existing deck
  router.post(
    "/:deckId/cards/import",
    upload.single("file"),
    async (
      req: AuthRequest<{ deckId: string }>,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        if (!req.file) {
          throw new ValidationError("File is required");
        }

        const format = getFileFormat(req.file);
        let cards;
        let errors;

        if (format === "json") {
          const parsed = parseJsonCardsImport(req.file.buffer);
          cards = parsed.cards;
          errors = parsed.errors;
        } else {
          const parsed = parseCsvImport(req.file.buffer);
          cards = parsed.cards;
          errors = parsed.errors;
        }

        const result = await importCardsUseCase.execute(
          req.userId!,
          req.params.deckId,
          cards,
          errors,
        );

        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
