import { prisma } from "@crm/db";

export class FormService {
  static async list(accountId: string) {
    return prisma.form.findMany({
      where: { accountId },
      include: { _count: { select: { fields: true, submissions: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async get(id: string, accountId: string) {
    return prisma.form.findFirst({
      where: { id, accountId },
      include: { fields: { orderBy: { position: "asc" } } },
    });
  }

  static async create(accountId: string, data: {
    name: string; description?: string; redirectUrl?: string; submitText?: string;
  }) {
    return prisma.form.create({ data: { accountId, ...data } });
  }

  static async update(id: string, accountId: string, data: Partial<{
    name: string; description: string; isActive: boolean; redirectUrl: string; submitText: string;
  }>) {
    return prisma.form.updateMany({ where: { id, accountId }, data });
  }

  static async delete(id: string, accountId: string) {
    return prisma.form.deleteMany({ where: { id, accountId } });
  }

  // ── Fields ─────────────────────────────────────────────────────────────────

  static async addField(formId: string, accountId: string, data: {
    label: string; fieldType: string; placeholder?: string;
    required?: boolean; options?: string[]; position?: number; mappedField?: string;
  }) {
    const form = await prisma.form.findFirst({ where: { id: formId, accountId } });
    if (!form) throw new Error("Form not found");

    const maxPos = await prisma.formField.aggregate({
      where: { formId },
      _max: { position: true },
    });
    const position = data.position ?? (maxPos._max.position ?? -1) + 1;

    return prisma.formField.create({
      data: {
        formId,
        label:      data.label,
        fieldType:  data.fieldType as any,
        placeholder: data.placeholder,
        required:   data.required ?? false,
        options:    data.options ?? [],
        position,
        mappedField: data.mappedField,
      },
    });
  }

  static async updateField(fieldId: string, formId: string, accountId: string, data: any) {
    const form = await prisma.form.findFirst({ where: { id: formId, accountId } });
    if (!form) throw new Error("Form not found");
    return prisma.formField.updateMany({ where: { id: fieldId, formId }, data });
  }

  static async deleteField(fieldId: string, formId: string, accountId: string) {
    const form = await prisma.form.findFirst({ where: { id: formId, accountId } });
    if (!form) throw new Error("Form not found");
    return prisma.formField.deleteMany({ where: { id: fieldId, formId } });
  }

  // ── Submissions ────────────────────────────────────────────────────────────

  static async submit(formId: string, data: Record<string, unknown>, meta: { ip?: string; ua?: string }) {
    const form = await prisma.form.findFirst({
      where: { id: formId, isActive: true },
      include: { fields: true },
    });
    if (!form) throw new Error("Form not found");

    // Auto-create or find contact by email
    let contactId: string | undefined;
    const emailField = form.fields.find((f) => f.mappedField === "email" || f.fieldType === "EMAIL");
    if (emailField && data[emailField.id]) {
      const email = String(data[emailField.id]).toLowerCase();
      const firstNameField = form.fields.find((f) => f.mappedField === "firstName");
      const lastNameField  = form.fields.find((f) => f.mappedField === "lastName");

      const existing = await prisma.contact.findFirst({ where: { accountId: form.accountId, email } });
      if (existing) {
        contactId = existing.id;
      } else {
        const newContact = await prisma.contact.create({
          data: {
            accountId: form.accountId,
            email,
            firstName: firstNameField ? String(data[firstNameField.id] ?? "Lead") : "Lead",
            lastName:  lastNameField  ? String(data[lastNameField.id]  ?? "")     : null,
          },
        });
        contactId = newContact.id;
      }
    }

    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        contactId: contactId ?? null,
        data,
        ipAddress: meta.ip ?? null,
        userAgent: meta.ua ?? null,
      },
    });

    return { submission, contactId };
  }

  static async listSubmissions(formId: string, accountId: string, opts: { page: number; pageSize: number }) {
    const form = await prisma.form.findFirst({ where: { id: formId, accountId } });
    if (!form) throw new Error("Form not found");

    const [total, submissions] = await Promise.all([
      prisma.formSubmission.count({ where: { formId } }),
      prisma.formSubmission.findMany({
        where: { formId },
        include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { submissions, total, page: opts.page, pageSize: opts.pageSize };
  }
}
