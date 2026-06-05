import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { ReputationService } from "./reputation.service.js";

const reviewSchema = z.object({
  rating:       z.number().int().min(1).max(5),
  title:        z.string().max(300).optional(),
  body:         z.string().max(5000).optional(),
  source:       z.enum(["GOOGLE", "FACEBOOK", "YELP", "INTERNAL", "OTHER"]).optional(),
  reviewerName: z.string().max(200).optional(),
  reviewUrl:    z.string().url().optional().or(z.literal("")),
  contactId:    z.string().uuid().optional(),
});

const listSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  pageSize:  z.coerce.number().min(1).max(100).default(25),
  source:    z.enum(["GOOGLE", "FACEBOOK", "YELP", "INTERNAL", "OTHER"]).optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  status:    z.enum(["PENDING", "PUBLISHED", "HIDDEN", "RESPONDED"]).optional(),
});

export default async function reputationRoutes(app: FastifyInstance) {
  const auth      = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];
  const adminAuth = [app.authenticate, app.requireRole(Role.ACCOUNT_ADMIN)];

  // ── Stats ─────────────────────────────────────────────────────────────────
  app.get("/stats", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send(await ReputationService.getStats(accountId));
  });

  // ── Reviews ───────────────────────────────────────────────────────────────
  app.get("/reviews", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = listSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    return reply.send(await ReputationService.list(accountId, parsed.data));
  });

  app.post("/reviews", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = reviewSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const review = await ReputationService.create(accountId, parsed.data);
    return reply.code(201).send({ review });
  });

  app.post("/reviews/:id/respond", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { response } = request.body as { response?: string };
    if (!response) return reply.code(400).send({ error: "response required" });
    await ReputationService.respond(id, accountId, response);
    return reply.send({ ok: true });
  });

  app.post("/reviews/:id/hide", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await ReputationService.hide(id, accountId);
    return reply.send({ ok: true });
  });

  app.post("/reviews/:id/publish", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await ReputationService.publish(id, accountId);
    return reply.send({ ok: true });
  });

  // ── Review Requests ───────────────────────────────────────────────────────
  app.post("/requests", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { contactId, channel } = request.body as { contactId?: string; channel?: string };
    if (!contactId) return reply.code(400).send({ error: "contactId required" });
    const chan = (channel === "SMS" ? "SMS" : "EMAIL") as "EMAIL" | "SMS";
    const req = await ReputationService.sendRequest(accountId, contactId, chan);
    return reply.code(201).send({ request: req });
  });

  app.get("/requests", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { page = "1", pageSize = "25" } = request.query as any;
    return reply.send(await ReputationService.listRequests(accountId, {
      page: Number(page), pageSize: Number(pageSize),
    }));
  });
}
