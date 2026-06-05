import { prisma } from "@crm/db";
import { emailService } from "./email.service.js";
import { smsService } from "./sms.service.js";

export class CampaignService {
  static async list(accountId: string, opts: { page: number; pageSize: number; type?: string }) {
    const where: any = { accountId };
    if (opts.type) where.type = opts.type;

    const [total, campaigns] = await Promise.all([
      prisma.campaign.count({ where }),
      prisma.campaign.findMany({
        where,
        include: { _count: { select: { recipients: true } } },
        orderBy: { createdAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { campaigns, total, page: opts.page, pageSize: opts.pageSize };
  }

  static async get(id: string, accountId: string) {
    return prisma.campaign.findFirst({
      where: { id, accountId },
      include: {
        recipients: {
          include: { contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
          take: 50,
        },
      },
    });
  }

  static async create(accountId: string, data: {
    name: string; type: "EMAIL" | "SMS"; subject?: string; body: string;
    fromName?: string; fromEmail?: string; fromPhone?: string; tags?: string[]; scheduledAt?: Date;
  }) {
    return prisma.campaign.create({ data: { accountId, ...data } });
  }

  static async update(id: string, accountId: string, data: Partial<{
    name: string; subject: string; body: string; scheduledAt: Date | null; status: string;
  }>) {
    return prisma.campaign.updateMany({ where: { id, accountId }, data });
  }

  static async delete(id: string, accountId: string) {
    return prisma.campaign.deleteMany({ where: { id, accountId } });
  }

  /** Add contacts to campaign by tag or explicit list */
  static async addRecipients(campaignId: string, accountId: string, opts: { tag?: string; contactIds?: string[] }) {
    let contactIds = opts.contactIds ?? [];
    if (opts.tag) {
      const contacts = await prisma.contact.findMany({
        where: { accountId, tags: { has: opts.tag } },
        select: { id: true },
      });
      contactIds = [...new Set([...contactIds, ...contacts.map((c) => c.id)])];
    }

    await prisma.campaignRecipient.createMany({
      data: contactIds.map((contactId) => ({ campaignId, contactId })),
      skipDuplicates: true,
    });

    return { added: contactIds.length };
  }

  /** Execute campaign send (called by queue worker or manually) */
  static async send(id: string, accountId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, accountId },
      include: {
        recipients: {
          where: { sentAt: null },
          include: { contact: { select: { email: true, phone: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status === "SENT") throw new Error("Campaign already sent");

    await prisma.campaign.update({ where: { id }, data: { status: "SENDING" } });

    let sentCount = 0;

    for (const recipient of campaign.recipients) {
      try {
        const body = emailService.renderTemplate(campaign.body, {
          firstName: recipient.contact.firstName,
          lastName:  recipient.contact.lastName ?? "",
        });

        if (campaign.type === "EMAIL" && recipient.contact.email) {
          await emailService.send({
            to:       recipient.contact.email,
            subject:  campaign.subject ?? campaign.name,
            html:     body,
            fromName: campaign.fromName ?? undefined,
            from:     campaign.fromEmail ?? undefined,
          });
        } else if (campaign.type === "SMS" && recipient.contact.phone) {
          await smsService.send(recipient.contact.phone, body, campaign.fromPhone ?? undefined);
        }

        await prisma.campaignRecipient.update({
          where: { campaignId_contactId: { campaignId: id, contactId: recipient.contactId } },
          data:  { sentAt: new Date() },
        });
        sentCount++;
      } catch {
        // Continue on individual send failure
      }
    }

    await prisma.campaign.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
    return { sent: sentCount, total: campaign.recipients.length };
  }
}
