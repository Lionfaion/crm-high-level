import { prisma } from "@crm/db";
import type { ContactInput, ContactQuery } from "../schemas/contact.js";

export class ContactService {
  static async list(accountId: string, query: ContactQuery) {
    const { search, status, tag, page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { accountId };

    if (status) where.status = status;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName:  { contains: search, mode: "insensitive" } },
        { email:     { contains: search, mode: "insensitive" } },
        { phone:     { contains: search, mode: "insensitive" } },
        { company:   { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          phone: true, company: true, status: true, tags: true, createdAt: true,
        },
      }),
    ]);

    return { contacts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  static async create(accountId: string, data: ContactInput) {
    return prisma.contact.create({ data: { accountId, ...data } });
  }

  static async get(id: string, accountId: string) {
    return prisma.contact.findFirst({
      where: { id, accountId },
      include: {
        notes:         { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true } } } },
        activities:    { orderBy: { createdAt: "desc" }, take: 20 },
        opportunities: { include: { stage: { include: { pipeline: true } } } },
      },
    });
  }

  static async update(id: string, accountId: string, data: Partial<ContactInput>) {
    return prisma.contact.updateMany({ where: { id, accountId }, data });
  }

  static async delete(id: string, accountId: string) {
    return prisma.contact.deleteMany({ where: { id, accountId } });
  }
}
