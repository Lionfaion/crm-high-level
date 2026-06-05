import { describe, it, expect } from "vitest";
import { parseCsv, mapRowToContact } from "../services/csv.service.js";

describe("parseCsv", () => {
  it("parses standard CSV with headers", () => {
    const csv = `first_name,last_name,email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com`;
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ first_name: "John", last_name: "Doe", email: "john@example.com" });
  });

  it("handles quoted values", () => {
    const csv = `"first_name","email"\n"John","john@example.com"`;
    const rows = parseCsv(csv);
    expect(rows[0].first_name).toBe("John");
  });

  it("returns empty array for header-only CSV", () => {
    expect(parseCsv("first_name,email")).toHaveLength(0);
  });
});

describe("mapRowToContact", () => {
  it("maps snake_case headers to camelCase fields", () => {
    const row = { first_name: "Jane", last_name: "Doe", email: "jane@example.com", company: "Acme" };
    const contact = mapRowToContact(row);
    expect(contact.firstName).toBe("Jane");
    expect(contact.lastName).toBe("Doe");
    expect(contact.email).toBe("jane@example.com");
  });

  it("splits semicolon-separated tags", () => {
    const row = { first_name: "Alice", tags: "vip;customer;warm" };
    const contact = mapRowToContact(row);
    expect(contact.tags).toEqual(["vip", "customer", "warm"]);
  });

  it("maps alternative header names", () => {
    const row = { firstname: "Bob", mobile: "555-1234", organization: "Corp" };
    const contact = mapRowToContact(row);
    expect(contact.firstName).toBe("Bob");
    expect(contact.phone).toBe("555-1234");
    expect(contact.company).toBe("Corp");
  });
});
