import type { FastifyInstance } from "fastify";
import { prisma } from "@crm/db";
import { Role } from "../lib/roles.js";
import { pipelineSchema, stageSchema, opportunitySchema, moveOpportunitySchema } from "../schemas/pipeline.js";

export default async function pipelineRoutes(app: FastifyInstance) {
  const adminAuth = [app.authenticate, app.requireRole(Role.ACCOUNT_ADMIN)];
  const userAuth  = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];

  // ── Pipelines ────────────────────────────────────────────────────────────────

  app.get("/", { preHandler: userAuth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const pipelines = await prisma.pipeline.findMany({
      where: { accountId },
      include: { stages: { orderBy: { position: "asc" }, include: { _count: { select: { opportunities: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    return reply.send({ pipelines });
  });

  app.post("/", { preHandler: adminAuth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = pipelineSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const pipeline = await prisma.pipeline.create({
      data: { accountId, ...parsed.data, stages: {
        create: [
          { name: "Lead",        position: 0 },
          { name: "Qualified",   position: 1 },
          { name: "Proposal",    position: 2 },
          { name: "Closed Won",  position: 3, color: "#22c55e" },
        ],
      }},
      include: { stages: { orderBy: { position: "asc" } } },
    });
    return reply.code(201).send({ pipeline });
  });

  app.get("/:id", { preHandler: userAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    const pipeline = await prisma.pipeline.findFirst({
      where: { id, accountId },
      include: {
        stages: {
          orderBy: { position: "asc" },
          include: {
            opportunities: {
              include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });
    if (!pipeline) return reply.code(404).send({ error: "Pipeline not found" });
    return reply.send({ pipeline });
  });

  app.patch("/:id", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = pipelineSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const pipeline = await prisma.pipeline.update({ where: { id }, data: parsed.data });
    return reply.send({ pipeline });
  });

  app.delete("/:id", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.pipeline.delete({ where: { id } });
    return reply.code(204).send();
  });

  // ── Stages ───────────────────────────────────────────────────────────────────

  app.post("/:pipelineId/stages", { preHandler: adminAuth }, async (request, reply) => {
    const { pipelineId } = request.params as { pipelineId: string };
    const parsed = stageSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const stage = await prisma.stage.create({ data: { pipelineId, ...parsed.data } });
    return reply.code(201).send({ stage });
  });

  app.patch("/:pipelineId/stages/:stageId", { preHandler: adminAuth }, async (request, reply) => {
    const { stageId } = request.params as { pipelineId: string; stageId: string };
    const parsed = stageSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const stage = await prisma.stage.update({ where: { id: stageId }, data: parsed.data });
    return reply.send({ stage });
  });

  app.delete("/:pipelineId/stages/:stageId", { preHandler: adminAuth }, async (request, reply) => {
    const { stageId } = request.params as { pipelineId: string; stageId: string };
    await prisma.stage.delete({ where: { id: stageId } });
    return reply.code(204).send();
  });

  // ── Opportunities ────────────────────────────────────────────────────────────

  app.get("/:pipelineId/opportunities", { preHandler: userAuth }, async (request, reply) => {
    const { pipelineId } = request.params as { pipelineId: string };
    const opportunities = await prisma.opportunity.findMany({
      where: { stage: { pipelineId } },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        stage: true,
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({ opportunities });
  });

  app.post("/:pipelineId/opportunities", { preHandler: userAuth }, async (request, reply) => {
    const parsed = opportunitySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const opportunity = await prisma.opportunity.create({
      data: { ...parsed.data, closeDate: parsed.data.closeDate ? new Date(parsed.data.closeDate) : undefined },
      include: { contact: { select: { id: true, firstName: true, lastName: true } }, stage: true },
    });
    return reply.code(201).send({ opportunity });
  });

  app.patch("/:pipelineId/opportunities/:oppId", { preHandler: userAuth }, async (request, reply) => {
    const { oppId } = request.params as { pipelineId: string; oppId: string };
    const parsed = opportunitySchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const opportunity = await prisma.opportunity.update({
      where: { id: oppId },
      data: { ...parsed.data, closeDate: parsed.data.closeDate ? new Date(parsed.data.closeDate) : undefined },
    });
    return reply.send({ opportunity });
  });

  // POST /:pipelineId/opportunities/:oppId/move — drag-and-drop stage change
  app.post("/:pipelineId/opportunities/:oppId/move", { preHandler: userAuth }, async (request, reply) => {
    const { oppId } = request.params as { pipelineId: string; oppId: string };
    const parsed = moveOpportunitySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const opportunity = await prisma.opportunity.update({
      where: { id: oppId },
      data: { stageId: parsed.data.stageId },
      include: { stage: true },
    });
    return reply.send({ opportunity });
  });

  app.delete("/:pipelineId/opportunities/:oppId", { preHandler: adminAuth }, async (request, reply) => {
    const { oppId } = request.params as { pipelineId: string; oppId: string };
    await prisma.opportunity.delete({ where: { id: oppId } });
    return reply.code(204).send();
  });
}
