import type { FastifyInstance } from "fastify";
import { prisma } from "@crm/db";
import { Role } from "../lib/roles.js";
import { noteSchema, noteUpdateSchema } from "../schemas/note.js";

export default async function noteRoutes(app: FastifyInstance) {
  const auth = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];

  app.get("/", { preHandler: auth }, async (request, reply) => {
    const { contactId, opportunityId } = request.query as Record<string, string>;
    const notes = await prisma.note.findMany({
      where: {
        ...(contactId ? { contactId } : {}),
        ...(opportunityId ? { opportunityId } : {}),
      },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({ notes });
  });

  app.post("/", { preHandler: auth }, async (request, reply) => {
    const parsed = noteSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const note = await prisma.note.create({
      data: { ...parsed.data, authorId: request.user.sub },
      include: { author: { select: { id: true, name: true } } },
    });
    return reply.code(201).send({ note });
  });

  app.patch("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = noteUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const note = await prisma.note.updateMany({
      where: { id, authorId: request.user.sub },
      data: parsed.data,
    });
    if (note.count === 0) return reply.code(403).send({ error: "Cannot edit this note" });
    return reply.send({ ok: true });
  });

  app.delete("/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.note.deleteMany({ where: { id, authorId: request.user.sub } });
    return reply.code(204).send();
  });
}
