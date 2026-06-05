import fp from "fastify-plugin";
import { fastifyRequestContext } from "@fastify/request-context";
import type { FastifyInstance } from "fastify";

declare module "@fastify/request-context" {
  interface RequestContextData {
    requestId: string;
    userId?: string;
    userRole?: string;
    accountId?: string;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.register(fastifyRequestContext);

  app.addHook("onRequest", async (request) => {
    request.requestContext.set("requestId", request.id as string);
  });

  // After JWT verification, populate user context
  app.addHook("preHandler", async (request) => {
    if (request.user) {
      request.requestContext.set("userId", request.user.sub);
      request.requestContext.set("userRole", request.user.role);
    }
  });
});
