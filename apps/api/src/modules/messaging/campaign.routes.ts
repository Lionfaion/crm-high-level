import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { CampaignService } from "./campaign.service.js";

const campaignSchema = z.object({
  name:        z.string().min(1).max(200),
  type:        z.enum(["EMAIL", "SMS"]),
  subject:     z.string().optional(),
  body:        z.string().min(1),
  fromName:    z.string().optional(),
  fromEmail:   z.string().email().optional().or(z.literal("")),
  fromPhone:   z.string().optional(),
  tags:        z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

const recipientsSchema = z.object({
  tag:        z.string().optional(),
  contactIds: z.array(z.string().uuid()).optional(),
}).refine((d) => d.tag || (d.contactIds && d.contactIds.length > 0), {
  message: "Provide tag or contactIds",
});

const listSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  type:     z.enum(["EMAIL","SMS"]).optional(),
});

export default async function campaignRoutes(app: FastifyInstance) {
  const auth      = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];
  const adminAuth = [app.authenticate, app.requireRole(Role.ACCOUNT_ADMIN)];

  app.get("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = listSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    return reply.send(await CampaignService.list(accountId, parsed.data));
  });

  app.post("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = campaignSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const data = { ...parsed.data, scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined };
    const campaign = await CampaignService.create(accountId, data as any);
    return reply.code(201).send({ campaign });
  });

  app.get("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const campaign = await CampaignService.get(id, accountId);
    if (!campaign) return reply.code(404).send({ error: "Campaign not found" });
    return reply.send({ campaign });
  });

  app.patch("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = campaignSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await CampaignService.update(id, accountId, parsed.data as any);
    const campaign = await CampaignService.get(id, accountId);
    return reply.send({ campaign });
  });

  app.delete("/:id", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await CampaignService.delete(id, accountId);
    return reply.code(204).send();
  });

  app.post("/:id/recipients", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = recipientsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const result = await CampaignService.addRecipients(id, accountId, parsed.data);
    return reply.send(result);
  });

  app.post("/:id/send", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const result = await CampaignService.send(id, accountId);
    return reply.send(result);
  });
}
