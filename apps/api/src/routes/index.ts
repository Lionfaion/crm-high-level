import type { FastifyInstance } from "fastify";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";

/**
 * Registers all application routes under their versioned prefix.
 * Add new route modules here.
 */
export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: "/v1/auth" });
  app.register(userRoutes, { prefix: "/v1/users" });
}
