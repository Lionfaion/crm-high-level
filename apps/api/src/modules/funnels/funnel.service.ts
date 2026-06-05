import { prisma } from "@crm/db";

export class FunnelService {
  static async list(accountId: string) {
    return prisma.funnel.findMany({
      where: { accountId },
      include: { _count: { select: { pages: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async get(id: string, accountId: string) {
    return prisma.funnel.findFirst({
      where: { id, accountId },
      include: { pages: { orderBy: { position: "asc" } } },
    });
  }

  static async create(accountId: string, data: { name: string; description?: string; domain?: string }) {
    return prisma.funnel.create({ data: { accountId, ...data } });
  }

  static async update(id: string, accountId: string, data: Partial<{
    name: string; description: string; isActive: boolean; domain: string;
  }>) {
    return prisma.funnel.updateMany({ where: { id, accountId }, data });
  }

  static async delete(id: string, accountId: string) {
    return prisma.funnel.deleteMany({ where: { id, accountId } });
  }

  // ── Pages ──────────────────────────────────────────────────────────────────

  static async addPage(funnelId: string, accountId: string, data: {
    name: string; slug: string; content?: object; position?: number;
  }) {
    const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, accountId } });
    if (!funnel) throw new Error("Funnel not found");

    const maxPos = await prisma.funnelPage.aggregate({
      where: { funnelId },
      _max: { position: true },
    });
    const position = data.position ?? (maxPos._max.position ?? -1) + 1;

    return prisma.funnelPage.create({
      data: {
        funnelId,
        name:     data.name,
        slug:     data.slug,
        content:  data.content ?? {},
        position,
      },
    });
  }

  static async updatePage(pageId: string, funnelId: string, accountId: string, data: Partial<{
    name: string; slug: string; content: object; isEnabled: boolean; position: number;
  }>) {
    const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, accountId } });
    if (!funnel) throw new Error("Funnel not found");
    return prisma.funnelPage.updateMany({ where: { id: pageId, funnelId }, data: data as any });
  }

  static async deletePage(pageId: string, funnelId: string, accountId: string) {
    const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, accountId } });
    if (!funnel) throw new Error("Funnel not found");
    return prisma.funnelPage.deleteMany({ where: { id: pageId, funnelId } });
  }

  /** Record a page view or conversion */
  static async recordEvent(pageId: string, event: "view" | "conversion") {
    const data = event === "view"
      ? { views: { increment: 1 } }
      : { conversions: { increment: 1 } };
    return prisma.funnelPage.update({ where: { id: pageId }, data });
  }
}
