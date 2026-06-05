import { prisma } from "@crm/db";
import { emailService } from "../messaging/email.service.js";
import { smsService } from "../messaging/sms.service.js";

export class WorkflowService {
  static async list(accountId: string, opts: { page: number; pageSize: number; status?: string }) {
    const where: any = { accountId };
    if (opts.status) where.status = opts.status;

    const [total, workflows] = await Promise.all([
      prisma.workflow.count({ where }),
      prisma.workflow.findMany({
        where,
        include: { _count: { select: { steps: true, runs: true } } },
        orderBy: { createdAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { workflows, total, page: opts.page, pageSize: opts.pageSize };
  }

  static async get(id: string, accountId: string) {
    return prisma.workflow.findFirst({
      where: { id, accountId },
      include: { steps: { orderBy: { position: "asc" } } },
    });
  }

  static async create(accountId: string, data: {
    name: string;
    description?: string;
    triggerType: string;
    triggerConfig?: object;
  }) {
    return prisma.workflow.create({
      data: {
        accountId,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType as any,
        triggerConfig: data.triggerConfig ?? {},
      },
      include: { steps: true },
    });
  }

  static async update(id: string, accountId: string, data: Partial<{
    name: string; description: string; status: string; triggerType: string; triggerConfig: object;
  }>) {
    return prisma.workflow.updateMany({ where: { id, accountId }, data: data as any });
  }

  static async delete(id: string, accountId: string) {
    return prisma.workflow.deleteMany({ where: { id, accountId } });
  }

  // ── Steps ──────────────────────────────────────────────────────────────────

  static async addStep(workflowId: string, accountId: string, data: {
    actionType: string; config?: object; position?: number;
  }) {
    const wf = await prisma.workflow.findFirst({ where: { id: workflowId, accountId } });
    if (!wf) throw new Error("Workflow not found");

    const maxPos = await prisma.workflowStep.aggregate({
      where: { workflowId },
      _max: { position: true },
    });
    const position = data.position ?? (maxPos._max.position ?? -1) + 1;

    return prisma.workflowStep.create({
      data: { workflowId, actionType: data.actionType as any, config: data.config ?? {}, position },
    });
  }

  static async updateStep(stepId: string, workflowId: string, accountId: string, data: Partial<{
    actionType: string; config: object; position: number;
  }>) {
    const wf = await prisma.workflow.findFirst({ where: { id: workflowId, accountId } });
    if (!wf) throw new Error("Workflow not found");
    return prisma.workflowStep.updateMany({ where: { id: stepId, workflowId }, data: data as any });
  }

  static async deleteStep(stepId: string, workflowId: string, accountId: string) {
    const wf = await prisma.workflow.findFirst({ where: { id: workflowId, accountId } });
    if (!wf) throw new Error("Workflow not found");
    return prisma.workflowStep.deleteMany({ where: { id: stepId, workflowId } });
  }

  // ── Execution ─────────────────────────────────────────────────────────────

  static async trigger(workflowId: string, accountId: string, opts: {
    contactId?: string; triggeredBy?: string;
  }) {
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, accountId, status: "ACTIVE" },
      include: { steps: { orderBy: { position: "asc" } } },
    });
    if (!workflow) throw new Error("Workflow not found or not active");

    const run = await prisma.workflowRun.create({
      data: {
        workflowId,
        contactId: opts.contactId ?? null,
        triggeredBy: opts.triggeredBy ?? "manual",
        status: "RUNNING",
      },
    });

    // Execute steps asynchronously (fire-and-forget in MVP)
    WorkflowService.executeRun(run.id, workflow.steps, opts.contactId).catch(
      (err) => console.error("Workflow execution error:", err)
    );

    return { runId: run.id };
  }

  private static async executeRun(runId: string, steps: any[], contactId?: string) {
    let contact: any = null;
    if (contactId) {
      contact = await prisma.contact.findUnique({ where: { id: contactId } });
    }

    for (const step of steps) {
      const stepLog = await prisma.workflowStepLog.create({
        data: { runId, stepId: step.id, status: "RUNNING" },
      });

      try {
        const output = await WorkflowService.executeStep(step, contact);
        await prisma.workflowStepLog.update({
          where: { id: stepLog.id },
          data: { status: "COMPLETED", output },
        });
      } catch (err: any) {
        await prisma.workflowStepLog.update({
          where: { id: stepLog.id },
          data: { status: "FAILED", errorMsg: err?.message ?? "Unknown error" },
        });
        await prisma.workflowRun.update({
          where: { id: runId },
          data: { status: "FAILED", finishedAt: new Date(), errorMsg: err?.message },
        });
        return;
      }
    }

    await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: "COMPLETED", finishedAt: new Date() },
    });
  }

  private static async executeStep(step: any, contact: any): Promise<object> {
    const cfg = step.config as any;

    switch (step.actionType) {
      case "SEND_EMAIL": {
        if (!contact?.email) return { skipped: true, reason: "no email" };
        const body = emailService.renderTemplate(cfg.body ?? "", {
          firstName: contact.firstName ?? "",
          lastName:  contact.lastName ?? "",
        });
        await emailService.send({
          to:      contact.email,
          subject: cfg.subject ?? "Message from us",
          html:    body,
        });
        return { sent: true, to: contact.email };
      }

      case "SEND_SMS": {
        if (!contact?.phone) return { skipped: true, reason: "no phone" };
        const body = emailService.renderTemplate(cfg.body ?? "", {
          firstName: contact.firstName ?? "",
          lastName:  contact.lastName ?? "",
        });
        await smsService.send(contact.phone, body, cfg.from);
        return { sent: true, to: contact.phone };
      }

      case "ADD_TAG": {
        if (!contact?.id || !cfg.tag) return { skipped: true };
        const tags = [...new Set([...(contact.tags ?? []), cfg.tag])];
        await prisma.contact.update({ where: { id: contact.id }, data: { tags } });
        contact.tags = tags;
        return { tag: cfg.tag, tags };
      }

      case "REMOVE_TAG": {
        if (!contact?.id || !cfg.tag) return { skipped: true };
        const tags = (contact.tags ?? []).filter((t: string) => t !== cfg.tag);
        await prisma.contact.update({ where: { id: contact.id }, data: { tags } });
        contact.tags = tags;
        return { removed: cfg.tag };
      }

      case "WAIT": {
        const ms = (cfg.delaySeconds ?? 0) * 1000;
        if (ms > 0 && ms <= 60_000) await new Promise((r) => setTimeout(r, ms));
        return { waited: cfg.delaySeconds ?? 0 };
      }

      case "WEBHOOK": {
        if (!cfg.url) return { skipped: true, reason: "no url" };
        const res = await fetch(cfg.url, {
          method:  cfg.method ?? "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ contact, step: step.id }),
        });
        return { status: res.status };
      }

      case "UPDATE_CONTACT": {
        if (!contact?.id || !cfg.data) return { skipped: true };
        await prisma.contact.update({ where: { id: contact.id }, data: cfg.data });
        Object.assign(contact, cfg.data);
        return { updated: cfg.data };
      }

      case "INTERNAL_NOTE": {
        if (!contact?.id || !cfg.body) return { skipped: true };
        await prisma.note.create({
          data: { contactId: contact.id, body: cfg.body, userId: null as any },
        });
        return { noted: true };
      }

      default:
        return { skipped: true, reason: "unknown action" };
    }
  }

  // ── Runs ─────────────────────────────────────────────────────────────────

  static async listRuns(workflowId: string, accountId: string, opts: { page: number; pageSize: number }) {
    const wf = await prisma.workflow.findFirst({ where: { id: workflowId, accountId } });
    if (!wf) throw new Error("Workflow not found");

    const [total, runs] = await Promise.all([
      prisma.workflowRun.count({ where: { workflowId } }),
      prisma.workflowRun.findMany({
        where: { workflowId },
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { startedAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { runs, total, page: opts.page, pageSize: opts.pageSize };
  }

  static async getRun(runId: string, workflowId: string, accountId: string) {
    const wf = await prisma.workflow.findFirst({ where: { id: workflowId, accountId } });
    if (!wf) throw new Error("Workflow not found");

    return prisma.workflowRun.findFirst({
      where: { id: runId, workflowId },
      include: { stepLogs: { include: { step: true }, orderBy: { executedAt: "asc" } } },
    });
  }
}
