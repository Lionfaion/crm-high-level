import type { FastifyInstance } from "fastify";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import settingsRoutes from "./settings.js";

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes,    { prefix: "/v1/auth" });
  app.register(userRoutes,    { prefix: "/v1/users" });
  app.register(settingsRoutes, { prefix: "/v1/settings" });
}
