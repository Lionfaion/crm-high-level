import type { FastifyInstance } from "fastify";
import { prisma } from "@crm/db";
import { z } from "zod";
import { Role } from "../lib/roles.js";
import { tenantGuard } from "../hooks/tenant.js";

const updateRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export default async function userRoutes(app: FastifyInstance) {
  // GET /users/me — any authenticated user
  app.get(
    "/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.sub },
        select: {
          id: true, name: true, email: true, role: true,
          agencyId: true, accountId: true, createdAt: true,
        },
      });
      if (!user) return reply.code(404).send({ error: "User not found" });
      return reply.send({ user });
    },
  );

  // GET /users — AGENCY_USER+ can list users in their account
  app.get(
    "/",
    {
      preHandler: [
        app.authenticate,
        app.requireRole(Role.AGENCY_USER),
        tenantGuard,
      ],
    },
    async (request, reply) => {
      const { accountId } = request.query as { accountId?: string };
      const users = await prisma.user.findMany({
        where: accountId ? { accountId } : undefined,
        select: {
          id: true, name: true, email: true, role: true,
          agencyId: true, accountId: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return reply.send({ users });
    },
  );

  // PATCH /users/:id/role — ACCOUNT_ADMIN+ can change roles
  app.patch(
    "/:id/role",
    {
      preHandler: [
        app.authenticate,
        app.requirePermission("user", "update"),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = updateRoleSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({ error: "Validation failed", details: result.error.flatten() });
      }

      // ACCOUNT_ADMIN cannot elevate to AGENCY or SUPER roles
      const actorRole = request.user.role as Role;
      if (
        actorRole === Role.ACCOUNT_ADMIN &&
        [Role.SUPER_ADMIN, Role.AGENCY_ADMIN, Role.AGENCY_USER].includes(result.data.role)
      ) {
        return reply.code(403).send({ error: "Cannot assign roles above your own scope" });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role: result.data.role },
        select: { id: true, name: true, email: true, role: true },
      });

      return reply.send({ user: updated });
    },
  );

  // DELETE /users/:id — ACCOUNT_ADMIN+
  app.delete(
    "/:id",
    {
      preHandler: [
        app.authenticate,
        app.requirePermission("user", "delete"),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      if (id === request.user.sub) {
        return reply.code(400).send({ error: "Cannot delete your own account" });
      }
      await prisma.user.delete({ where: { id } });
      return reply.code(204).send();
    },
  );
}
