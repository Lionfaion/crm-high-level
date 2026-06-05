import { prisma } from "@crm/db";

export class ChatbotService {
  /** Find the best matching rule for an inbound message */
  static async matchRule(accountId: string, message: string) {
    const rules = await prisma.chatbotRule.findMany({
      where: { accountId, isActive: true },
      orderBy: { priority: "desc" },
    });

    const lower = message.toLowerCase();
    for (const rule of rules) {
      // Support exact keyword or comma-separated list
      const keywords = rule.trigger.split(",").map((k) => k.trim().toLowerCase());
      if (keywords.some((kw) => lower.includes(kw))) {
        return rule;
      }
    }
    return null;
  }

  static async list(accountId: string) {
    return prisma.chatbotRule.findMany({ where: { accountId }, orderBy: { priority: "desc" } });
  }

  static async create(accountId: string, data: { trigger: string; response: string; priority?: number }) {
    return prisma.chatbotRule.create({ data: { accountId, ...data } });
  }

  static async update(id: string, accountId: string, data: Partial<{ trigger: string; response: string; isActive: boolean; priority: number }>) {
    return prisma.chatbotRule.updateMany({ where: { id, accountId }, data });
  }

  static async delete(id: string, accountId: string) {
    return prisma.chatbotRule.deleteMany({ where: { id, accountId } });
  }
}
