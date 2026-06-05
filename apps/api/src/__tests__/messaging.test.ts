import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Email service ──────────────────────────────────────────────────────────────
describe("emailService.renderTemplate", () => {
  it("replaces single variable", async () => {
    const { emailService } = await import("../modules/messaging/email.service.js");
    const result = emailService.renderTemplate("Hello {{firstName}}!", { firstName: "Alice" });
    expect(result).toBe("Hello Alice!");
  });

  it("replaces multiple variables", async () => {
    const { emailService } = await import("../modules/messaging/email.service.js");
    const result = emailService.renderTemplate("Hi {{firstName}} {{lastName}}", {
      firstName: "Bob",
      lastName: "Smith",
    });
    expect(result).toBe("Hi Bob Smith");
  });

  it("leaves unknown variables intact", async () => {
    const { emailService } = await import("../modules/messaging/email.service.js");
    const result = emailService.renderTemplate("Hello {{unknown}}", { firstName: "X" });
    expect(result).toBe("Hello {{unknown}}");
  });

  it("handles empty variables map", async () => {
    const { emailService } = await import("../modules/messaging/email.service.js");
    const result = emailService.renderTemplate("No vars here", {});
    expect(result).toBe("No vars here");
  });
});

// ── Chatbot matchRule ─────────────────────────────────────────────────────────
describe("ChatbotService.matchRule — keyword matching logic", () => {
  it("matches single keyword (case-insensitive)", () => {
    const trigger = "hello";
    const message = "Hello there!";
    const keywords = trigger.split(",").map((k) => k.trim().toLowerCase());
    const lower = message.toLowerCase();
    expect(keywords.some((kw) => lower.includes(kw))).toBe(true);
  });

  it("matches comma-separated keywords", () => {
    const trigger = "help, support, assist";
    const message = "I need some support";
    const keywords = trigger.split(",").map((k) => k.trim().toLowerCase());
    const lower = message.toLowerCase();
    expect(keywords.some((kw) => lower.includes(kw))).toBe(true);
  });

  it("does not match unrelated message", () => {
    const trigger = "pricing, plans";
    const message = "Hello world";
    const keywords = trigger.split(",").map((k) => k.trim().toLowerCase());
    const lower = message.toLowerCase();
    expect(keywords.some((kw) => lower.includes(kw))).toBe(false);
  });

  it("matches partial word within keyword", () => {
    const trigger = "price";
    const message = "What is the pricing?";
    const keywords = trigger.split(",").map((k) => k.trim().toLowerCase());
    const lower = message.toLowerCase();
    expect(keywords.some((kw) => lower.includes(kw))).toBe(true);
  });
});

// ── Campaign send logic ────────────────────────────────────────────────────────
describe("CampaignService — template rendering", () => {
  it("injects firstName into campaign body", async () => {
    const { emailService } = await import("../modules/messaging/email.service.js");
    const body = "Hi {{firstName}}, check our new offer!";
    const rendered = emailService.renderTemplate(body, { firstName: "Carol", lastName: "Jones" });
    expect(rendered).toContain("Carol");
    expect(rendered).not.toContain("{{firstName}}");
  });

  it("renders SMS body with both name parts", async () => {
    const { emailService } = await import("../modules/messaging/email.service.js");
    const body = "{{firstName}} {{lastName}}: Your appointment is confirmed.";
    const rendered = emailService.renderTemplate(body, { firstName: "Dan", lastName: "Brown" });
    expect(rendered).toBe("Dan Brown: Your appointment is confirmed.");
  });
});
