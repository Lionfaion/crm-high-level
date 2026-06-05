import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@crm/db";
import { Role, isOneOf } from "../lib/roles.js";

/**
 * preHandler that ensures the authenticated user belongs to the account
 * referenced in the request params (:accountId) or body.
 * SUPER_ADMIN and AGENCY_ADMIN bypass this check.
 */
export async function tenantGuard(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.code(401).send({ error: "Unauthorized" });

  // Admins with broad scope skip tenant isolation
  if (isOneOf(user.role, [Role.SUPER_ADMIN, Role.AGENCY_ADMIN])) return;

  const accountId =
    (request.params as Record<string, string>)?.accountId ??
    (request.body as Record<string, string>)?.accountId;

  if (!accountId) return; // no tenant scope requested

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { accountId: true },
  });

  if (!dbUser || dbUser.accountId !== accountId) {
    return reply.code(403).send({ error: "Forbidden", message: "Not a member of this account" });
  }
}
