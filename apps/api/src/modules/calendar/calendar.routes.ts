import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { CalendarService } from "./calendar.service.js";

const appointmentTypeSchema = z.object({
  name:         z.string().min(1).max(200),
  description:  z.string().max(1000).optional(),
  duration:     z.number().int().min(5).max(480).default(30),
  color:        z.string().optional(),
  slug:         z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  bufferBefore: z.number().int().min(0).default(0),
  bufferAfter:  z.number().int().min(0).default(0),
  maxPerDay:    z.number().int().positive().optional(),
});

const appointmentSchema = z.object({
  appointmentTypeId: z.string().uuid(),
  contactId:         z.string().uuid().optional(),
  userId:            z.string().uuid().optional(),
  title:             z.string().min(1).max(300),
  startAt:           z.string().datetime(),
  endAt:             z.string().datetime(),
  notes:             z.string().max(2000).optional(),
  locationUrl:       z.string().url().optional().or(z.literal("")),
});

const settingsSchema = z.object({
  timezone:           z.string().optional(),
  workingHoursStart:  z.number().int().min(0).max(23).optional(),
  workingHoursEnd:    z.number().int().min(0).max(23).optional(),
  workingDays:        z.array(z.number().int().min(0).max(6)).optional(),
});

const listSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  from:     z.string().optional(),
  to:       z.string().optional(),
  status:   z.enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
});

export default async function calendarRoutes(app: FastifyInstance) {
  const auth      = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];
  const adminAuth = [app.authenticate, app.requireRole(Role.ACCOUNT_ADMIN)];

  // ── Settings ─────────────────────────────────────────────────────────────
  app.get("/settings", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ settings: await CalendarService.getSettings(accountId) });
  });

  app.put("/settings", { preHandler: adminAuth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = settingsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const settings = await CalendarService.upsertSettings(accountId, parsed.data);
    return reply.send({ settings });
  });

  // ── Appointment Types ────────────────────────────────────────────────────
  app.get("/types", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ types: await CalendarService.listTypes(accountId) });
  });

  app.post("/types", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = appointmentTypeSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const type = await CalendarService.createType(accountId, parsed.data);
    return reply.code(201).send({ type });
  });

  app.patch("/types/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = appointmentTypeSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await CalendarService.updateType(id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/types/:id", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await CalendarService.deleteType(id, accountId);
    return reply.code(204).send();
  });

  // ── Available Slots ──────────────────────────────────────────────────────
  app.get("/types/:id/slots", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { date } = request.query as { date?: string };
    if (!date) return reply.code(400).send({ error: "date query param required (YYYY-MM-DD)" });
    const slots = await CalendarService.getAvailableSlots(accountId, id, date);
    return reply.send({ slots });
  });

  // ── Appointments ─────────────────────────────────────────────────────────
  app.get("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = listSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    return reply.send(await CalendarService.list(accountId, parsed.data));
  });

  app.post("/", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = appointmentSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const data = {
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      endAt:   new Date(parsed.data.endAt),
    };
    const appointment = await CalendarService.create(accountId, data);
    return reply.code(201).send({ appointment });
  });

  app.get("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const appointment = await CalendarService.get(id, accountId);
    if (!appointment) return reply.code(404).send({ error: "Appointment not found" });
    return reply.send({ appointment });
  });

  app.patch("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = appointmentSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const data: any = { ...parsed.data };
    if (data.startAt) data.startAt = new Date(data.startAt);
    if (data.endAt)   data.endAt   = new Date(data.endAt);
    await CalendarService.update(id, accountId, data);
    return reply.send({ ok: true });
  });

  app.post("/:id/cancel", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { reason } = request.body as { reason?: string };
    await CalendarService.cancel(id, accountId, reason);
    return reply.send({ ok: true });
  });

  app.post("/:id/complete", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await CalendarService.complete(id, accountId);
    return reply.send({ ok: true });
  });
}
