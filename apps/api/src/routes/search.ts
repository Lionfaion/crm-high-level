import type { FastifyInstance } from "fastify";
import { prisma } from "@crm/db";
import { Role } from "../lib/roles.js";
import { z } from "zod";

const searchSchema = z.object({
  q:         z.string().min(1).max(200),
  types:     z.string().optional(), // "contacts,opportunities,notes"
  tag:       z.string().optional(),
  status:    z.string().optional(),
  from:      z.string().datetime().optional(),
  to:        z.string().datetime().optional(),
  page:      z.coerce.number().min(1).default(1),
  pageSize:  z.coerce.number().min(1).max(50).default(20),
});

export default async function searchRoutes(app: FastifyInstance) {
  app.get("/", {
    preHandler: [app.authenticate, app.requireRole(Role.ACCOUNT_USER)],
  }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });

    const parsed = searchSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query", details: parsed.error.flatten() });

    const { q, types, tag, status, from, to, page, pageSize } = parsed.data;
    const typeList = types ? types.split(",") : ["contacts", "opportunities"];
    const skip = (page - 1) * pageSize;
    const dateFilter = from || to ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to)   } : {}),
      },
    } : {};

    const results: Record<string, unknown[]> = {};

    if (typeList.includes("contacts")) {
      results.contacts = await prisma.contact.findMany({
        where: {
          accountId,
          ...(tag ? { tags: { has: tag } } : {}),
          ...(status ? { status: status as any } : {}),
          ...dateFilter,
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName:  { contains: q, mode: "insensitive" } },
            { email:     { contains: q, mode: "insensitive" } },
            { company:   { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true, company: true, status: true, tags: true },
        take: pageSize, skip,
      });
    }

    if (typeList.includes("opportunities")) {
      results.opportunities = await prisma.opportunity.findMany({
        where: {
          contact: { accountId },
          ...(status ? { status: status as any } : {}),
          ...dateFilter,
          name: { contains: q, mode: "insensitive" },
        },
        include: { stage: { select: { name: true, pipeline: { select: { name: true } } } }, contact: { select: { firstName: true, lastName: true } } },
        take: pageSize, skip,
      });
    }

    if (typeList.includes("notes")) {
      results.notes = await prisma.note.findMany({
        where: {
          body: { contains: q, mode: "insensitive" },
          ...dateFilter,
          contact: { accountId },
        },
        include: { author: { select: { name: true } }, contact: { select: { firstName: true, lastName: true } } },
        take: pageSize, skip,
      });
    }

    return reply.send({ query: q, results });
  });
}
