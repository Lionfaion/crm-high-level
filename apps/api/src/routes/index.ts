import type { FastifyInstance } from "fastify";
import authRoutes          from "./auth.js";
import userRoutes          from "./users.js";
import settingsRoutes      from "./settings.js";
import accountRoutes       from "./accounts.js";
import contactRoutes       from "./contacts.js";
import contactImportRoutes from "./contacts-import.js";
import pipelineRoutes      from "./pipelines.js";
import noteRoutes          from "./notes.js";
import searchRoutes        from "./search.js";

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes,          { prefix: "/v1/auth" });
  app.register(userRoutes,          { prefix: "/v1/users" });
  app.register(settingsRoutes,      { prefix: "/v1/settings" });
  app.register(accountRoutes,       { prefix: "/v1/accounts" });
  app.register(contactRoutes,       { prefix: "/v1/contacts" });
  app.register(contactImportRoutes, { prefix: "/v1/contacts" });
  app.register(pipelineRoutes,      { prefix: "/v1/pipelines" });
  app.register(noteRoutes,          { prefix: "/v1/notes" });
  app.register(searchRoutes,        { prefix: "/v1/search" });
}
