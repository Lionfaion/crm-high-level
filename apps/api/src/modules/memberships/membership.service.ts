import { prisma } from "@crm/db";

export class MembershipService {
  // ── Courses ────────────────────────────────────────────────────────────────

  static async listCourses(accountId: string) {
    return prisma.course.findMany({
      where: { accountId },
      include: {
        _count: { select: { sections: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getCourse(id: string, accountId: string) {
    return prisma.course.findFirst({
      where: { id, accountId },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: { lessons: { orderBy: { position: "asc" } } },
        },
        _count: { select: { enrollments: true } },
      },
    });
  }

  static async createCourse(accountId: string, data: {
    title: string; description?: string; slug: string; imageUrl?: string; price?: number;
  }) {
    return prisma.course.create({ data: { accountId, ...data } });
  }

  static async updateCourse(id: string, accountId: string, data: Partial<{
    title: string; description: string; imageUrl: string; isPublished: boolean; price: number;
  }>) {
    return prisma.course.updateMany({ where: { id, accountId }, data });
  }

  static async deleteCourse(id: string, accountId: string) {
    return prisma.course.deleteMany({ where: { id, accountId } });
  }

  // ── Sections ───────────────────────────────────────────────────────────────

  static async addSection(courseId: string, accountId: string, data: { title: string; position?: number }) {
    const course = await prisma.course.findFirst({ where: { id: courseId, accountId } });
    if (!course) throw new Error("Course not found");
    const maxPos = await prisma.courseSection.aggregate({ where: { courseId }, _max: { position: true } });
    const position = data.position ?? (maxPos._max.position ?? -1) + 1;
    return prisma.courseSection.create({ data: { courseId, title: data.title, position } });
  }

  static async updateSection(sectionId: string, courseId: string, accountId: string, data: Partial<{ title: string; position: number }>) {
    const course = await prisma.course.findFirst({ where: { id: courseId, accountId } });
    if (!course) throw new Error("Course not found");
    return prisma.courseSection.updateMany({ where: { id: sectionId, courseId }, data });
  }

  static async deleteSection(sectionId: string, courseId: string, accountId: string) {
    const course = await prisma.course.findFirst({ where: { id: courseId, accountId } });
    if (!course) throw new Error("Course not found");
    return prisma.courseSection.deleteMany({ where: { id: sectionId, courseId } });
  }

  // ── Lessons ────────────────────────────────────────────────────────────────

  static async addLesson(sectionId: string, courseId: string, accountId: string, data: {
    title: string; content?: string; videoUrl?: string; fileUrl?: string;
    duration?: number; isPreview?: boolean; dripDays?: number; position?: number;
  }) {
    const section = await prisma.courseSection.findFirst({
      where: { id: sectionId, courseId },
      include: { course: { where: { accountId } } },
    });
    if (!section?.course) throw new Error("Section not found");
    const maxPos = await prisma.courseLesson.aggregate({ where: { sectionId }, _max: { position: true } });
    const position = data.position ?? (maxPos._max.position ?? -1) + 1;
    return prisma.courseLesson.create({ data: { sectionId, ...data, position } });
  }

  static async updateLesson(lessonId: string, sectionId: string, data: any) {
    return prisma.courseLesson.updateMany({ where: { id: lessonId, sectionId }, data });
  }

  static async deleteLesson(lessonId: string, sectionId: string) {
    return prisma.courseLesson.deleteMany({ where: { id: lessonId, sectionId } });
  }

  // ── Enrollments ────────────────────────────────────────────────────────────

  static async enroll(courseId: string, accountId: string, contactId: string, expiresAt?: Date) {
    const course = await prisma.course.findFirst({ where: { id: courseId, accountId } });
    if (!course) throw new Error("Course not found");
    return prisma.enrollment.upsert({
      where: { courseId_contactId: { courseId, contactId } },
      create: { courseId, contactId, expiresAt },
      update: { expiresAt },
    });
  }

  static async unenroll(courseId: string, accountId: string, contactId: string) {
    const course = await prisma.course.findFirst({ where: { id: courseId, accountId } });
    if (!course) throw new Error("Course not found");
    return prisma.enrollment.deleteMany({ where: { courseId, contactId } });
  }

  static async listEnrollments(courseId: string, accountId: string, opts: { page: number; pageSize: number }) {
    const course = await prisma.course.findFirst({ where: { id: courseId, accountId } });
    if (!course) throw new Error("Course not found");

    const [total, enrollments] = await Promise.all([
      prisma.enrollment.count({ where: { courseId } }),
      prisma.enrollment.findMany({
        where: { courseId },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { progress: true } },
        },
        orderBy: { enrolledAt: "desc" },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    return { enrollments, total, page: opts.page, pageSize: opts.pageSize };
  }

  static async markLessonComplete(enrollmentId: string, lessonId: string) {
    return prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: { enrollmentId, lessonId },
      update: { completedAt: new Date() },
    });
  }
}
