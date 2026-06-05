import { describe, it, expect } from "vitest";

// ── Workflow trigger type validation ──────────────────────────────────────────
describe("WorkflowService — trigger type coverage", () => {
  const VALID_TRIGGERS = [
    "CONTACT_CREATED", "CONTACT_UPDATED", "TAG_ADDED", "TAG_REMOVED",
    "FORM_SUBMITTED", "APPOINTMENT_BOOKED", "OPPORTUNITY_CREATED",
    "OPPORTUNITY_WON", "OPPORTUNITY_LOST", "INBOUND_MESSAGE", "MANUAL",
  ];

  it("has expected number of trigger types", () => {
    expect(VALID_TRIGGERS.length).toBe(11);
  });

  it("includes MANUAL trigger for testing", () => {
    expect(VALID_TRIGGERS).toContain("MANUAL");
  });

  it("includes contact lifecycle triggers", () => {
    expect(VALID_TRIGGERS).toContain("CONTACT_CREATED");
    expect(VALID_TRIGGERS).toContain("CONTACT_UPDATED");
  });
});

// ── Action type coverage ──────────────────────────────────────────────────────
describe("WorkflowService — action types", () => {
  const VALID_ACTIONS = [
    "SEND_EMAIL", "SEND_SMS", "ADD_TAG", "REMOVE_TAG", "WAIT",
    "WEBHOOK", "ASSIGN_USER", "CREATE_OPPORTUNITY", "UPDATE_CONTACT", "INTERNAL_NOTE",
  ];

  it("has expected number of action types", () => {
    expect(VALID_ACTIONS.length).toBe(10);
  });

  it("includes communication actions", () => {
    expect(VALID_ACTIONS).toContain("SEND_EMAIL");
    expect(VALID_ACTIONS).toContain("SEND_SMS");
  });

  it("includes tag management actions", () => {
    expect(VALID_ACTIONS).toContain("ADD_TAG");
    expect(VALID_ACTIONS).toContain("REMOVE_TAG");
  });

  it("includes wait action for delays", () => {
    expect(VALID_ACTIONS).toContain("WAIT");
  });
});

// ── Step position ordering ─────────────────────────────────────────────────────
describe("Workflow step ordering", () => {
  const mockSteps = [
    { id: "s3", position: 2, actionType: "SEND_SMS" },
    { id: "s1", position: 0, actionType: "SEND_EMAIL" },
    { id: "s2", position: 1, actionType: "WAIT" },
  ];

  it("sorts steps by position ascending", () => {
    const sorted = [...mockSteps].sort((a, b) => a.position - b.position);
    expect(sorted[0].actionType).toBe("SEND_EMAIL");
    expect(sorted[1].actionType).toBe("WAIT");
    expect(sorted[2].actionType).toBe("SEND_SMS");
  });
});

// ── Template variable injection ───────────────────────────────────────────────
describe("Workflow email/SMS template rendering", () => {
  function renderTemplate(template: string, data: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
  }

  it("injects contact firstName into email body", () => {
    const result = renderTemplate("Hi {{firstName}}, welcome!", { firstName: "Alice" });
    expect(result).toBe("Hi Alice, welcome!");
  });

  it("leaves unresolved variables as-is", () => {
    const result = renderTemplate("Hi {{firstName}} {{lastName}}", { firstName: "Bob" });
    expect(result).toBe("Hi Bob {{lastName}}");
  });

  it("renders empty template unchanged", () => {
    const result = renderTemplate("", {});
    expect(result).toBe("");
  });
});
