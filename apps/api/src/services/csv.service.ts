import { prisma } from "@crm/db";

export type CsvRow = Record<string, string>;

const FIELD_MAP: Record<string, string> = {
  first_name:   "firstName",
  firstname:    "firstName",
  last_name:    "lastName",
  lastname:     "lastName",
  email:        "email",
  phone:        "phone",
  mobile:       "phone",
  company:      "company",
  organization: "company",
  website:      "website",
  address:      "address",
  city:         "city",
  state:        "state",
  country:      "country",
  zip:          "zipCode",
  zipcode:      "zipCode",
  tags:         "tags",
};

function normalizeHeader(h: string) {
  return h.toLowerCase().trim().replace(/\s+/g, "_");
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.replace(/^"|"$/g, "").trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

export function mapRowToContact(row: CsvRow) {
  const contact: Record<string, unknown> = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const normalized = normalizeHeader(rawKey);
    const field = FIELD_MAP[normalized];
    if (!field || !value) continue;
    if (field === "tags") {
      contact.tags = value.split(";").map((t) => t.trim()).filter(Boolean);
    } else {
      contact[field] = value;
    }
  }
  return contact;
}

export async function importContacts(accountId: string, rows: CsvRow[]) {
  const mapped = rows.map(mapRowToContact).filter((r) => r.firstName);
  if (!mapped.length) return { imported: 0, skipped: rows.length };

  const result = await prisma.contact.createMany({
    data: mapped.map((r) => ({ accountId, ...(r as any) })),
    skipDuplicates: true,
  });

  return { imported: result.count, skipped: rows.length - result.count };
}

export async function exportContacts(accountId: string): Promise<string> {
  const contacts = await prisma.contact.findMany({
    where: { accountId },
    select: {
      firstName: true, lastName: true, email: true, phone: true,
      company: true, website: true, address: true, city: true,
      state: true, country: true, status: true, tags: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["first_name","last_name","email","phone","company","website","address","city","state","country","status","tags","created_at"];
  const rows = contacts.map((c) =>
    [
      c.firstName, c.lastName ?? "", c.email ?? "", c.phone ?? "",
      c.company ?? "", c.website ?? "", c.address ?? "", c.city ?? "",
      c.state ?? "", c.country ?? "", c.status, c.tags.join(";"),
      c.createdAt.toISOString(),
    ]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}
