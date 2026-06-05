import type { FastifyInstance } from "fastify";
import { prisma } from "@crm/db";
import { Role } from "../lib/roles.js";
import { tenantGuard } from "../hooks/tenant.js";
import { accountSettingsSchema } from "../schemas/settings.js";

export default async function settingsRoutes(app: FastifyInstance) {
  // GET /settings/accounts/:accountId
  app.get(
    "/accounts/:accountId",
    {
      preHandler: [
        app.authenticate,
        app.requireRole(Role.ACCOUNT_USER),
        tenantGuard,
      ],
    },
    async (request, reply) => {
      const { accountId } = request.params as { accountId: string };

      const settings = await prisma.accountSettings.findUnique({
        where: { accountId },
      });

      if (!settings) {
        // Return defaults if not yet configured
        const account = await prisma.account.findUnique({
          where: { id: accountId },
          select: { name: true, email: true, phone: true, timezone: true },
        });
        if (!account) return reply.code(404).send({ error: "Account not found" });
        return reply.send({ settings: { accountId, businessName: account.name, supportEmail: account.email, supportPhone: account.phone, timezone: account.timezone } });
      }

      return reply.send({ settings });
    },
  );

  // PUT /settings/accounts/:accountId  — upsert
  app.put(
    "/accounts/:accountId",
    {
      preHandler: [
        app.authenticate,
        app.requirePermission("account", "update"),
        tenantGuard,
      ],
    },
    async (request, reply) => {
      const { accountId } = request.params as { accountId: string };

      const result = accountSettingsSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({ error: "Validation failed", details: result.error.flatten() });
      }

      const settings = await prisma.accountSettings.upsert({
        where: { accountId },
        update: result.data,
        create: { accountId, ...result.data },
      });

      // Sync businessName back to Account.name if provided
      if (result.data.businessName) {
        await prisma.account.update({
          where: { id: accountId },
          data: { name: result.data.businessName },
        });
      }

      return reply.send({ settings });
    },
  );

  // PATCH /settings/accounts/:accountId  — partial update
  app.patch(
    "/accounts/:accountId",
    {
      preHandler: [
        app.authenticate,
        app.requirePermission("account", "update"),
        tenantGuard,
      ],
    },
    async (request, reply) => {
      const { accountId } = request.params as { accountId: string };

      const result = accountSettingsSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({ error: "Validation failed", details: result.error.flatten() });
      }

      const settings = await prisma.accountSettings.upsert({
        where: { accountId },
        update: result.data,
        create: { accountId, ...result.data },
      });

      return reply.send({ settings });
    },
  );

  // GET /settings/timezones  — helper list
  app.get("/timezones", async (_request, reply) => {
    const zones = Intl.supportedValuesOf("timeZone");
    return reply.send({ timezones: zones });
  });
}
