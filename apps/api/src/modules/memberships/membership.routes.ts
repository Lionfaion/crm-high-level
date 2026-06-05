import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { MembershipService } from "./membership.service.js";

const courseSchema = z.object({
  title:       z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  slug:        z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  imageUrl:    z.string().url().optional().or(z.literal("")),
  price:       z.number().int().min(0).default(0),
});

const sectionSchema = z.object({
  title:    z.string().min(1).max(300),
  position: z.number().int().optional(),
});

const lessonSchema = z.object({
  title:     z.string().min(1).max(300),
  content:   z.string().optional(),
  videoUrl:  z.string().url().optional().or(z.literal("")),
  fileUrl:   z.string().url().optional().or(z.literal("")),
  duration:  z.number().int().positive().optional(),
  isPreview: z.boolean().default(false),
  dripDays:  z.number().int().min(0).default(0),
  position:  z.number().int().optional(),
});

export default async function membershipRoutes(app: FastifyInstance) {
  const auth      = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];
  const adminAuth = [app.authenticate, app.requireRole(Role.ACCOUNT_ADMIN)];

  // ── Courses ───────────────────────────────────────────────────────────────
  app.get("/courses", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ courses: await MembershipService.listCourses(accountId) });
  });

  app.post("/courses", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = courseSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const course = await MembershipService.createCourse(accountId, parsed.data);
    return reply.code(201).send({ course });
  });

  app.get("/courses/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const course = await MembershipService.getCourse(id, accountId);
    if (!course) return reply.code(404).send({ error: "Course not found" });
    return reply.send({ course });
  });

  app.patch("/courses/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = courseSchema.partial().extend({ isPublished: z.boolean().optional() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await MembershipService.updateCourse(id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/courses/:id", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await MembershipService.deleteCourse(id, accountId);
    return reply.code(204).send();
  });

  // ── Sections ──────────────────────────────────────────────────────────────
  app.post("/courses/:id/sections", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = sectionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const section = await MembershipService.addSection(id, accountId, parsed.data);
    return reply.code(201).send({ section });
  });

  app.patch("/courses/:id/sections/:sectionId", { preHandler: auth }, async (request, reply) => {
    const { id, sectionId } = request.params as { id: string; sectionId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = sectionSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await MembershipService.updateSection(sectionId, id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/courses/:id/sections/:sectionId", { preHandler: auth }, async (request, reply) => {
    const { id, sectionId } = request.params as { id: string; sectionId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await MembershipService.deleteSection(sectionId, id, accountId);
    return reply.code(204).send();
  });

  // ── Lessons ───────────────────────────────────────────────────────────────
  app.post("/courses/:id/sections/:sectionId/lessons", { preHandler: auth }, async (request, reply) => {
    const { id, sectionId } = request.params as { id: string; sectionId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = lessonSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const lesson = await MembershipService.addLesson(sectionId, id, accountId, parsed.data);
    return reply.code(201).send({ lesson });
  });

  app.patch("/courses/:id/sections/:sectionId/lessons/:lessonId", { preHandler: auth }, async (request, reply) => {
    const { sectionId, lessonId } = request.params as { id: string; sectionId: string; lessonId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = lessonSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await MembershipService.updateLesson(lessonId, sectionId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/courses/:id/sections/:sectionId/lessons/:lessonId", { preHandler: auth }, async (request, reply) => {
    const { sectionId, lessonId } = request.params as { id: string; sectionId: string; lessonId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await MembershipService.deleteLesson(lessonId, sectionId);
    return reply.code(204).send();
  });

  // ── Enrollments ───────────────────────────────────────────────────────────
  app.get("/courses/:id/enrollments", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { page = "1", pageSize = "25" } = request.query as any;
    return reply.send(await MembershipService.listEnrollments(id, accountId, {
      page: Number(page), pageSize: Number(pageSize),
    }));
  });

  app.post("/courses/:id/enroll", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { contactId, expiresAt } = request.body as { contactId?: string; expiresAt?: string };
    if (!contactId) return reply.code(400).send({ error: "contactId required" });
    const enrollment = await MembershipService.enroll(id, accountId, contactId, expiresAt ? new Date(expiresAt) : undefined);
    return reply.code(201).send({ enrollment });
  });

  app.delete("/courses/:id/enroll/:contactId", { preHandler: auth }, async (request, reply) => {
    const { id, contactId } = request.params as { id: string; contactId: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await MembershipService.unenroll(id, accountId, contactId);
    return reply.code(204).send();
  });

  app.post("/enrollments/:enrollmentId/lessons/:lessonId/complete", async (request, reply) => {
    const { enrollmentId, lessonId } = request.params as { enrollmentId: string; lessonId: string };
    await MembershipService.markLessonComplete(enrollmentId, lessonId);
    return reply.send({ ok: true });
  });
}
