import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Role } from "../../lib/roles.js";
import { PaymentService } from "./payment.service.js";

const productSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price:       z.number().int().positive(),
  currency:    z.string().length(3).default("usd"),
});

const invoiceItemSchema = z.object({
  productId:   z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  quantity:    z.number().int().positive().default(1),
  unitPrice:   z.number().int().min(0),
});

const invoiceSchema = z.object({
  contactId: z.string().uuid().optional(),
  items:     z.array(invoiceItemSchema).min(1),
  taxRate:   z.number().min(0).max(100).default(0),
  notes:     z.string().max(2000).optional(),
  dueDate:   z.string().datetime().optional(),
  currency:  z.string().length(3).default("usd"),
});

const listSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  status:   z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"]).optional(),
});

export default async function paymentRoutes(app: FastifyInstance) {
  const auth      = [app.authenticate, app.requireRole(Role.ACCOUNT_USER)];
  const adminAuth = [app.authenticate, app.requireRole(Role.ACCOUNT_ADMIN)];

  // ── Summary ───────────────────────────────────────────────────────────────
  app.get("/summary", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send(await PaymentService.getRevenueSummary(accountId));
  });

  // ── Products ──────────────────────────────────────────────────────────────
  app.get("/products", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    return reply.send({ products: await PaymentService.listProducts(accountId) });
  });

  app.post("/products", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = productSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const product = await PaymentService.createProduct(accountId, parsed.data);
    return reply.code(201).send({ product });
  });

  app.patch("/products/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = productSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    await PaymentService.updateProduct(id, accountId, parsed.data);
    return reply.send({ ok: true });
  });

  app.delete("/products/:id", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await PaymentService.deleteProduct(id, accountId);
    return reply.code(204).send();
  });

  // ── Invoices ──────────────────────────────────────────────────────────────
  app.get("/invoices", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = listSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
    return reply.send(await PaymentService.listInvoices(accountId, parsed.data));
  });

  app.post("/invoices", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const parsed = invoiceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    const data = {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    };
    const invoice = await PaymentService.createInvoice(accountId, data);
    return reply.code(201).send({ invoice });
  });

  app.get("/invoices/:id", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const invoice = await PaymentService.getInvoice(id, accountId);
    if (!invoice) return reply.code(404).send({ error: "Invoice not found" });
    return reply.send({ invoice });
  });

  app.post("/invoices/:id/send", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await PaymentService.markSent(id, accountId);
    return reply.send({ ok: true });
  });

  app.post("/invoices/:id/pay", { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await PaymentService.markPaid(id, accountId);
    return reply.send({ ok: true });
  });

  app.post("/invoices/:id/void", { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    await PaymentService.voidInvoice(id, accountId);
    return reply.send({ ok: true });
  });

  // ── Payments ──────────────────────────────────────────────────────────────
  app.get("/payments", { preHandler: auth }, async (request, reply) => {
    const accountId = request.accountId;
    if (!accountId) return reply.code(400).send({ error: "No active account" });
    const { page = "1", pageSize = "25" } = request.query as any;
    return reply.send(await PaymentService.listPayments(accountId, {
      page: Number(page), pageSize: Number(pageSize),
    }));
  });
}
