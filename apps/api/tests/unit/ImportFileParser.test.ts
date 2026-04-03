import { describe, it, expect } from "vitest";
import {
  sanitizeField,
  parseJsonDeckImport,
  parseJsonCardsImport,
  parseCsvImport,
} from "../../src/services/ImportFileParser";
import { ValidationError } from "../../src/shared/errors";

describe("ImportFileParser", () => {
  describe("sanitizeField", () => {
    it("strips HTML tags and control characters", () => {
      expect(sanitizeField("<b>hello</b> world")).toBe("hello world");
      expect(sanitizeField("hello\x01 world")).toBe("hello world");
      expect(sanitizeField("  hello  ")).toBe("hello");
    });
  });

  describe("parseJsonDeckImport", () => {
    it("parses valid deck JSON", () => {
      const json = JSON.stringify({
        name: "Test Deck",
        description: "Test Desc",
        cards: [{ front: "A", back: "B", notes: "C" }],
      });
      const result = parseJsonDeckImport(Buffer.from(json));
      expect(result.name).toBe("Test Deck");
      expect(result.description).toBe("Test Desc");
      expect(result.cards).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.cards[0]).toEqual({ front: "A", back: "B", notes: "C" });
    });

    it("throws ValidationError for invalid JSON", () => {
      expect(() => parseJsonDeckImport(Buffer.from("invalid json"))).toThrow(
        ValidationError,
      );
    });

    it("throws ValidationError if missing name", () => {
      const json = JSON.stringify({ cards: [{ front: "A", back: "B" }] });
      expect(() => parseJsonDeckImport(Buffer.from(json))).toThrow(
        /JSON must include a non-empty 'name' field/,
      );
    });

    it("throws ValidationError if missing cards array", () => {
      const json = JSON.stringify({ name: "Deck" });
      expect(() => parseJsonDeckImport(Buffer.from(json))).toThrow(
        /JSON must include a non-empty 'cards' array/,
      );
    });

    it("records errors for invalid card format", () => {
      const json = JSON.stringify({
        name: "Deck",
        cards: [{ front: "A" }, { back: "B" }, "invalid"],
      });
      const result = parseJsonDeckImport(Buffer.from(json));
      expect(result.errors).toHaveLength(3);
    });

    it("throws ValidationError on prototype pollution", () => {
      const json = `{"__proto__": {"polluted": true}, "name": "Deck", "cards": [{"front": "A", "back": "B"}]}`;
      expect(() => parseJsonDeckImport(Buffer.from(json))).toThrow(
        "Invalid JSON file",
      );
    });
  });

  describe("parseJsonCardsImport", () => {
    it("parses valid cards JSON array", () => {
      const json = JSON.stringify([{ front: "A", back: "B" }]);
      const result = parseJsonCardsImport(Buffer.from(json));
      expect(result.cards).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it("throws ValidationError for invalid JSON", () => {
      expect(() => parseJsonCardsImport(Buffer.from("invalid"))).toThrow(
        ValidationError,
      );
    });

    it("throws ValidationError if not an array", () => {
      expect(() => parseJsonCardsImport(Buffer.from("{}"))).toThrow(
        /JSON must be an array/,
      );
    });

    it("throws ValidationError if array is empty", () => {
      expect(() => parseJsonCardsImport(Buffer.from("[]"))).toThrow(
        /JSON array is empty/,
      );
    });
  });

  describe("parseCsvImport", () => {
    it("parses valid CSV", () => {
      const csv = `front,back,notes\nA,B,C\nD,E,`;
      const result = parseCsvImport(Buffer.from(csv));
      expect(result.cards).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.cards[0]).toEqual({ front: "A", back: "B", notes: "C" });
      expect(result.cards[1]?.notes).toBeUndefined(); // Assuming empty yields undefined after trim
    });

    it("throws ValidationError for empty CSV", () => {
      expect(() => parseCsvImport(Buffer.from(""))).toThrow(ValidationError);
    });

    it("throws ValidationError for missing required headers", () => {
      const csv = `col1,col2\nA,B`;
      expect(() => parseCsvImport(Buffer.from(csv))).toThrow(
        /CSV headers must include 'front' and 'back'/,
      );
    });
  });
});
