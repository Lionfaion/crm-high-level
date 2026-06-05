import { describe, it, expect } from "vitest";
import { hasRole, isOneOf, Role } from "../lib/roles.js";

describe("hasRole", () => {
  it("SUPER_ADMIN passes all role checks", () => {
    expect(hasRole(Role.SUPER_ADMIN, Role.ACCOUNT_USER)).toBe(true);
    expect(hasRole(Role.SUPER_ADMIN, Role.AGENCY_ADMIN)).toBe(true);
    expect(hasRole(Role.SUPER_ADMIN, Role.SUPER_ADMIN)).toBe(true);
  });

  it("ACCOUNT_USER fails AGENCY_USER check", () => {
    expect(hasRole(Role.ACCOUNT_USER, Role.AGENCY_USER)).toBe(false);
  });

  it("AGENCY_ADMIN passes ACCOUNT_ADMIN check", () => {
    expect(hasRole(Role.AGENCY_ADMIN, Role.ACCOUNT_ADMIN)).toBe(true);
  });

  it("returns false for unknown role", () => {
    expect(hasRole("UNKNOWN_ROLE", Role.ACCOUNT_USER)).toBe(false);
  });
});

describe("isOneOf", () => {
  it("matches exact roles", () => {
    expect(isOneOf(Role.AGENCY_ADMIN, [Role.AGENCY_ADMIN, Role.SUPER_ADMIN])).toBe(true);
    expect(isOneOf(Role.ACCOUNT_USER, [Role.AGENCY_ADMIN, Role.SUPER_ADMIN])).toBe(false);
  });
});
