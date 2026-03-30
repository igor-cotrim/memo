import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { getRelativeTimeString } from "../../src/utils/date";

describe("getRelativeTimeString", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Now / Ready" for dates in the very recent past (< 60s)', () => {
    const thirtySecondsAgo = new Date("2026-03-30T11:59:45Z");
    expect(getRelativeTimeString(thirtySecondsAgo, "en")).toBe("Now / Ready");
  });

  it('returns "Agora / Pronto" for recently past dates in pt-BR', () => {
    const tenSecondsAgo = new Date("2026-03-30T11:59:55Z");
    expect(getRelativeTimeString(tenSecondsAgo, "pt-BR")).toBe(
      "Agora / Pronto",
    );
  });

  it("returns relative time for dates in the future (minutes)", () => {
    const inFiveMinutes = new Date("2026-03-30T12:05:00Z");
    const result = getRelativeTimeString(inFiveMinutes, "en");
    expect(result).toContain("5");
    expect(result).toContain("minute");
  });

  it("returns relative time for dates in the future (hours)", () => {
    const inTwoHours = new Date("2026-03-30T14:00:00Z");
    const result = getRelativeTimeString(inTwoHours, "en");
    expect(result).toContain("2");
    expect(result).toContain("hour");
  });

  it("returns relative time for dates in the future (days)", () => {
    const inThreeDays = new Date("2026-04-02T12:00:00Z");
    const result = getRelativeTimeString(inThreeDays, "en");
    expect(result).toContain("3");
    expect(result).toContain("day");
  });

  it("returns relative time for weeks", () => {
    const inTwoWeeks = new Date("2026-04-13T12:00:00Z");
    const result = getRelativeTimeString(inTwoWeeks, "en");
    expect(result).toContain("2");
    expect(result).toContain("week");
  });

  it("returns relative time for months", () => {
    const inTwoMonths = new Date("2026-05-30T12:00:00Z");
    const result = getRelativeTimeString(inTwoMonths, "en");
    expect(result).toContain("2");
    expect(result).toContain("month");
  });

  it("returns relative time for years", () => {
    const inTwoYears = new Date("2028-03-30T12:00:00Z");
    const result = getRelativeTimeString(inTwoYears, "en");
    expect(result).toContain("2");
    expect(result).toContain("year");
  });

  it("accepts string dates", () => {
    const result = getRelativeTimeString("2026-03-30T11:59:50Z", "en");
    expect(result).toBe("Now / Ready");
  });

  it("returns relative time for past dates (more than 60s ago)", () => {
    const fiveMinutesAgo = new Date("2026-03-30T11:55:00Z");
    const result = getRelativeTimeString(fiveMinutesAgo, "en");
    expect(result).toContain("5");
    expect(result).toContain("minute");
  });

  it("returns relative time in pt-BR for future", () => {
    const inFiveMinutes = new Date("2026-03-30T12:05:00Z");
    const result = getRelativeTimeString(inFiveMinutes, "pt-BR");
    expect(result).toContain("5");
    expect(result).toContain("minuto");
  });

  it('returns "Now / Ready" at exactly 0 delta', () => {
    const now = new Date("2026-03-30T12:00:00Z");
    expect(getRelativeTimeString(now, "en")).toBe("Now / Ready");
  });
});
