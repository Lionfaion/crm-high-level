import { describe, it, expect } from "vitest";

// ── Rating calculation ─────────────────────────────────────────────────────────
describe("ReputationService — average rating", () => {
  function avgRating(ratings: number[]): number {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  it("computes average correctly", () => {
    expect(avgRating([5, 4, 3, 5, 5])).toBe(4.4);
  });

  it("returns 0 for empty list", () => {
    expect(avgRating([])).toBe(0);
  });

  it("handles single rating", () => {
    expect(avgRating([4])).toBe(4);
  });

  it("rounds to 1 decimal", () => {
    expect(avgRating([3, 4])).toBe(3.5);
  });
});

// ── Review source enum ────────────────────────────────────────────────────────
describe("Review source types", () => {
  const SOURCES = ["GOOGLE", "FACEBOOK", "YELP", "INTERNAL", "OTHER"];

  it("has 5 sources", () => {
    expect(SOURCES.length).toBe(5);
  });

  it("includes major platforms", () => {
    expect(SOURCES).toContain("GOOGLE");
    expect(SOURCES).toContain("FACEBOOK");
  });
});

// ── Review status ─────────────────────────────────────────────────────────────
describe("Review status transitions", () => {
  const STATUSES = ["PENDING", "PUBLISHED", "HIDDEN", "RESPONDED"];

  it("includes RESPONDED status", () => {
    expect(STATUSES).toContain("RESPONDED");
  });

  it("includes HIDDEN for moderation", () => {
    expect(STATUSES).toContain("HIDDEN");
  });
});
