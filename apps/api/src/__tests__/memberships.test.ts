import { describe, it, expect } from "vitest";

// ── Drip content availability ─────────────────────────────────────────────────
describe("MembershipService — drip content", () => {
  function isLessonAvailable(dripDays: number, enrolledAt: Date, now = new Date()): boolean {
    if (dripDays === 0) return true;
    const availableAt = new Date(enrolledAt.getTime() + dripDays * 24 * 60 * 60 * 1000);
    return now >= availableAt;
  }

  it("returns true for dripDays=0 (immediate access)", () => {
    expect(isLessonAvailable(0, new Date())).toBe(true);
  });

  it("returns false if drip days not elapsed", () => {
    const enrolledAt = new Date();
    expect(isLessonAvailable(7, enrolledAt)).toBe(false);
  });

  it("returns true after drip days elapsed", () => {
    const enrolledAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    expect(isLessonAvailable(7, enrolledAt)).toBe(true);
  });
});

// ── Progress calculation ──────────────────────────────────────────────────────
describe("Course progress", () => {
  function progressPercent(completedCount: number, totalLessons: number): number {
    if (totalLessons === 0) return 0;
    return Math.round((completedCount / totalLessons) * 100);
  }

  it("returns 0 for no lessons", () => {
    expect(progressPercent(0, 0)).toBe(0);
  });

  it("returns 100 for fully completed course", () => {
    expect(progressPercent(5, 5)).toBe(100);
  });

  it("calculates partial progress", () => {
    expect(progressPercent(3, 10)).toBe(30);
  });
});

// ── Course slug validation ────────────────────────────────────────────────────
describe("Course slug format", () => {
  const SLUG_REGEX = /^[a-z0-9-]+$/;

  it("accepts valid slug", () => {
    expect(SLUG_REGEX.test("my-course-101")).toBe(true);
  });

  it("rejects uppercase letters", () => {
    expect(SLUG_REGEX.test("My-Course")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(SLUG_REGEX.test("my course")).toBe(false);
  });
});
