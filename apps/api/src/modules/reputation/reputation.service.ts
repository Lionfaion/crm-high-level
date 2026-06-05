import { prisma } from "@crm/db";
import { emailService } from "../messaging/email.service.js";
import { smsService } from "../messaging/sms.service.js";

export class ReputationService {
  // ── Reviews ────────────────────────────────────────────────────────────────

  static async list(accountId: string, opts: {
    page: number; pageSize: number; source?: string; minRating?: number; status?: string;
  }) {
    const where: any = { accountId };
    if (opts.source)    where.source = opts.source;
    if (opts.status)    where.status = opts.status;
    if (opts.minRating) where.rating = { gte: opts.minRating };

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { reviewedAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { reviews, total, page: opts.page, pageSize: opts.pageSize };
  }

  static async getStats(accountId: string) {
    const [total, byRating, bySource] = await Promise.all([
      prisma.review.count({ where: { accountId, status: { not: "HIDDEN" } } }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { accountId, status: { not: "HIDDEN" } },
        _count: true,
      }),
      prisma.review.groupBy({
        by: ["source"],
        where: { accountId, status: { not: "HIDDEN" } },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    const avg = total > 0
      ? await prisma.review.aggregate({ where: { accountId, status: { not: "HIDDEN" } }, _avg: { rating: true } })
      : { _avg: { rating: 0 } };

    return {
      total,
      averageRating: Math.round((avg._avg.rating ?? 0) * 10) / 10,
      byRating: byRating.reduce<Record<number, number>>((acc, r) => {
        acc[r.rating] = r._count;
        return acc;
      }, {}),
      bySource,
    };
  }

  static async create(accountId: string, data: {
    rating: number; title?: string; body?: string; source?: string;
    reviewerName?: string; reviewUrl?: string; contactId?: string;
  }) {
    return prisma.review.create({ data: { accountId, ...data as any } });
  }

  static async respond(id: string, accountId: string, response: string) {
    return prisma.review.updateMany({
      where: { id, accountId },
      data: { response, respondedAt: new Date(), status: "RESPONDED" },
    });
  }

  static async hide(id: string, accountId: string) {
    return prisma.review.updateMany({ where: { id, accountId }, data: { status: "HIDDEN" } });
  }

  static async publish(id: string, accountId: string) {
    return prisma.review.updateMany({ where: { id, accountId }, data: { status: "PUBLISHED" } });
  }

  // ── Review Requests ────────────────────────────────────────────────────────

  static async sendRequest(accountId: string, contactId: string, channel: "EMAIL" | "SMS") {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, accountId } });
    if (!contact) throw new Error("Contact not found");

    const request = await prisma.reviewRequest.create({
      data: { accountId, contactId, channel },
    });

    const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reviews/leave?rid=${request.id}`;
    const message = `Hi ${contact.firstName}, we'd love your feedback! Leave us a review: ${reviewLink}`;

    if (channel === "EMAIL" && contact.email) {
      await emailService.send({
        to:      contact.email,
        subject: "We'd love your review!",
        html:    `<p>${message}</p>`,
      });
    } else if (channel === "SMS" && contact.phone) {
      await smsService.send(contact.phone, message);
    }

    return request;
  }

  static async listRequests(accountId: string, opts: { page: number; pageSize: number }) {
    const [total, requests] = await Promise.all([
      prisma.reviewRequest.count({ where: { accountId } }),
      prisma.reviewRequest.findMany({
        where: { accountId },
        include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { sentAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { requests, total, page: opts.page, pageSize: opts.pageSize };
  }
}
