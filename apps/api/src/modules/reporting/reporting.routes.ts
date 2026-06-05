import type { FastifyInstance } from "fastify";
import { Role } from "../../lib/roles.js";
import { ReportingService } from "./reporting.service.js";

export default async function reportingRoutes(app: FastifyInstance) {
  const auth = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];

  app.get("/dashboard", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send(await ReportingService.getDashboardStats(accountId));
  });

  app.get("/contacts/growth", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { days = "30" } = request.query as { days?: string };
    return reply.send({ data: await ReportingService.getContactGrowth(accountId, Number(days)) });
  });

  app.get("/pipeline/funnel", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ data: await ReportingService.getPipelineFunnel(accountId) });
  });

  app.get("/campaigns", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ data: await ReportingService.getCampaignStats(accountId) });
  });

  app.get("/revenue", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ data: await ReportingService.getRevenueByMonth(accountId) });
  });

  app.get("/appointments", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send(await ReportingService.getAppointmentStats(accountId));
  });

  app.get("/contacts/export.csv", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const csv = await ReportingService.exportContactsCsv(accountId);
    return reply
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", "attachment; filename=contacts.csv")
      .send(csv);
  });
}
