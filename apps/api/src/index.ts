import Fastify from "fastify";
import cors from "@fastify/cors";
import jwtPlugin from "./plugins/jwt.js";
import rbacPlugin from "./plugins/rbac.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";

const app = Fastify({ logger: true });

// ── Infrastructure plugins ──────────────────────────────────────────────────

app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000"],
  credentials: true,
});

app.register(jwtPlugin);
app.register(rbacPlugin);

// ── Routes ──────────────────────────────────────────────────────────────────

app.register(authRoutes, { prefix: "/auth" });
app.register(userRoutes, { prefix: "/users" });

// ── Health ──────────────────────────────────────────────────────────────────

app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

// ── Start ───────────────────────────────────────────────────────────────────

const port = Number(process.env.API_PORT ?? 3001);

app.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
