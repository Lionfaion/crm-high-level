import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

export default fp(async (app: FastifyInstance) => {
  // Global default: 200 req / minute
  app.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
    errorResponseBuilder: (_request, context) => ({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again in ${context.after}.`,
      statusCode: 429,
    }),
  });
});

/** Stricter limiter for auth endpoints (10 req / minute) */
export const authRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
};
