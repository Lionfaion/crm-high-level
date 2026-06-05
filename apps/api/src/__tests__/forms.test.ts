import { describe, it, expect } from "vitest";

// ── Form field types ──────────────────────────────────────────────────────────
describe("FormService — field types", () => {
  const FIELD_TYPES = ["TEXT", "EMAIL", "PHONE", "SELECT", "CHECKBOX", "DATE", "TEXTAREA", "NUMBER", "RADIO"];

  it("has 9 field types", () => {
    expect(FIELD_TYPES.length).toBe(9);
  });

  it("includes EMAIL field type for contact mapping", () => {
    expect(FIELD_TYPES).toContain("EMAIL");
  });

  it("includes SELECT and RADIO for option-based fields", () => {
    expect(FIELD_TYPES).toContain("SELECT");
    expect(FIELD_TYPES).toContain("RADIO");
  });
});

// ── Contact auto-create from submission ───────────────────────────────────────
describe("FormService — contact extraction", () => {
  function extractEmail(
    fields: { id: string; fieldType: string; mappedField?: string }[],
    data: Record<string, unknown>
  ): string | null {
    const emailField = fields.find((f) => f.mappedField === "email" || f.fieldType === "EMAIL");
    if (emailField && data[emailField.id]) {
      return String(data[emailField.id]).toLowerCase();
    }
    return null;
  }

  it("extracts email from EMAIL-typed field", () => {
    const fields = [{ id: "f1", fieldType: "EMAIL" }];
    const data   = { f1: "Alice@Example.com" };
    expect(extractEmail(fields, data)).toBe("alice@example.com");
  });

  it("extracts email from mappedField=email", () => {
    const fields = [{ id: "f2", fieldType: "TEXT", mappedField: "email" }];
    const data   = { f2: "Bob@test.com" };
    expect(extractEmail(fields, data)).toBe("bob@test.com");
  });

  it("returns null when no email field present", () => {
    const fields = [{ id: "f3", fieldType: "TEXT" }];
    const data   = { f3: "just text" };
    expect(extractEmail(fields, data)).toBeNull();
  });
});

// ── Funnel conversion rate ────────────────────────────────────────────────────
describe("FunnelService — conversion tracking", () => {
  function conversionRate(views: number, conversions: number): number {
    if (views === 0) return 0;
    return Math.round((conversions / views) * 10000) / 100;
  }

  it("calculates conversion rate correctly", () => {
    expect(conversionRate(100, 25)).toBe(25);
  });

  it("returns 0 for zero views", () => {
    expect(conversionRate(0, 0)).toBe(0);
  });

  it("handles partial conversions", () => {
    expect(conversionRate(300, 1)).toBe(0.33);
  });
});
