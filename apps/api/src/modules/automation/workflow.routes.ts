import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { WorkflowService } from "./workflow.service.js";

const TRIGGER_TYPES = [
  "CONTACT_CREATED", "CONTACT_UPDATED", "TAG_ADDED", "TAG_REMOVED",
  "FORM_SUBMITTED", "APPOINTMENT_BOOKED", "OPPORTUNITY_CREATED",
  "OPPORTUNITY_WON", "OPPORTUNITY_LOST", "INBOUND_MESSAGE", "MANUAL",
] as const;

const ACTION_TYPES = [
  "SEND_EMAIL", "SEND_SMS", "ADD_TAG", "REMOVE_TAG", "WAIT",
  "WEBHOOK", "ASSIGN_USER", "CREATE_OPPORTUNITY", "UPDATE_CONTACT", "INTERNAL_NOTE",
] as const;

const workflowSchema = z.object({
  name:          z.string().min(1).max(200),
  description:   z.string().max(1000).optional(),
  triggerType:   z.enum(TRIGGER_TYPES),
  triggerConfig: z.record(z.unknown()).optional(),
});

const stepSchema = z.object({
  actionType: z.enum(ACTION_TYPES),
  config:     z.record(z.unknown()).optional(),
  position:   z.number().int().optional(),
});

const listSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  status:   z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
});

const triggerSchema = z.object({
  contactId:   z.string().uuid().optional(),
  triggeredBy: z.string().optional(),
});

export default async function workflowRoutes(app: FastifyInstance) {
  const auth      = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];
  const adminAuth = [app.authenticate, app.requireRole(Role.ACCOUNT_ADMIN)];

  // ── Workflows CRUD ────────────────────────────────────────────────────────
  app.get("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = listSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    return reply.send(await WorkflowService.list(accountId, parsed.data));
  });

  app.post("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = workflowSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const workflow = await WorkflowService.create(accountId, parsed.data);
    return reply.code(201).send({ workflow });
  });

  app.get("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const workflow = await WorkflowService.get(id, accountId);
    if (!workflow) return reply.code(404).send({ error: "Workflow not found" });
    return reply.send({ workflow });
  });

  app.patch("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = workflowSchema.partial().extend({
      status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
    }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await WorkflowService.update(id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/:id", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await WorkflowService.delete(id, accountId);
    return reply.code(204).send();
  });

  // ── Steps ────────────────────────────────────────────────────────────────
  app.post("/:id/steps", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = stepSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const step = await WorkflowService.addStep(id, accountId, parsed.data);
    return reply.code(201).send({ step });
  });

  app.patch("/:id/steps/:stepId", { preHandler: auth }, async (request, reply) => {
    const { id, stepId } = request.params as { id: string; stepId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = stepSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await WorkflowService.updateStep(stepId, id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/:id/steps/:stepId", { preHandler: auth }, async (request, reply) => {
    const { id, stepId } = request.params as { id: string; stepId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await WorkflowService.deleteStep(stepId, id, accountId);
    return reply.code(204).send();
  });

  // ── Trigger & Runs ───────────────────────────────────────────────────────
  app.post("/:id/trigger", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = triggerSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const result = await WorkflowService.trigger(id, accountId, parsed.data);
    return reply.send(result);
  });

  app.get("/:id/runs", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { page = "1", pageSize = "25" } = request.query as any;
    return reply.send(await WorkflowService.listRuns(id, accountId, {
      page: Number(page), pageSize: Number(pageSize),
    }));
  });

  app.get("/:id/runs/:runId", { preHandler: auth }, async (request, reply) => {
    const { id, runId } = request.params as { id: string; runId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const run = await WorkflowService.getRun(runId, id, accountId);
    if (!run) return reply.code(404).send({ error: "Run not found" });
    return reply.send({ run });
  });
}
