import type { FastifyInstance } from "fastify";
import { Role } from "../lib/roles.js";
import { parseCsv, importContacts, exportContacts } from "../services/csv.service.js";

export default async function contactImportRoutes(app: FastifyInstance) {
  // POST /contacts/import  — multipart CSV upload
  app.post("/import", {
    preHandler: [app.authenticate, app.requireRole(Role.ACCOUNT_USER)],
  }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const data = await request.body as { file?: { filename: string; data: Buffer } };

    // Accept raw CSV body when content-type is text/csv
    let csvText: string;
    if (request.headers["content-type"]?.includes("text/csv")) {
      csvText = (request.body as Buffer).toString("utf8");
    } else if (data?.file?.data) {
      csvText = data.file.data.toString("utf8");
    } else {
      return reply.code(400).send({ error: "No CSV file provided. Send as text/csv body." });
    }

    const rows = parseCsv(csvText);
    if (!rows.length) return reply.code(400).send({ error: "CSV is empty or malformed" });

    const result = await importContacts(accountId, rows);
    return reply.send(result);
  });

  // GET /contacts/export  — download CSV
  app.get("/export", {
    preHandler: [app.authenticate, app.requireRole(Role.ACCOUNT_USER)],
  }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const csv = await exportContacts(accountId);

    return reply
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", `attachment; filename="contacts-${Date.now()}.csv"`)
      .send(csv);
  });
}
