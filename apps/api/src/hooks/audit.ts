import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";
import { prisma } from "@crm/db";

/**
 * onResponse hook that logs mutating requests to the Activity table.
 * Attach to routes that have request.user and request.body.accountId.
 */
export async function auditHook(
  request: FastifyRequest,
  _reply: FastifyReply,
  _done: HookHandlerDoneFunction,
) {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return;

  const user = (request as any).user;
  const body = request.body as Record<string, unknown> | null;
  const accountId = body?.accountId as string | undefined;

  if (!user?.sub || !accountId) return;

  try {
    await prisma.activity.create({
      data: {
        accountId,
        userId: user.sub,
        type: "CONTACT_UPDATED", // generic fallback — routes override via request.auditType
        metadata: {
          method,
          url: request.url,
          ip: request.ip,
        },
      },
    });
  } catch {
    // Audit failure must never break the main request
  }
}
