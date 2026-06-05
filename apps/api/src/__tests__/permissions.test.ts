import { describe, it, expect } from "vitest";
import { can } from "../lib/permissions.js";
import { Role } from "../lib/roles.js";

describe("permissions matrix", () => {
  it("ACCOUNT_USER can read contacts", () => {
    expect(can(Role.ACCOUNT_USER, "read", "contact")).toBe(true);
  });

  it("ACCOUNT_USER cannot delete contacts", () => {
    expect(can(Role.ACCOUNT_USER, "delete", "contact")).toBe(false);
  });

  it("ACCOUNT_ADMIN can delete contacts", () => {
    expect(can(Role.ACCOUNT_ADMIN, "delete", "contact")).toBe(true);
  });

  it("ACCOUNT_USER cannot create agencies", () => {
    expect(can(Role.ACCOUNT_USER, "create", "agency")).toBe(false);
  });

  it("SUPER_ADMIN can create agencies", () => {
    expect(can(Role.SUPER_ADMIN, "create", "agency")).toBe(true);
  });

  it("activity cannot be updated by anyone", () => {
    expect(can(Role.SUPER_ADMIN, "update", "activity")).toBe(false);
  });

  it("returns false for unknown combinations", () => {
    expect(can("GHOST" as any, "read", "contact")).toBe(false);
  });
});
