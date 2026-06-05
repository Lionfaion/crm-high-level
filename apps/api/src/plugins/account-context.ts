import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { prisma } from "@crm/db";
import { isOneOf, Role } from "../lib/roles.js";

declare module "fastify" {
  interface FastifyRequest {
    accountId?: string;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.addHook("preHandler", async (request) => {
    if (!request.user) return;

    const headerAccountId = request.headers["x-account-id"] as string | undefined;

    if (headerAccountId) {
      // Super/Agency admins can switch to any account
      if (isOneOf(request.user.role, [Role.SUPER_ADMIN, Role.AGENCY_ADMIN])) {
        request.accountId = headerAccountId;
        return;
      }
      // Others can only use their own account
      const dbUser = await prisma.user.findUnique({
        where: { id: request.user.sub },
        select: { accountId: true },
      });
      if (dbUser?.accountId === headerAccountId) {
        request.accountId = headerAccountId;
      }
      return;
    }

    // Fallback: use the account from the user's profile
    const dbUser = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { accountId: true },
    });
    request.accountId = dbUser?.accountId ?? undefined;
  });
});
