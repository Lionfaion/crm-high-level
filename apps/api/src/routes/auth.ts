import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "@crm/db";
import { registerSchema, loginSchema } from "../schemas/auth.js";
import { authRateLimit } from "../plugins/rate-limit.js";

export default async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post("/register", { ...authRateLimit }, async (request, reply) => {
    const result = registerSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ error: "Validation failed", details: result.error.flatten() });
    }

    const { name, email, password, agencyId, accountId } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, agencyId, accountId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });

    return reply.code(201).send({ user, token });
  });

  // POST /auth/login
  app.post("/login", { ...authRateLimit }, async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ error: "Validation failed", details: result.error.flatten() });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });

    return reply.send({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  });

  // GET /auth/me  (protected)
  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { id: true, name: true, email: true, role: true, agencyId: true, accountId: true, createdAt: true },
    });

    if (!user) return reply.code(404).send({ error: "User not found" });

    return reply.send({ user });
  });

  // POST /auth/refresh  (protected — returns new token)
  app.post("/refresh", { preHandler: [app.authenticate] }, async (request, reply) => {
    const token = app.jwt.sign({
      sub: request.user.sub,
      email: request.user.email,
      role: request.user.role,
    });
    return reply.send({ token });
  });
}
