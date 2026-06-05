import Fastify from "fastify";
import cors from "@fastify/cors";
import helmetPlugin from "./plugins/helmet.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import jwtPlugin from "./plugins/jwt.js";
import rbacPlugin from "./plugins/rbac.js";
import requestContextPlugin from "./plugins/request-context.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import accountContextPlugin from "./plugins/account-context.js";
import { registerRoutes } from "./routes/index.js";
import systemRoutes from "./routes/system.js";

const isDev = process.env.NODE_ENV !== "production";

const app = Fastify({
  logger: {
    level: isDev ? "debug" : "info",
    ...(isDev && {
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss" },
      },
    }),
  },
  requestIdHeader: "x-request-id",
  genReqId: () => crypto.randomUUID(),
  trustProxy: true,
});

// ── Security ─────────────────────────────────────────────────────────────────

app.register(helmetPlugin);
app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
});

// ── Rate limiting ─────────────────────────────────────────────────────────────

app.register(rateLimitPlugin);

// ── Context & error handling ──────────────────────────────────────────────────

app.register(requestContextPlugin);
app.register(errorHandlerPlugin);

// ── Auth & RBAC ───────────────────────────────────────────────────────────────

app.register(jwtPlugin);
app.register(rbacPlugin);
app.register(accountContextPlugin);

// ── Routes ────────────────────────────────────────────────────────────────────

app.register(systemRoutes);
app.register(registerRoutes);

// ── Start & graceful shutdown ─────────────────────────────────────────────────

const port = Number(process.env.API_PORT ?? 3001);

async function start() {
  try {
    await app.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  app.log.info(`Received ${signal} — shutting down gracefully`);
  await app.close();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

start();
