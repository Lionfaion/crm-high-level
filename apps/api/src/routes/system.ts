import type { FastifyInstance } from "fastify";

const startTime = Date.now();

export default async function systemRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version ?? "0.1.0",
    environment: process.env.NODE_ENV ?? "development",
  }));

  app.get("/", async () => ({
    name: "CRM High Level API",
    version: "v1",
    docs: "/health",
    endpoints: {
      auth: [
        "POST /v1/auth/register",
        "POST /v1/auth/login",
        "GET  /v1/auth/me",
        "POST /v1/auth/refresh",
      ],
      users: [
        "GET    /v1/users/me",
        "GET    /v1/users",
        "PATCH  /v1/users/:id/role",
        "DELETE /v1/users/:id",
      ],
    },
  }));
}
