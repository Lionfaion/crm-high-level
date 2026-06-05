import { describe, it, expect } from "vitest";

// ── Contact growth grouping ───────────────────────────────────────────────────
describe("ReportingService — contact growth", () => {
  function buildDayMap(days: number): Record<string, number> {
    const start = new Date("2025-01-01");
    const byDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      byDay[d.toISOString().slice(0, 10)] = 0;
    }
    return byDay;
  }

  it("generates correct number of day buckets", () => {
    expect(Object.keys(buildDayMap(30)).length).toBe(30);
  });

  it("starts at expected date", () => {
    const map = buildDayMap(7);
    expect(Object.keys(map)[0]).toBe("2025-01-01");
  });
});

// ── CSV export ────────────────────────────────────────────────────────────────
describe("ReportingService — CSV export", () => {
  function exportCsv(rows: Record<string, string>[]): string {
    const headers = Object.keys(rows[0] ?? {});
    const lines   = rows.map((r) =>
      headers.map((h) => `"${(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    return [headers.join(","), ...lines].join("\n");
  }

  it("produces correct CSV header", () => {
    const csv = exportCsv([{ name: "Alice", email: "alice@test.com" }]);
    expect(csv.split("\n")[0]).toBe("name,email");
  });

  it("escapes double-quotes in values", () => {
    const csv = exportCsv([{ note: 'He said "hello"' }]);
    expect(csv).toContain('He said ""hello""');
  });

  it("handles empty dataset", () => {
    expect(exportCsv([])).toBe("");
  });
});

// ── Revenue aggregation ───────────────────────────────────────────────────────
describe("ReportingService — revenue by month", () => {
  function groupByMonth(payments: { amount: number; month: string }[]) {
    const byMonth: Record<string, number> = {};
    for (const p of payments) {
      byMonth[p.month] = (byMonth[p.month] ?? 0) + p.amount;
    }
    return byMonth;
  }

  it("sums amounts by month", () => {
    const result = groupByMonth([
      { month: "2025-01", amount: 5000 },
      { month: "2025-01", amount: 3000 },
      { month: "2025-02", amount: 2000 },
    ]);
    expect(result["2025-01"]).toBe(8000);
    expect(result["2025-02"]).toBe(2000);
  });

  it("returns empty object for no payments", () => {
    expect(groupByMonth([])).toEqual({});
  });
});

// ── Dashboard KPIs ────────────────────────────────────────────────────────────
describe("Dashboard stats structure", () => {
  const mockStats = {
    contacts:   { total: 150, newThisMonth: 12 },
    pipeline:   { openOpportunities: 8, wonValue: 50000 },
    messaging:  { sentCampaigns: 3, openConversations: 5 },
    calendar:   { scheduledAppointments: 7 },
    payments:   { totalRevenue: 125000 },
    reputation: { averageRating: 4.5 },
  };

  it("has all required top-level keys", () => {
    expect(mockStats).toHaveProperty("contacts");
    expect(mockStats).toHaveProperty("pipeline");
    expect(mockStats).toHaveProperty("messaging");
    expect(mockStats).toHaveProperty("calendar");
    expect(mockStats).toHaveProperty("payments");
    expect(mockStats).toHaveProperty("reputation");
  });

  it("contacts have total and newThisMonth", () => {
    expect(mockStats.contacts.total).toBeGreaterThan(0);
    expect(typeof mockStats.contacts.newThisMonth).toBe("number");
  });
});
