import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { FunnelService } from "./funnel.service.js";

const funnelSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  domain:      z.string().optional(),
});

const pageSchema = z.object({
  name:     z.string().min(1).max(200),
  slug:     z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  content:  z.record(z.unknown()).optional(),
  position: z.number().int().optional(),
});

export default async function funnelRoutes(app: FastifyInstance) {
  const auth      = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];
  const adminAuth = [app.authenticate, app.requireRole(Role.ACCOUNT_ADMIN)];

  app.get("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ funnels: await FunnelService.list(accountId) });
  });

  app.post("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = funnelSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const funnel = await FunnelService.create(accountId, parsed.data);
    return reply.code(201).send({ funnel });
  });

  app.get("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const funnel = await FunnelService.get(id, accountId);
    if (!funnel) return reply.code(404).send({ error: "Funnel not found" });
    return reply.send({ funnel });
  });

  app.patch("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = funnelSchema.partial().extend({ isActive: z.boolean().optional() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await FunnelService.update(id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/:id", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await FunnelService.delete(id, accountId);
    return reply.code(204).send();
  });

  // ── Pages ─────────────────────────────────────────────────────────────────
  app.post("/:id/pages", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = pageSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const page = await FunnelService.addPage(id, accountId, parsed.data);
    return reply.code(201).send({ page });
  });

  app.patch("/:id/pages/:pageId", { preHandler: auth }, async (request, reply) => {
    const { id, pageId } = request.params as { id: string; pageId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = pageSchema.partial().extend({ isEnabled: z.boolean().optional() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await FunnelService.updatePage(pageId, id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/:id/pages/:pageId", { preHandler: auth }, async (request, reply) => {
    const { id, pageId } = request.params as { id: string; pageId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await FunnelService.deletePage(pageId, id, accountId);
    return reply.code(204).send();
  });

  // ── Analytics events (public) ─────────────────────────────────────────────
  app.post("/pages/:pageId/event", async (request, reply) => {
    const { pageId } = request.params as { pageId: string };
    const { event } = request.body as { event?: string };
    if (event !== "view" && event !== "conversion")
      return reply.code(400).send({ error: "Invalid event" });
    await FunnelService.recordEvent(pageId, event);
    return reply.send({ ok: true });
  });
}
