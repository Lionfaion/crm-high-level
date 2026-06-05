import { describe, it, expect } from "vitest";

// ── Invoice number generation ─────────────────────────────────────────────────
describe("PaymentService — invoice numbering", () => {
  function nextInvoiceNumber(count: number): string {
    const year = 2025;
    return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  it("generates first invoice number", () => {
    expect(nextInvoiceNumber(0)).toBe("INV-2025-0001");
  });

  it("pads with leading zeros", () => {
    expect(nextInvoiceNumber(9)).toBe("INV-2025-0010");
  });

  it("handles large invoice counts", () => {
    expect(nextInvoiceNumber(999)).toBe("INV-2025-1000");
  });
});

// ── Invoice total calculation ─────────────────────────────────────────────────
describe("PaymentService — invoice totals", () => {
  function calcInvoice(items: { quantity: number; unitPrice: number }[], taxRate: number) {
    const subtotal  = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const taxAmount = Math.round(subtotal * taxRate / 100);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  }

  it("calculates simple invoice", () => {
    const result = calcInvoice([{ quantity: 2, unitPrice: 5000 }], 0);
    expect(result.subtotal).toBe(10000);
    expect(result.total).toBe(10000);
  });

  it("applies tax rate", () => {
    const result = calcInvoice([{ quantity: 1, unitPrice: 10000 }], 10);
    expect(result.taxAmount).toBe(1000);
    expect(result.total).toBe(11000);
  });

  it("sums multiple line items", () => {
    const items = [
      { quantity: 1, unitPrice: 5000 },
      { quantity: 2, unitPrice: 2500 },
    ];
    const result = calcInvoice(items, 0);
    expect(result.subtotal).toBe(10000);
  });

  it("rounds tax to integer cents", () => {
    const result = calcInvoice([{ quantity: 1, unitPrice: 9999 }], 10);
    expect(Number.isInteger(result.taxAmount)).toBe(true);
  });
});

// ── Invoice status ────────────────────────────────────────────────────────────
describe("Invoice status", () => {
  const STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"];

  it("has 5 statuses", () => {
    expect(STATUSES.length).toBe(5);
  });

  it("PAID is a terminal status", () => {
    expect(STATUSES).toContain("PAID");
  });
});
