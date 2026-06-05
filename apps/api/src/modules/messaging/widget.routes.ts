import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { prisma } from "@crm/db";

const widgetConfigSchema = z.object({
  primaryColor:    z.string().optional(),
  greeting:        z.string().max(500).optional(),
  position:        z.enum(["bottom-right", "bottom-left"]).optional(),
  autoOpen:        z.boolean().optional(),
  offlineMessage:  z.string().max(500).optional(),
  logoUrl:         z.string().url().optional().or(z.literal("")),
  businessName:    z.string().max(200).optional(),
  isEnabled:       z.boolean().optional(),
});

export default async function widgetRoutes(app: FastifyInstance) {
  const auth = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];

  app.get("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const widget = await prisma.chatWidget.findUnique({ where: { accountId } });
    return reply.send({ widget: widget ?? null });
  });

  app.put("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const parsed = widgetConfigSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const widget = await prisma.chatWidget.upsert({
      where:  { accountId },
      create: { accountId, ...parsed.data },
      update: parsed.data,
    });

    return reply.send({ widget });
  });
}
