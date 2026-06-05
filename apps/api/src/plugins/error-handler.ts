import fp from "fastify-plugin";
import type { FastifyInstance, FastifyError } from "fastify";
import { ZodError } from "zod";

export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    const log = app.log;

    // Zod validation errors
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "Validation Error",
        statusCode: 400,
        details: error.flatten(),
      });
    }

    // Fastify errors (includes @fastify/jwt errors)
    const statusCode = (error as FastifyError).statusCode ?? 500;

    if (statusCode === 401) {
      return reply.code(401).send({ error: "Unauthorized", statusCode: 401 });
    }

    if (statusCode === 403) {
      return reply.code(403).send({
        error: "Forbidden",
        message: error.message,
        statusCode: 403,
      });
    }

    if (statusCode === 404) {
      return reply.code(404).send({
        error: "Not Found",
        message: error.message,
        statusCode: 404,
      });
    }

    if (statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({
        error: error.message,
        statusCode,
      });
    }

    // 5xx — log and hide internals from client
    log.error({ err: error, reqId: request.id }, "Internal server error");
    return reply.code(500).send({
      error: "Internal Server Error",
      statusCode: 500,
      requestId: request.id,
    });
  });

  // 404 for unknown routes
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: "Not Found",
      message: `Route ${request.method} ${request.url} not found`,
      statusCode: 404,
    });
  });
});
