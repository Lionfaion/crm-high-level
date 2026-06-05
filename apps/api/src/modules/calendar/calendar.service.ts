import { prisma } from "@crm/db";

export class CalendarService {
  // ── Settings ───────────────────────────────────────────────────────────────

  static async getSettings(accountId: string) {
    return prisma.calendarSettings.findUnique({ where: { accountId } });
  }

  static async upsertSettings(accountId: string, data: Partial<{
    timezone: string;
    workingHoursStart: number;
    workingHoursEnd: number;
    workingDays: number[];
  }>) {
    return prisma.calendarSettings.upsert({
      where:  { accountId },
      create: { accountId, ...data },
      update: data,
    });
  }

  // ── Appointment Types ──────────────────────────────────────────────────────

  static async listTypes(accountId: string) {
    return prisma.appointmentType.findMany({
      where: { accountId },
      include: { _count: { select: { appointments: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  static async createType(accountId: string, data: {
    name: string; description?: string; duration: number;
    color?: string; slug: string; bufferBefore?: number; bufferAfter?: number; maxPerDay?: number;
  }) {
    return prisma.appointmentType.create({ data: { accountId, ...data } });
  }

  static async updateType(id: string, accountId: string, data: Partial<{
    name: string; description: string; duration: number; color: string;
    isActive: boolean; bufferBefore: number; bufferAfter: number; maxPerDay: number;
  }>) {
    return prisma.appointmentType.updateMany({ where: { id, accountId }, data });
  }

  static async deleteType(id: string, accountId: string) {
    return prisma.appointmentType.deleteMany({ where: { id, accountId } });
  }

  // ── Appointments ───────────────────────────────────────────────────────────

  static async list(accountId: string, opts: {
    page: number; pageSize: number;
    from?: string; to?: string; status?: string;
  }) {
    const where: any = { accountId };
    if (opts.status) where.status = opts.status;
    if (opts.from || opts.to) {
      where.startAt = {};
      if (opts.from) where.startAt.gte = new Date(opts.from);
      if (opts.to)   where.startAt.lte = new Date(opts.to);
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: {
          appointmentType: { select: { id: true, name: true, color: true, duration: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedUser: { select: { id: true, name: true } },
        },
        orderBy: { startAt: "asc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { appointments, total, page: opts.page, pageSize: opts.pageSize };
  }

  static async get(id: string, accountId: string) {
    return prisma.appointment.findFirst({
      where: { id, accountId },
      include: {
        appointmentType: true,
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async create(accountId: string, data: {
    appointmentTypeId: string; contactId?: string; userId?: string;
    title: string; startAt: Date; endAt: Date; notes?: string; locationUrl?: string;
  }) {
    return prisma.appointment.create({ data: { accountId, ...data } });
  }

  static async update(id: string, accountId: string, data: Partial<{
    title: string; startAt: Date; endAt: Date; status: string;
    notes: string; locationUrl: string; userId: string;
  }>) {
    return prisma.appointment.updateMany({ where: { id, accountId }, data: data as any });
  }

  static async cancel(id: string, accountId: string, reason?: string) {
    return prisma.appointment.updateMany({
      where: { id, accountId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason ?? null },
    });
  }

  static async complete(id: string, accountId: string) {
    return prisma.appointment.updateMany({
      where: { id, accountId },
      data: { status: "COMPLETED" },
    });
  }

  /** Return available time slots for a given appointment type on a date */
  static async getAvailableSlots(accountId: string, typeId: string, date: string) {
    const [settings, apptType] = await Promise.all([
      prisma.calendarSettings.findUnique({ where: { accountId } }),
      prisma.appointmentType.findFirst({ where: { id: typeId, accountId, isActive: true } }),
    ]);

    if (!apptType) return [];

    const duration = apptType.duration;
    const startHour = settings?.workingHoursStart ?? 9;
    const endHour   = settings?.workingHoursEnd ?? 17;

    const dayStart = new Date(`${date}T${String(startHour).padStart(2, "0")}:00:00.000Z`);
    const dayEnd   = new Date(`${date}T${String(endHour).padStart(2, "0")}:00:00.000Z`);

    // Fetch existing appointments that day
    const existing = await prisma.appointment.findMany({
      where: {
        accountId,
        startAt: { gte: dayStart, lt: dayEnd },
        status: { notIn: ["CANCELLED"] },
      },
      select: { startAt: true, endAt: true },
    });

    const slots: { start: string; end: string }[] = [];
    let cursor = new Date(dayStart);

    while (cursor < dayEnd) {
      const slotEnd = new Date(cursor.getTime() + duration * 60_000);
      if (slotEnd > dayEnd) break;

      const overlap = existing.some(
        (e) => cursor < e.endAt && slotEnd > e.startAt
      );
      if (!overlap) {
        slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
      }

      cursor = new Date(cursor.getTime() + duration * 60_000);
    }

    return slots;
  }
}
