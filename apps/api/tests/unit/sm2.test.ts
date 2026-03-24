import { describe, it, expect } from "vitest";

import { calculateSM2 } from "../../src/domain/sm2";

describe("SM-2 Algorithm", () => {
  const fixedNow = new Date("2024-01-15T10:00:00Z");

  describe("when quality < 3 (failed recall)", () => {
    it("should reset repetitions and interval for quality = 1", () => {
      const result = calculateSM2({
        quality: 1,
        repetitions: 5,
        easeFactor: 2.5,
        interval: 30,
        now: fixedNow,
      });

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it("should reset repetitions and interval for quality = 2", () => {
      const result = calculateSM2({
        quality: 2,
        repetitions: 3,
        easeFactor: 2.5,
        interval: 10,
        now: fixedNow,
      });

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it("should not let ease factor drop below 1.3", () => {
      const result = calculateSM2({
        quality: 1,
        repetitions: 0,
        easeFactor: 1.3,
        interval: 1,
        now: fixedNow,
      });

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe("when quality >= 3 (successful recall)", () => {
    it("should set interval to 1 on first successful review (rep 0 → 1)", () => {
      const result = calculateSM2({
        quality: 3,
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
        now: fixedNow,
      });

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
    });

    it("should set interval to 6 on second successful review (rep 1 → 2)", () => {
      const result = calculateSM2({
        quality: 3,
        repetitions: 1,
        easeFactor: 2.5,
        interval: 1,
        now: fixedNow,
      });

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });

    it("should multiply interval by easeFactor for subsequent reviews (rep >= 2)", () => {
      const result = calculateSM2({
        quality: 4,
        repetitions: 2,
        easeFactor: 2.5,
        interval: 6,
        now: fixedNow,
      });

      expect(result.repetitions).toBe(3);
      // q=4 maps to SM-2 q=5 → EF'=2.5+0.1=2.6 → interval=Math.round(6*2.6)=16
      expect(result.interval).toBe(16);
    });

    it("should adjust ease factor based on quality = 4 (easy)", () => {
      const result = calculateSM2({
        quality: 4,
        repetitions: 2,
        easeFactor: 2.5,
        interval: 6,
        now: fixedNow,
      });

      // q=4 maps to SM-2 q=5: EF' = 2.5 + (0.1 - 0*(0.08+0*0.02)) = 2.5 + 0.1 = 2.6
      expect(result.easeFactor).toBeCloseTo(2.6, 2);
    });

    it("should decrease ease factor for quality = 3 (hard)", () => {
      const result = calculateSM2({
        quality: 3,
        repetitions: 2,
        easeFactor: 2.5,
        interval: 6,
        now: fixedNow,
      });

      // q=3: EF' = 2.5 + (0.1 - 2 * (0.08 + 2 * 0.02)) = 2.5 + 0.1 - 0.24 = 2.36
      expect(result.easeFactor).toBeCloseTo(2.36, 2);
    });
  });

  describe("nextReviewAt calculation", () => {
    it("should set next review date to now + interval days", () => {
      const result = calculateSM2({
        quality: 4,
        repetitions: 2,
        easeFactor: 2.5,
        interval: 6,
        now: fixedNow,
      });

      const expected = new Date(fixedNow);
      expected.setDate(expected.getDate() + result.interval);
      expect(result.nextReviewAt).toBe(expected.toISOString());
    });

    it("should set next review to tomorrow when failing a card", () => {
      const result = calculateSM2({
        quality: 1,
        repetitions: 5,
        easeFactor: 2.5,
        interval: 30,
        now: fixedNow,
      });

      const expected = new Date(fixedNow);
      expected.setDate(expected.getDate() + 1);
      expect(result.nextReviewAt).toBe(expected.toISOString());
    });
  });

  describe("edge cases", () => {
    it("should handle brand new card (all defaults)", () => {
      const result = calculateSM2({
        quality: 3,
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
        now: fixedNow,
      });

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeCloseTo(2.36, 2);
    });

    it("should handle very high ease factor", () => {
      const result = calculateSM2({
        quality: 4,
        repetitions: 10,
        easeFactor: 3.0,
        interval: 100,
        now: fixedNow,
      });

      expect(result.repetitions).toBe(11);
      // q=4→5: EF'=3.0+0.1=3.1 → interval=Math.round(100*3.1)=310
      expect(result.interval).toBe(310);
      expect(result.easeFactor).toBeCloseTo(3.1, 2);
    });

    it("should handle minimum ease factor card recovering", () => {
      const result = calculateSM2({
        quality: 4,
        repetitions: 0,
        easeFactor: 1.3,
        interval: 0,
        now: fixedNow,
      });

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });
});
