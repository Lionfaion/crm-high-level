import type { FastifyInstance } from "fastify";
import { Role } from "../lib/roles.js";
import { contactSchema, contactUpdateSchema, contactQuerySchema } from "../schemas/contact.js";
import { ContactService } from "../services/contact.service.js";

export default async function contactRoutes(app: FastifyInstance) {
  const auth = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];

  // GET /contacts
  app.get("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const parsed = contactQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query", details: parsed.error.flatten() });

    const result = await ContactService.list(accountId, parsed.data);
    return reply.send(result);
  });

  // POST /contacts
  app.post("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const contact = await ContactService.create(accountId, parsed.data);
    return reply.code(201).send({ contact });
  });

  // GET /contacts/:id
  app.get("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const contact = await ContactService.get(id, accountId);
    if (!contact) return reply.code(404).send({ error: "Contact not found" });
    return reply.send({ contact });
  });

  // PATCH /contacts/:id
  app.patch("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const parsed = contactUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    await ContactService.update(id, accountId, parsed.data);
    const contact = await ContactService.get(id, accountId);
    return reply.send({ contact });
  });

  // DELETE /contacts/:id  — ACCOUNT_ADMIN+
  app.delete("/:id", {
    preHandler: [app.authenticate, app.requirePermission("contact", "delete")],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const result = await ContactService.delete(id, accountId);
    if (result.count === 0) return reply.code(404).send({ error: "Contact not found" });
    return reply.code(204).send();
  });
}
