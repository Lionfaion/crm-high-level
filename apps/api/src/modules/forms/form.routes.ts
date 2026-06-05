import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { FormService } from "./form.service.js";

const FIELD_TYPES = ["TEXT", "EMAIL", "PHONE", "SELECT", "CHECKBOX", "DATE", "TEXTAREA", "NUMBER", "RADIO"] as const;

const formSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  redirectUrl: z.string().url().optional().or(z.literal("")),
  submitText:  z.string().max(100).optional(),
});

const fieldSchema = z.object({
  label:       z.string().min(1).max(200),
  fieldType:   z.enum(FIELD_TYPES),
  placeholder: z.string().max(200).optional(),
  required:    z.boolean().default(false),
  options:     z.array(z.string()).optional(),
  position:    z.number().int().optional(),
  mappedField: z.string().optional(),
});

export default async function formRoutes(app: FastifyInstance) {
  const auth      = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];
  const adminAuth = [app.authenticate, app.requireRole(Role.ACCOUNT_ADMIN)];

  // ── Forms CRUD ────────────────────────────────────────────────────────────
  app.get("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ forms: await FormService.list(accountId) });
  });

  app.post("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = formSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const form = await FormService.create(accountId, parsed.data);
    return reply.code(201).send({ form });
  });

  app.get("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const form = await FormService.get(id, accountId);
    if (!form) return reply.code(404).send({ error: "Form not found" });
    return reply.send({ form });
  });

  app.patch("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = formSchema.partial().extend({ isActive: z.boolean().optional() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await FormService.update(id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/:id", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await FormService.delete(id, accountId);
    return reply.code(204).send();
  });

  // ── Fields ────────────────────────────────────────────────────────────────
  app.post("/:id/fields", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = fieldSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const field = await FormService.addField(id, accountId, parsed.data);
    return reply.code(201).send({ field });
  });

  app.patch("/:id/fields/:fieldId", { preHandler: auth }, async (request, reply) => {
    const { id, fieldId } = request.params as { id: string; fieldId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = fieldSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await FormService.updateField(fieldId, id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/:id/fields/:fieldId", { preHandler: auth }, async (request, reply) => {
    const { id, fieldId } = request.params as { id: string; fieldId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await FormService.deleteField(fieldId, id, accountId);
    return reply.code(204).send();
  });

  // ── Public submit endpoint ────────────────────────────────────────────────
  app.post("/:id/submit", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const result = await FormService.submit(id, body, {
      ip: request.ip,
      ua: (request.headers["user-agent"] as string) ?? undefined,
    });
    return reply.send(result);
  });

  // ── Submissions ────────────────────────────────────────────────────────────
  app.get("/:id/submissions", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { page = "1", pageSize = "25" } = request.query as any;
    return reply.send(await FormService.listSubmissions(id, accountId, {
      page: Number(page), pageSize: Number(pageSize),
    }));
  });

  // ── Embed code ────────────────────────────────────────────────────────────
  app.get("/:id/embed", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const origin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const code = `<script src="${origin}/embed/form.js" data-form-id="${id}" async></script>`;
    return reply.send({ code });
  });
}
