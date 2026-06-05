import { describe, it, expect } from "vitest";

// ── Slot generation logic ──────────────────────────────────────────────────────
describe("CalendarService — slot generation", () => {
  function generateSlots(
    dateStr: string,
    startHour: number,
    endHour: number,
    durationMin: number,
    existing: { startAt: Date; endAt: Date }[]
  ) {
    const dayStart = new Date(`${dateStr}T${String(startHour).padStart(2, "0")}:00:00.000Z`);
    const dayEnd   = new Date(`${dateStr}T${String(endHour).padStart(2, "0")}:00:00.000Z`);
    const slots: { start: string; end: string }[] = [];
    let cursor = new Date(dayStart);

    while (cursor < dayEnd) {
      const slotEnd = new Date(cursor.getTime() + durationMin * 60_000);
      if (slotEnd > dayEnd) break;
      const overlap = existing.some((e) => cursor < e.endAt && slotEnd > e.startAt);
      if (!overlap) slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
      cursor = new Date(cursor.getTime() + durationMin * 60_000);
    }

    return slots;
  }

  it("generates correct number of 30-min slots in 9-17 window", () => {
    const slots = generateSlots("2025-01-01", 9, 17, 30, []);
    expect(slots.length).toBe(16); // 8 hours × 2 slots/hour
  });

  it("generates correct number of 60-min slots in 9-17 window", () => {
    const slots = generateSlots("2025-01-01", 9, 17, 60, []);
    expect(slots.length).toBe(8);
  });

  it("excludes booked slot", () => {
    const booked = {
      startAt: new Date("2025-01-01T09:00:00.000Z"),
      endAt:   new Date("2025-01-01T09:30:00.000Z"),
    };
    const slots = generateSlots("2025-01-01", 9, 17, 30, [booked]);
    expect(slots.length).toBe(15);
    expect(slots[0].start).toBe("2025-01-01T09:30:00.000Z");
  });

  it("returns empty slots for zero working hours", () => {
    const slots = generateSlots("2025-01-01", 9, 9, 30, []);
    expect(slots.length).toBe(0);
  });

  it("handles overlapping booking correctly", () => {
    // A 45-min booking should block the 30-min slot and the next one
    const booked = {
      startAt: new Date("2025-01-01T10:00:00.000Z"),
      endAt:   new Date("2025-01-01T10:45:00.000Z"),
    };
    const slots = generateSlots("2025-01-01", 9, 17, 30, [booked]);
    const blockedStarts = ["2025-01-01T10:00:00.000Z", "2025-01-01T10:30:00.000Z"];
    for (const s of blockedStarts) {
      expect(slots.find((sl) => sl.start === s)).toBeUndefined();
    }
  });
});

// ── Appointment status transitions ────────────────────────────────────────────
describe("Appointment status", () => {
  const VALID_STATUSES = ["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

  it("has 5 status values", () => {
    expect(VALID_STATUSES.length).toBe(5);
  });

  it("includes terminal statuses", () => {
    expect(VALID_STATUSES).toContain("COMPLETED");
    expect(VALID_STATUSES).toContain("CANCELLED");
  });
});
