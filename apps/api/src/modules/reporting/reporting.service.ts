import { prisma } from "@crm/db";

export class ReportingService {
  /** Overall dashboard KPIs */
  static async getDashboardStats(accountId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalContacts,
      newContactsThisMonth,
      openOpportunities,
      wonOpportunitiesValue,
      sentCampaigns,
      openConversations,
      scheduledAppointments,
      totalRevenue,
      averageRating,
    ] = await Promise.all([
      prisma.contact.count({ where: { accountId } }),
      prisma.contact.count({ where: { accountId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.opportunity.count({ where: { stage: { pipeline: { accountId } }, status: "OPEN" } }),
      prisma.opportunity.aggregate({
        where: { stage: { pipeline: { accountId } }, status: "WON" },
        _sum: { value: true },
      }),
      prisma.campaign.count({ where: { accountId, status: "SENT" } }),
      prisma.conversation.count({ where: { accountId, status: "OPEN" } }),
      prisma.appointment.count({ where: { accountId, status: { in: ["SCHEDULED", "CONFIRMED"] } } }),
      prisma.payment.aggregate({
        where: { accountId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.review.aggregate({
        where: { accountId, status: { not: "HIDDEN" } },
        _avg: { rating: true },
      }),
    ]);

    return {
      contacts: { total: totalContacts, newThisMonth: newContactsThisMonth },
      pipeline: {
        openOpportunities,
        wonValue: wonOpportunitiesValue._sum.value ?? 0,
      },
      messaging: { sentCampaigns, openConversations },
      calendar:  { scheduledAppointments },
      payments:  { totalRevenue: totalRevenue._sum.amount ?? 0 },
      reputation: { averageRating: Math.round((averageRating._avg.rating ?? 0) * 10) / 10 },
    };
  }

  /** Contact growth over last N days */
  static async getContactGrowth(accountId: string, days = 30) {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const contacts = await prisma.contact.findMany({
      where: { accountId, createdAt: { gte: start } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      byDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const c of contacts) {
      const day = c.createdAt.toISOString().slice(0, 10);
      if (day in byDay) byDay[day]++;
    }

    return Object.entries(byDay).map(([date, count]) => ({ date, count }));
  }

  /** Pipeline stage funnel */
  static async getPipelineFunnel(accountId: string) {
    const stages = await prisma.stage.findMany({
      where: { pipeline: { accountId } },
      include: { _count: { select: { opportunities: true } } },
      orderBy: { position: "asc" },
    });

    return stages.map((s) => ({
      stage:   s.name,
      count:   s._count.opportunities,
    }));
  }

  /** Campaign performance stats */
  static async getCampaignStats(accountId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { accountId, status: "SENT" },
      include: { _count: { select: { recipients: true } } },
      orderBy: { sentAt: "desc" },
      take: 10,
    });

    return campaigns.map((c) => ({
      id:         c.id,
      name:       c.name,
      type:       c.type,
      sentAt:     c.sentAt,
      recipients: c._count.recipients,
    }));
  }

  /** Revenue by month for last 6 months */
  static async getRevenueByMonth(accountId: string) {
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

    const payments = await prisma.payment.findMany({
      where: { accountId, status: "COMPLETED", paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    });

    const byMonth: Record<string, number> = {};
    for (const p of payments) {
      if (!p.paidAt) continue;
      const month = p.paidAt.toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + p.amount;
    }

    return Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue }));
  }

  /** Appointment summary */
  static async getAppointmentStats(accountId: string) {
    const [scheduled, confirmed, completed, cancelled, noShow] = await Promise.all([
      prisma.appointment.count({ where: { accountId, status: "SCHEDULED" } }),
      prisma.appointment.count({ where: { accountId, status: "CONFIRMED" } }),
      prisma.appointment.count({ where: { accountId, status: "COMPLETED" } }),
      prisma.appointment.count({ where: { accountId, status: "CANCELLED" } }),
      prisma.appointment.count({ where: { accountId, status: "NO_SHOW" } }),
    ]);

    return { scheduled, confirmed, completed, cancelled, noShow };
  }

  /** Export contacts as CSV string */
  static async exportContactsCsv(accountId: string): Promise<string> {
    const contacts = await prisma.contact.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });

    const headers = ["id", "firstName", "lastName", "email", "phone", "company", "status", "tags", "createdAt"];
    const rows = contacts.map((c) => [
      c.id,
      c.firstName,
      c.lastName ?? "",
      c.email ?? "",
      c.phone ?? "",
      c.company ?? "",
      c.status,
      (c.tags ?? []).join("|"),
      c.createdAt.toISOString(),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));

    return [headers.join(","), ...rows].join("\n");
  }
}
