import { prisma, type ActivityType } from "@crm/db";

export async function logActivity(params: {
  accountId: string;
  userId?: string;
  contactId?: string;
  opportunityId?: string;
  type: ActivityType;
  metadata?: Record<string, unknown>;
}) {
  try {
    return await prisma.activity.create({ data: params });
  } catch {
    // Never throw — activity logging must not break main flow
  }
}
