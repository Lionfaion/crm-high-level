import { prisma } from "@crm/db";

export class PaymentService {
  // ── Products ───────────────────────────────────────────────────────────────

  static async listProducts(accountId: string) {
    return prisma.product.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createProduct(accountId: string, data: {
    name: string; description?: string; price: number; currency?: string;
  }) {
    return prisma.product.create({ data: { accountId, ...data } });
  }

  static async updateProduct(id: string, accountId: string, data: Partial<{
    name: string; description: string; price: number; isActive: boolean;
  }>) {
    return prisma.product.updateMany({ where: { id, accountId }, data });
  }

  static async deleteProduct(id: string, accountId: string) {
    return prisma.product.deleteMany({ where: { id, accountId } });
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  static async listInvoices(accountId: string, opts: {
    page: number; pageSize: number; status?: string;
  }) {
    const where: any = { accountId };
    if (opts.status) where.status = opts.status;

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { invoices, total, page: opts.page, pageSize: opts.pageSize };
  }

  static async getInvoice(id: string, accountId: string) {
    return prisma.invoice.findFirst({
      where: { id, accountId },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: { include: { product: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  static async createInvoice(accountId: string, data: {
    contactId?: string;
    items: { productId?: string; description: string; quantity: number; unitPrice: number }[];
    taxRate?: number;
    notes?: string;
    dueDate?: Date;
    currency?: string;
  }) {
    const number = await PaymentService.nextInvoiceNumber(accountId);
    const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const taxRate  = data.taxRate ?? 0;
    const taxAmount = Math.round(subtotal * taxRate / 100);
    const total    = subtotal + taxAmount;

    return prisma.invoice.create({
      data: {
        accountId,
        number,
        contactId: data.contactId,
        currency:  data.currency ?? "usd",
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes:    data.notes,
        dueDate:  data.dueDate,
        items: {
          create: data.items.map((item) => ({
            productId:   item.productId,
            description: item.description,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            total:       item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  static async markSent(id: string, accountId: string) {
    return prisma.invoice.updateMany({
      where: { id, accountId },
      data: { status: "SENT", sentAt: new Date() },
    });
  }

  static async markPaid(id: string, accountId: string) {
    const invoice = await prisma.invoice.findFirst({ where: { id, accountId } });
    if (!invoice) throw new Error("Invoice not found");

    await prisma.$transaction([
      prisma.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } }),
      prisma.payment.create({
        data: {
          accountId,
          invoiceId:   id,
          contactId:   invoice.contactId ?? undefined,
          amount:      invoice.total,
          currency:    invoice.currency,
          status:      "COMPLETED",
          paidAt:      new Date(),
        } as any,
      }),
    ]);

    return { ok: true };
  }

  static async voidInvoice(id: string, accountId: string) {
    return prisma.invoice.updateMany({
      where: { id, accountId },
      data: { status: "VOID" },
    });
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  static async listPayments(accountId: string, opts: { page: number; pageSize: number }) {
    const [total, payments] = await Promise.all([
      prisma.payment.count({ where: { accountId } }),
      prisma.payment.findMany({
        where: { accountId },
        include: {
          invoice: { select: { id: true, number: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { payments, total, page: opts.page, pageSize: opts.pageSize };
  }

  static async getRevenueSummary(accountId: string) {
    const [totalRevenue, pendingRevenue, invoiceCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { accountId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { accountId, status: { in: ["SENT", "OVERDUE"] } },
        _sum: { total: true },
      }),
      prisma.invoice.count({ where: { accountId } }),
    ]);

    return {
      totalRevenue:   totalRevenue._sum.amount ?? 0,
      pendingRevenue: pendingRevenue._sum.total ?? 0,
      invoiceCount,
    };
  }

  private static async nextInvoiceNumber(accountId: string): Promise<string> {
    const count = await prisma.invoice.count({ where: { accountId } });
    const year  = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
  }
}
