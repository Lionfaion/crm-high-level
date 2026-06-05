import { prisma, type Channel, type MessageDirection } from "@crm/db";

export class ConversationService {
  static async list(accountId: string, opts: { channel?: string; status?: string; page: number; pageSize: number }) {
    const where: any = { accountId };
    if (opts.channel) where.channel = opts.channel;
    if (opts.status)  where.status  = opts.status;

    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          messages: { orderBy: { sentAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { conversations, total, page: opts.page, pageSize: opts.pageSize };
  }

  static async get(id: string, accountId: string) {
    return prisma.conversation.findFirst({
      where: { id, accountId },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        messages: { orderBy: { sentAt: "asc" } },
      },
    });
  }

  static async findOrCreate(params: { accountId: string; contactId: string; channel: Channel; subject?: string }) {
    const existing = await prisma.conversation.findFirst({
      where: { accountId: params.accountId, contactId: params.contactId, channel: params.channel, status: "OPEN" },
    });
    if (existing) return existing;
    return prisma.conversation.create({ data: params });
  }

  static async addMessage(conversationId: string, params: {
    direction: MessageDirection;
    body: string;
    html?: string;
    subject?: string;
    fromAddress?: string;
    toAddress?: string;
    externalId?: string;
  }) {
    const [message] = await Promise.all([
      prisma.message.create({ data: { conversationId, ...params } }),
      prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    ]);
    return message;
  }

  static async close(id: string, accountId: string) {
    return prisma.conversation.updateMany({ where: { id, accountId }, data: { status: "CLOSED" } });
  }

  static async reopen(id: string, accountId: string) {
    return prisma.conversation.updateMany({ where: { id, accountId }, data: { status: "OPEN" } });
  }
}
