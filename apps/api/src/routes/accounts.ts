import type { FastifyInstance } from "fastify";
import { prisma } from "@crm/db";
import { Role } from "../lib/roles.js";
import { z } from "zod";

const createAccountSchema = z.object({
  name:     z.string().min(1).max(200),
  email:    z.string().email(),
  phone:    z.string().optional(),
  website:  z.string().url().optional().or(z.literal("")),
  timezone: z.string().optional(),
});

export default async function accountRoutes(app: FastifyInstance) {
  // GET /accounts — list accounts accessible to the user
  app.get("/", { preHandler: [app.authenticate, app.requireRole(Role.AGENCY_USER)] },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.sub },
        select: { agencyId: true, accountId: true, role: true },
      });
      if (!user) return reply.code(404).send({ error: "User not found" });

      const isBroadRole = [Role.SUPER_ADMIN as string, Role.AGENCY_ADMIN as string, Role.AGENCY_USER as string].includes(user.role);
      const accounts = await prisma.account.findMany({
        where: isBroadRole && user.agencyId
          ? { agencyId: user.agencyId }
          : { id: user.accountId ?? "" },
        select: { id: true, name: true, email: true, phone: true, timezone: true, createdAt: true },
        orderBy: { name: "asc" },
      });
      return reply.send({ accounts });
    },
  );

  // POST /accounts — AGENCY_ADMIN+ creates sub-account
  app.post("/", { preHandler: [app.authenticate, app.requireRole(Role.AGENCY_ADMIN)] },
    async (request, reply) => {
      const parsed = createAccountSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });

      const user = await prisma.user.findUnique({ where: { id: request.user.sub }, select: { agencyId: true } });
      if (!user?.agencyId) return reply.code(400).send({ error: "No agency associated" });

      const account = await prisma.account.create({
        data: { agencyId: user.agencyId, ...parsed.data },
      });
      return reply.code(201).send({ account });
    },
  );

  // GET /accounts/:id
  app.get("/:id", { preHandler: [app.authenticate, app.requireRole(Role.ACCOUNT_USER)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const account = await prisma.account.findUnique({
        where: { id },
        include: { settings: true },
      });
      if (!account) return reply.code(404).send({ error: "Account not found" });
      return reply.send({ account });
    },
  );
}
