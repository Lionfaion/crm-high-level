import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { hasRole, isOneOf, Role } from "../lib/roles.js";
import { can, type Action, type Resource } from "../lib/permissions.js";

declare module "fastify" {
  interface FastifyInstance {
    /**
     * preHandler that requires the JWT user to have AT LEAST `minRole`.
     * Must be used after `authenticate`.
     */
    requireRole(minRole: Role): (req: FastifyRequest, reply: FastifyReply) => Promise<void>;

    /**
     * preHandler that requires the JWT user to be one of the listed roles.
     */
    requireOneOf(roles: Role[]): (req: FastifyRequest, reply: FastifyReply) => Promise<void>;

    /**
     * preHandler that checks a resource+action against the permission matrix.
     */
    requirePermission(
      resource: Resource,
      action: Action,
    ): (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.decorate(
    "requireRole",
    (minRole: Role) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        const role = request.user?.role;
        if (!role || !hasRole(role, minRole)) {
          return reply.code(403).send({
            error: "Forbidden",
            message: `Requires at least role: ${minRole}`,
          });
        }
      },
  );

  app.decorate(
    "requireOneOf",
    (roles: Role[]) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        const role = request.user?.role;
        if (!role || !isOneOf(role, roles)) {
          return reply.code(403).send({
            error: "Forbidden",
            message: `Requires one of: ${roles.join(", ")}`,
          });
        }
      },
  );

  app.decorate(
    "requirePermission",
    (resource: Resource, action: Action) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        const role = request.user?.role;
        if (!role || !can(role, action, resource)) {
          return reply.code(403).send({
            error: "Forbidden",
            message: `Not allowed to ${action} ${resource}`,
          });
        }
      },
  );
});
