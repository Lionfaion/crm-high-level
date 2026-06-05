import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { ChatbotService } from "./chatbot.service.js";
import { ConversationService } from "./conversation.service.js";
import { emitMessage } from "./realtime.js";

const ruleSchema = z.object({
  trigger:  z.string().min(1).max(500),
  response: z.string().min(1).max(2000),
  priority: z.number().int().default(0),
});

// Public endpoint: chat widget sends messages here
const widgetMessageSchema = z.object({
  accountId:  z.string().uuid(),
  contactId:  z.string().uuid(),
  message:    z.string().min(1).max(2000),
  visitorId:  z.string().optional(),
});

export default async function chatbotRoutes(app: FastifyInstance) {
  const auth = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];

  // ── Rules management ──────────────────────────────────────────────────────
  app.get("/rules", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ rules: await ChatbotService.list(accountId) });
  });

  app.post("/rules", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = ruleSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const rule = await ChatbotService.create(accountId, parsed.data);
    return reply.code(201).send({ rule });
  });

  app.patch("/rules/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = ruleSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await ChatbotService.update(id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/rules/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await ChatbotService.delete(id, accountId);
    return reply.code(204).send();
  });

  // ── Public widget message endpoint ─────────────────────────────────────────
  app.post("/widget/message", async (request, reply) => {
    const parsed = widgetMessageSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid payload" });

    const { accountId, contactId, message } = parsed.data;

    const conv = await ConversationService.findOrCreate({ accountId, contactId, channel: "CHAT" });
    const inboundMsg = await ConversationService.addMessage(conv.id, { direction: "INBOUND", body: message });

    emitMessage(conv.id, accountId, inboundMsg);

    // Check chatbot rules
    const rule = await ChatbotService.matchRule(accountId, message);
    if (rule) {
      const botReply = await ConversationService.addMessage(conv.id, { direction: "OUTBOUND", body: rule.response });
      emitMessage(conv.id, accountId, botReply);
      return reply.send({ message: inboundMsg, botReply });
    }

    return reply.send({ message: inboundMsg, botReply: null });
  });
}
