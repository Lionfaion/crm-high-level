import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { ConversationService } from "./conversation.service.js";
import { emailService } from "./email.service.js";
import { smsService } from "./sms.service.js";

const sendEmailSchema = z.object({
  to:          z.string().email(),
  subject:     z.string().min(1),
  html:        z.string().min(1),
  contactId:   z.string().uuid().optional(),
  fromName:    z.string().optional(),
});

const sendSmsSchema = z.object({
  to:        z.string().min(7),
  body:      z.string().min(1).max(1600),
  contactId: z.string().uuid().optional(),
});

const listConvSchema = z.object({
  channel:  z.enum(["EMAIL","SMS","CHAT"]).optional(),
  status:   z.enum(["OPEN","CLOSED","ARCHIVED"]).optional(),
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

const replySchema = z.object({ body: z.string().min(1), html: z.string().optional() });

export default async function messagingRoutes(app: FastifyInstance) {
  const auth = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];

  // ── Send email ────────────────────────────────────────────────────────────
  app.post("/email/send", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const parsed = sendEmailSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    await emailService.send({ to: parsed.data.to, subject: parsed.data.subject, html: parsed.data.html, fromName: parsed.data.fromName });

    if (parsed.data.contactId) {
      const conv = await ConversationService.findOrCreate({
        accountId, contactId: parsed.data.contactId, channel: "EMAIL", subject: parsed.data.subject,
      });
      await ConversationService.addMessage(conv.id, {
        direction: "OUTBOUND", body: parsed.data.html, subject: parsed.data.subject, toAddress: parsed.data.to,
      });
    }

    return reply.send({ ok: true });
  });

  // ── Send SMS ──────────────────────────────────────────────────────────────
  app.post("/sms/send", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const parsed = sendSmsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const sid = await smsService.send(parsed.data.to, parsed.data.body);

    if (parsed.data.contactId) {
      const conv = await ConversationService.findOrCreate({
        accountId, contactId: parsed.data.contactId, channel: "SMS",
      });
      await ConversationService.addMessage(conv.id, {
        direction: "OUTBOUND", body: parsed.data.body, toAddress: parsed.data.to, externalId: sid ?? undefined,
      });
    }

    return reply.send({ ok: true, sid });
  });

  // ── Conversations inbox ───────────────────────────────────────────────────
  app.get("/conversations", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const parsed = listConvSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });

    const result = await ConversationService.list(accountId, parsed.data);
    return reply.send(result);
  });

  app.get("/conversations/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const conversation = await ConversationService.get(id, accountId);
    if (!conversation) return reply.code(404).send({ error: "Conversation not found" });
    return reply.send({ conversation });
  });

  app.post("/conversations/:id/reply", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const parsed = replySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const conv = await ConversationService.get(id, accountId);
    if (!conv) return reply.code(404).send({ error: "Conversation not found" });

    if (conv.channel === "EMAIL" && conv.contact.email) {
      await emailService.send({ to: conv.contact.email, subject: `Re: ${conv.subject ?? ""}`, html: parsed.data.html ?? parsed.data.body });
    } else if (conv.channel === "SMS" && conv.contact.phone) {
      await smsService.send(conv.contact.phone, parsed.data.body);
    }

    const message = await ConversationService.addMessage(id, { direction: "OUTBOUND", body: parsed.data.body, html: parsed.data.html });
    return reply.send({ message });
  });

  app.post("/conversations/:id/close", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await ConversationService.close(id, accountId);
    return reply.send({ ok: true });
  });

  // ── Twilio webhook (inbound SMS) ──────────────────────────────────────────
  app.post("/webhooks/twilio/sms", async (request, reply) => {
    const body = request.body as Record<string, string>;
    const from = body.From;
    const text = body.Body;

    if (!from || !text) return reply.code(400).send("Invalid webhook payload");

    // Find contact by phone number across all accounts (simplified)
    const contact = await (await import("@crm/db")).prisma.contact.findFirst({
      where: { phone: from },
      select: { id: true, accountId: true },
    });

    if (contact) {
      const conv = await ConversationService.findOrCreate({
        accountId: contact.accountId, contactId: contact.id, channel: "SMS",
      });
      await ConversationService.addMessage(conv.id, { direction: "INBOUND", body: text, fromAddress: from });
    }

    reply.header("Content-Type", "text/xml").send(`<?xml version="1.0"?><Response></Response>`);
  });
}
