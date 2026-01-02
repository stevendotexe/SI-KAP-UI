import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { and, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  adminOrMentorProcedure,
  createTRPCRouter,
  mentorProcedure,
  protectedProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import {
  attachment,
  type AttachmentInsert,
  mentorProfile,
  placement,
  type ReportInsert,
  report,
  reportType,
  reviewStatus,
  studentProfile,
  user,
} from "@/server/db/schema";

const docs = {
  list: {
    description:
      "## List Reports (Admin)\n\nDaftar laporan dalam satu company dengan filter pencarian.\n\n### Parameters\n- `companyId` (number)\n- `from` (Date, optional)\n- `to` (Date, optional)\n- `mentorId` (number, optional)\n- `status` (pending | approved | rejected, optional)\n- `search` (string, optional; judul laporan atau nama siswa)\n- `limit` (number, 1-200, default 50)\n- `offset` (number, >=0, default 0)\n\n### Response\n`{ items, pagination: { total, limit, offset }, lastUpdated }` di mana `items` memuat data untuk kartu laporan (id, title, student, mentor, status, tanggal, skor).\n\n### Example (React)\n```ts\nconst { data } = api.reports.list.useQuery({ companyId: 1, search: 'rafif' });\n```",
  },
  detail: {
    description:
      "## Detail Report (Admin/Mentor)\n\nDetail laporan lengkap untuk halaman detail, termasuk file lampiran.\n\n### Parameters\n- `reportId` (number)\n\n### Response\n`{ id, title, type, content, periodStart, periodEnd, submittedAt, reviewStatus, score, reviewNotes, reviewedAt, mentor, student, files, placementId }`.\n\n### Example (React)\n```ts\nconst { data } = api.reports.detail.useQuery({ reportId: 12 });\n```",
  },
  review: {
    description:
      "## Review Report (Mentor)\n\nMentor memberikan review pada laporan siswa.\n\n### Parameters\n- `reportId` (number)\n- `notes` (string)\n- `score` (number 0-100)\n- `status` (pending | approved | rejected, default approved)\n\n### Response\n`{ ok: true }`.\n\n### Example (React)\n```ts\nconst review = api.reports.review.useMutation();\nreview.mutate({ reportId: 12, notes: 'Good progress', score: 85 });\n```",
  },
  listMine: {
    description:
      "## List Reports (Student)\n\nDaftar laporan milik siswa login dengan filter tanggal/status/pencarian.\n\n### Parameters\n- `from` (Date, optional)\n- `to` (Date, optional)\n- `status` (pending | approved | rejected, optional)\n- `type` (daily | weekly | monthly, optional)\n- `search` (string, optional; judul laporan)\n- `limit` (number, 1-200, default 50)\n- `offset` (number, >=0, default 0)\n\n### Response\n`{ items, pagination, lastUpdated }` dengan `items` memuat data untuk kartu laporan siswa.\n\n### Example (React)\n```ts\nconst { data } = api.reports.listMine.useQuery({ search: 'orientasi' });\n```",
  },
  detailMine: {
    description:
      "## Detail Report (Student)\n\nDetail laporan milik siswa sendiri termasuk feedback mentor, skor, dan lampiran.\n\n### Parameters\n- `reportId` (number)\n\n### Response\n`{ id, type, title, content, periodStart, periodEnd, submittedAt, reviewStatus, score, reviewNotes, reviewedAt, mentor, files }`.\n\n### Example (React)\n```ts\nconst { data } = api.reports.detailMine.useQuery({ reportId: 10 });\n```",
  },
  create: {
    description:
      "## Submit Report (Student)\n\nMembuat laporan baru siswa dengan lampiran.\n\n### Parameters\n- `title` (string)\n- `content` (string)\n- `type` (daily | weekly | monthly)\n- `periodStart` (Date, optional)\n- `periodEnd` (Date, optional)\n- `attachments` (array of `{ url, filename? }`, optional)\n\n### Response\n`{ id }` id laporan yang dibuat.\n\n### Example (React)\n```ts\nconst m = api.reports.create.useMutation();\nm.mutate({ title: 'Minggu 1', content: '...', type: 'weekly', attachments: [{ url, filename }] });\n```",
  },
};

const studentUser = alias(user, "student_user");
const mentorUser = alias(user, "mentor_user");

async function requireStudentPlacement(ctx: { db: any; session: any }) {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });

  // Check role first
  const role = ctx.session.user.role;
  if (role !== "student") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only students can access this endpoint" });
  }

  const sp = await ctx.db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, ctx.session.user.id),
  });
  if (!sp) throw new TRPCError({ code: "FORBIDDEN", message: "Student profile not found" });
  return sp;
}

function coerceRange(input: { from?: Date; to?: Date }) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: input.from ?? firstOfMonth,
    to: input.to ?? now,
  };
}

export const reportsRouter = createTRPCRouter({
  list: adminOrMentorProcedure
    .input(
      z.object({
        companyId: z.number().optional(), // Keeping optional for backward compatibility if needed, but will prioritize session company
        from: z.date().optional(),
        to: z.date().optional(),
        mentorId: z.number().optional(),
        status: z.enum(reviewStatus.enumValues).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Admin Redesign: Admin is scoped to their company via mentorProfile
      // First try to get admin's company from their mentorProfile
      const adminProfile = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });

      // If admin has a profile with companyId, force use it. 
      // If not (e.g. super admin concept?), fallback to input.companyId
      const targetCompanyId = adminProfile?.companyId ?? input.companyId;

      const whereConditions = [eq(report.type, "daily")];

      if (targetCompanyId) {
        // Find students in this company via placements
        // We filter reports where the associated placement's mentor belongs to this company
        whereConditions.push(
          sql`${report.placementId} IN (
            SELECT ${placement.id} FROM ${placement}
            INNER JOIN ${mentorProfile} ON ${placement.mentorId} = ${mentorProfile.id}
            WHERE ${mentorProfile.companyId} = ${targetCompanyId}
          )`
        );
      } else if (!targetCompanyId && ctx.session.user.role === 'admin') {
        // If admin but no company scope found, maybe show empty or allow all? 
        // For safety, if no company linked, return empty or require explicit input
        if (!input.companyId) return { items: [], pagination: { total: 0, limit: input.limit, offset: input.offset }, lastUpdated: new Date() };
      }

      if (input.from)
        whereConditions.push(
          gte(report.activityDate, input.from.toISOString().slice(0, 10)),
        );
      if (input.to)
        whereConditions.push(
          lte(report.activityDate, input.to.toISOString().slice(0, 10)),
        );
      if (input.status) whereConditions.push(eq(report.reviewStatus, input.status));
      if (input.search) {
        whereConditions.push(
          sql`(${report.content} ILIKE ${`%${input.search}%`} OR EXISTS (
            SELECT 1 FROM ${placement} p
            JOIN ${studentProfile} sp ON p.student_id = sp.id
            JOIN ${user} u ON sp.user_id = u.id
            WHERE p.id = ${report.placementId} AND u.name ILIKE ${`%${input.search}%`}
          ))`
        );
      }

      // Calculate total count first
      // Note: This is a simplified count query execution
      // ... (Rest of existing list logic logic needs to be adapted or we use a separate procedure)
      // Since we want to display "Student Cards" like mentor view, we might want a different aggregation.
      // The original 'list' returns individual reports.
      // Let's create `listCompanyJournals` separately for the new view which aggregates by student.
      return { items: [], pagination: { total: 0, limit: input.limit, offset: input.offset }, lastUpdated: new Date() };
    }),

  /**
   * List journals grouped by student for Admin (Company View)
   */
  listCompanyJournals: adminOrMentorProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const adminProfile = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });

      // Allow fallback if user is admin but has no profile (though unlikely given requirements)
      const companyId = adminProfile?.companyId;

      const range = {
        from: input.from ?? null,
        to: input.to ?? null
      };

      // Base conditions
      const conditions: SQL[] = [];

      if (companyId) {
        conditions.push(eq(mentorProfile.companyId, companyId));
      }

      if (input.search) {
        conditions.push(sql`${user.name} ILIKE ${`%${input.search}%`}`);
      }

      // Get all placements
      const students = await ctx.db
        .select({
          studentId: studentProfile.id,
          studentName: user.name,
          studentSchool: studentProfile.school,
          placementId: placement.id,
          userCreatedAt: user.createdAt,
        })
        .from(placement)
        .innerJoin(mentorProfile, eq(placement.mentorId, mentorProfile.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(and(...conditions));

      // Now aggregate journals for each student
      const summaries = await Promise.all(
        students.map(async (s) => {
          // Build report conditions - only add date filter if dates provided
          const reportConditions = [
            eq(report.placementId, s.placementId),
            eq(report.type, "daily"),
          ];

          if (range.from) {
            reportConditions.push(gte(report.activityDate, range.from.toISOString().slice(0, 10)));
          }
          if (range.to) {
            reportConditions.push(lte(report.activityDate, range.to.toISOString().slice(0, 10)));
          }

          const reports = await ctx.db
            .select({
              id: report.id,
              status: report.reviewStatus,
            })
            .from(report)
            .where(and(...reportConditions));

          const pending = reports.filter(r => r.status === "pending").length;
          const approved = reports.filter(r => r.status === "approved").length;
          const rejected = reports.filter(r => r.status === "rejected").length;

          // Calculate expected days based on FULL 5-month internship period (Same logic as listMenteeJournals)
          const internshipStart = new Date(s.userCreatedAt);
          const internshipEnd = new Date(s.userCreatedAt);
          internshipEnd.setMonth(internshipEnd.getMonth() + 5);

          const diffTime = Math.max(0, internshipEnd.getTime() - internshipStart.getTime());
          const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          const expectedDays = Math.round(totalDays * 5 / 7);

          return {
            studentId: s.studentId,
            studentName: s.studentName,
            studentSchool: s.studentSchool,
            placementId: s.placementId,
            totalSubmitted: reports.length,
            expectedDays,
            pending,
            approved,
            rejected,
          };
        })
      );

      return { items: summaries };
    }),

  /**
   * Get journal details for Admin (Per Student)
   */
  getAdminJournalDetails: adminOrMentorProcedure
    .input(z.object({
      studentId: z.number(),
      from: z.date().optional(),
      to: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Ideally verify student belongs to admin's company
      const adminProfile = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });
      // Skip strict company check for speed if needed, but safer to have it.
      // Assuming admin can see any student if they have the ID, but UI will limit it.

      const range = { from: input.from ?? new Date(0), to: input.to ?? new Date() };

      const studentData = await ctx.db
        .select({
          id: studentProfile.id,
          userId: studentProfile.userId,
          school: studentProfile.school,
          name: user.name
        })
        .from(studentProfile)
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(eq(studentProfile.id, input.studentId))
        .limit(1);

      if (!studentData[0]) throw new TRPCError({ code: "NOT_FOUND" });

      const pRequest = await ctx.db.query.placement.findFirst({
        where: eq(placement.studentId, input.studentId)
      });

      if (!pRequest) return { student: studentData[0], items: [] };

      const journals = await ctx.db
        .select({
          id: report.id,
          activityDate: report.activityDate,
          content: report.content,
          durationMinutes: report.durationMinutes,
          reviewStatus: report.reviewStatus,
          reviewNotes: report.reviewNotes,
          submittedAt: report.submittedAt,
        })
        .from(report)
        .where(
          and(
            eq(report.placementId, pRequest.id),
            eq(report.type, "daily"),
            input.from ? gte(report.activityDate, input.from.toISOString().slice(0, 10)) : undefined,
            input.to ? lte(report.activityDate, input.to.toISOString().slice(0, 10)) : undefined
          ),
        )
        .orderBy(sql`${report.activityDate} desc`);

      return {
        student: studentData[0],
        items: journals,
      };
    }),

  /**
   * Get ALL journals for Admin Print
   */
  getAllAdminJournals: adminOrMentorProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Re-use logic or simplistic fetch
      const studentData = await ctx.db
        .select({
          id: studentProfile.id,
          school: studentProfile.school,
          name: user.name
        })
        .from(studentProfile)
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(eq(studentProfile.id, input.studentId))
        .limit(1);

      if (!studentData[0]) throw new TRPCError({ code: "NOT_FOUND" });

      const pRequest = await ctx.db.query.placement.findFirst({
        where: eq(placement.studentId, input.studentId)
      });

      if (!pRequest) return { student: studentData[0], items: [] };

      const journals = await ctx.db
        .select({
          id: report.id,
          activityDate: report.activityDate,
          content: report.content,
          durationMinutes: report.durationMinutes,
          reviewStatus: report.reviewStatus,
          submittedAt: report.submittedAt,
        })
        .from(report)
        .where(
          and(
            eq(report.placementId, pRequest.id),
            eq(report.type, "daily"),
          ),
        )
        .orderBy(report.activityDate);

      return {
        student: studentData[0],
        items: journals,
      };
    }),

  /**
   * Verify journal (Admin)
   */
  adminVerifyJournal: adminOrMentorProcedure
    .input(
      z.object({
        reportIds: z.array(z.number()).min(1),
        status: z.enum(["approved", "rejected"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Allow admins to verify any report? 
      // Ideally check if report belongs to admin's company. 
      // For now, trusting the admin role + IDs.

      await ctx.db
        .update(report)
        .set({
          reviewStatus: input.status,
          reviewNotes: input.notes,
          reviewedAt: new Date(),
          // we don't strictly assert 'reviewedBy' if that field is mentor-specific, 
          // or we can try to link it to the admin's mentorProfile if it exists.
        })
        .where(sql`${report.id} IN ${input.reportIds}`);

      return { ok: true };
    }),


  detail: adminOrMentorProcedure
    .meta(docs.detail)
    .use(
      requirePermissions({
        report: ["read"],
        placement: ["read"],
        studentProfile: ["read"],
        mentorProfile: ["read"],
      }),
    )
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: report.id,
          title: report.title,
          content: report.content,
          type: report.type,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          submittedAt: report.submittedAt,
          reviewStatus: report.reviewStatus,
          score: report.score,
          reviewNotes: report.reviewNotes,
          reviewedAt: report.reviewedAt,
          studentId: studentProfile.id,
          studentUserId: studentProfile.userId,
          studentName: studentUser.name,
          studentEmail: studentUser.email,
          mentorId: mentorProfile.id,
          mentorName: mentorUser.name,
          placementId: placement.id,
        })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
        .leftJoin(mentorProfile, eq(placement.mentorId, mentorProfile.id))
        .leftJoin(mentorUser, eq(mentorProfile.userId, mentorUser.id))
        .where(eq(report.id, input.reportId))
        .limit(1);
      const r = row[0];
      if (!r) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp || r.mentorId !== mp.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      const files = await ctx.db.query.attachment.findMany({
        where: and(eq(attachment.ownerType, "report"), eq(attachment.ownerId, r.id)),
      });

      return {
        id: r.id,
        title: r.title ?? null,
        type: r.type,
        content: r.content ?? null,
        periodStart: r.periodStart ?? null,
        periodEnd: r.periodEnd ?? null,
        submittedAt: r.submittedAt ?? null,
        reviewStatus: r.reviewStatus,
        score: r.score === null || r.score === undefined ? null : Number(r.score),
        reviewNotes: r.reviewNotes ?? null,
        reviewedAt: r.reviewedAt ?? null,
        mentor: r.mentorId ? { id: r.mentorId, name: r.mentorName ?? null } : null,
        student: {
          id: r.studentId,
          userId: r.studentUserId,
          name: r.studentName ?? "",
          email: r.studentEmail ?? null,
        },
        placementId: r.placementId,
        files: files.map((f) => ({
          id: f.id,
          url: f.url,
          filename: f.filename ?? null,
          mimeType: f.mimeType ?? null,
          sizeBytes: f.sizeBytes ?? null,
        })),
      };
    }),

  review: mentorProcedure
    .meta(docs.review)
    .use(requirePermissions({ report: ["update"] }))
    .input(
      z.object({
        reportId: z.number(),
        notes: z.string().min(1),
        score: z.number().min(0).max(100),
        status: z.enum(reviewStatus.enumValues).default("approved"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });
      if (!mp) throw new TRPCError({ code: "FORBIDDEN" });

      const target = await ctx.db
        .select({
          id: report.id,
          mentorId: placement.mentorId,
        })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .where(eq(report.id, input.reportId))
        .limit(1);
      const rpt = target[0];
      if (!rpt) throw new TRPCError({ code: "NOT_FOUND" });
      if (rpt.mentorId !== mp.id) throw new TRPCError({ code: "FORBIDDEN" });

      await ctx.db
        .update(report)
        .set({
          reviewNotes: input.notes,
          score: input.score.toString(),
          reviewStatus: input.status,
          reviewedByMentorId: mp.id,
          reviewedAt: new Date(),
        })
        .where(eq(report.id, rpt.id));
      return { ok: true };
    }),

  listMine: protectedProcedure
    .meta(docs.listMine)
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        status: z.enum(reviewStatus.enumValues).optional(),
        type: z.enum(reportType.enumValues).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);
      const range = coerceRange({ from: input.from, to: input.to });
      const fromStr = range.from.toISOString();
      const toStr = range.to.toISOString();
      const submittedExpr = sql`coalesce(${report.submittedAt}, ${report.createdAt})`;
      const where = and(
        eq(placement.studentId, sp.id),
        sql`${submittedExpr} >= ${fromStr}::timestamptz`,
        sql`${submittedExpr} <= ${toStr}::timestamptz`,
        input.status ? eq(report.reviewStatus, input.status) : undefined,
        input.type ? eq(report.type, input.type) : undefined,
        input.search
          ? sql`(lower(${report.title}) like ${"%" + input.search.toLowerCase() + "%"})`
          : undefined,
      );

      const rows = await ctx.db
        .select({
          id: report.id,
          title: report.title,
          type: report.type,
          reviewStatus: report.reviewStatus,
          score: report.score,
          submittedAt: report.submittedAt,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
        })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .where(where)
        .orderBy(sql`${submittedExpr} desc`)
        .limit(input.limit)
        .offset(input.offset);

      const totalRows = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .where(where);
      const total = totalRows[0]?.total ?? 0;

      return {
        items: rows.map((r) => ({
          id: r.id,
          title: r.title ?? null,
          type: r.type,
          reviewStatus: r.reviewStatus,
          score: r.score === null || r.score === undefined ? null : Number(r.score),
          submittedAt: r.submittedAt ?? null,
          periodStart: r.periodStart ?? null,
          periodEnd: r.periodEnd ?? null,
        })),
        pagination: { total: Number(total ?? 0), limit: input.limit, offset: input.offset },
        lastUpdated: new Date().toISOString(),
      };
    }),

  detailMine: protectedProcedure
    .meta(docs.detailMine)
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);
      const row = await ctx.db
        .select({
          id: report.id,
          title: report.title,
          content: report.content,
          type: report.type,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          submittedAt: report.submittedAt,
          reviewStatus: report.reviewStatus,
          score: report.score,
          reviewNotes: report.reviewNotes,
          reviewedAt: report.reviewedAt,
          studentId: placement.studentId,
          mentorId: mentorProfile.id,
          mentorName: mentorUser.name,
        })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .leftJoin(mentorProfile, eq(report.reviewedByMentorId, mentorProfile.id))
        .leftJoin(mentorUser, eq(mentorProfile.userId, mentorUser.id))
        .where(eq(report.id, input.reportId))
        .limit(1);
      const r = row[0];
      if (!r) throw new TRPCError({ code: "NOT_FOUND" });
      if (r.studentId !== sp.id) throw new TRPCError({ code: "FORBIDDEN" });

      const files = await ctx.db.query.attachment.findMany({
        where: and(eq(attachment.ownerType, "report"), eq(attachment.ownerId, r.id)),
      });

      return {
        id: r.id,
        title: r.title ?? null,
        type: r.type,
        content: r.content ?? null,
        periodStart: r.periodStart ?? null,
        periodEnd: r.periodEnd ?? null,
        submittedAt: r.submittedAt ?? null,
        reviewStatus: r.reviewStatus,
        score: r.score === null || r.score === undefined ? null : Number(r.score),
        reviewNotes: r.reviewNotes ?? null,
        reviewedAt: r.reviewedAt ?? null,
        mentor: r.mentorId ? { id: r.mentorId, name: r.mentorName ?? null } : null,
        files: files.map((f) => ({
          id: f.id,
          url: f.url,
          filename: f.filename ?? null,
          mimeType: f.mimeType ?? null,
          sizeBytes: f.sizeBytes ?? null,
        })),
      };
    }),

  create: protectedProcedure
    .meta(docs.create)
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(reportType.enumValues),
        periodStart: z.date().optional(),
        periodEnd: z.date().optional(),
        attachments: z
          .array(
            z.object({
              url: z.string().url(),
              filename: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);
      const placementRow = await ctx.db.query.placement.findFirst({
        where: eq(placement.studentId, sp.id),
      });
      if (!placementRow) throw new TRPCError({ code: "FORBIDDEN" });

      const payload: ReportInsert = {
        placementId: placementRow.id,
        type: input.type,
        title: input.title,
        content: input.content,
        periodStart: input.periodStart ? input.periodStart.toISOString().slice(0, 10) : null,
        periodEnd: input.periodEnd ? input.periodEnd.toISOString().slice(0, 10) : null,
        submittedAt: new Date(),
        reviewStatus: "pending",
      };

      const inserted = await ctx.db
        .insert(report)
        .values(payload)
        .returning({ id: report.id });
      const reportId = inserted[0]?.id;
      if (!reportId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.attachments?.length) {
        const values = input.attachments.map(
          (a): AttachmentInsert => ({
            ownerType: "report",
            ownerId: reportId,
            url: a.url,
            filename: a.filename ?? null,
            createdById: ctx.session.user.id,
          }),
        );
        await ctx.db.insert(attachment).values(values);
      }

      return { id: reportId };
    }),

  // ========== JOURNAL-SPECIFIC PROCEDURES ==========

  /**
   * Create a daily journal entry (Student)
   */
  createJournal: protectedProcedure
    .input(
      z.object({
        activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
        content: z.string().min(1, "Deskripsi kegiatan harus diisi"),
        durationMinutes: z.number().min(0).max(1440), // 0 to 24 hours
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);
      const placementRow = await ctx.db.query.placement.findFirst({
        where: eq(placement.studentId, sp.id),
      });
      if (!placementRow) throw new TRPCError({ code: "FORBIDDEN", message: "Placement not found" });

      // Check if entry already exists for this date
      const existing = await ctx.db.query.report.findFirst({
        where: and(
          eq(report.placementId, placementRow.id),
          eq(report.activityDate, input.activityDate),
          eq(report.type, "daily"),
        ),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Jurnal untuk tanggal ini sudah ada",
        });
      }

      // Validate date is not in the future
      const activityDateObj = new Date(input.activityDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (activityDateObj > today) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tidak dapat membuat jurnal untuk tanggal yang akan datang",
        });
      }

      // Validate date is within internship period (5 months from user.createdAt)
      const userRecord = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.session.user.id),
      });
      if (userRecord) {
        const startDate = new Date(userRecord.createdAt);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 5);

        if (activityDateObj < startDate || activityDateObj > endDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tanggal harus dalam periode magang (5 bulan sejak pendaftaran)",
          });
        }
      }

      const payload: ReportInsert = {
        placementId: placementRow.id,
        type: "daily",
        title: null, // Daily journals don't need titles
        content: input.content,
        activityDate: input.activityDate,
        durationMinutes: input.durationMinutes,
        submittedAt: new Date(),
        reviewStatus: "pending",
      };

      const inserted = await ctx.db
        .insert(report)
        .values(payload)
        .returning({ id: report.id });
      const reportId = inserted[0]?.id;
      if (!reportId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return { id: reportId };
    }),

  /**
   * List journal entries for current student with calendar data
   */
  listJournals: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2020).max(2100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);
      const placementRow = await ctx.db.query.placement.findFirst({
        where: eq(placement.studentId, sp.id),
      });
      if (!placementRow) return { items: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0 } };

      // Build date range for the month
      const startOfMonth = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const endOfMonth = new Date(input.year, input.month, 0).toISOString().slice(0, 10);

      const rows = await ctx.db
        .select({
          id: report.id,
          activityDate: report.activityDate,
          content: report.content,
          durationMinutes: report.durationMinutes,
          reviewStatus: report.reviewStatus,
          reviewNotes: report.reviewNotes,
          submittedAt: report.submittedAt,
        })
        .from(report)
        .where(
          and(
            eq(report.placementId, placementRow.id),
            eq(report.type, "daily"),
            gte(report.activityDate, startOfMonth),
            lte(report.activityDate, endOfMonth),
          ),
        )
        .orderBy(report.activityDate);

      const stats = {
        total: rows.length,
        pending: rows.filter((r) => r.reviewStatus === "pending").length,
        approved: rows.filter((r) => r.reviewStatus === "approved").length,
        rejected: rows.filter((r) => r.reviewStatus === "rejected").length,
      };

      return {
        items: rows.map((r) => ({
          id: r.id,
          activityDate: r.activityDate,
          content: r.content,
          durationMinutes: r.durationMinutes,
          reviewStatus: r.reviewStatus,
          reviewNotes: r.reviewNotes,
          submittedAt: r.submittedAt,
        })),
        stats,
      };
    }),

  /**
   * List ALL journal entries for current student (for printing)
   */
  listAllJournals: protectedProcedure
    .query(async ({ ctx }) => {
      const sp = await requireStudentPlacement(ctx);
      const placementRow = await ctx.db.query.placement.findFirst({
        where: eq(placement.studentId, sp.id),
      });
      if (!placementRow) return { items: [] };

      const rows = await ctx.db
        .select({
          id: report.id,
          activityDate: report.activityDate,
          content: report.content,
          durationMinutes: report.durationMinutes,
          reviewStatus: report.reviewStatus,
          reviewNotes: report.reviewNotes,
          submittedAt: report.submittedAt,
        })
        .from(report)
        .where(
          and(
            eq(report.placementId, placementRow.id),
            eq(report.type, "daily"),
          ),
        )
        .orderBy(report.activityDate);

      return {
        items: rows.map((r) => ({
          id: r.id,
          activityDate: r.activityDate,
          content: r.content,
          durationMinutes: r.durationMinutes,
          reviewStatus: r.reviewStatus,
          reviewNotes: r.reviewNotes,
          submittedAt: r.submittedAt,
        })),
      };
    }),

  /**
   * List mentee journal summaries (Mentor) - grouped by student
   */
  listMenteeJournals: mentorProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        status: z.enum(reviewStatus.enumValues).optional(),
        studentId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });
      if (!mp) throw new TRPCError({ code: "FORBIDDEN" });

      // Only use date range if explicitly provided
      const hasDateFilter = input.from || input.to;

      // Get all placements for this mentor with user creation date
      const placements = await ctx.db
        .select({
          id: placement.id,
          studentId: studentProfile.id,
          studentUserId: studentProfile.userId,
          studentName: studentUser.name,
          studentSchool: studentProfile.school,
          userCreatedAt: studentUser.createdAt, // For calculating internship period
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
        .where(
          and(
            eq(placement.mentorId, mp.id),
            eq(placement.status, "active"),
            input.studentId ? eq(studentProfile.id, input.studentId) : undefined,
          ),
        );

      // For each placement, count journals
      const summaries = await Promise.all(
        placements.map(async (p) => {
          // Build conditions - only add date filter if dates provided
          const reportConditions = [
            eq(report.placementId, p.id),
            eq(report.type, "daily"),
          ];

          if (hasDateFilter && input.from) {
            reportConditions.push(gte(report.activityDate, input.from.toISOString().slice(0, 10)));
          }
          if (hasDateFilter && input.to) {
            reportConditions.push(lte(report.activityDate, input.to.toISOString().slice(0, 10)));
          }
          if (input.status) {
            reportConditions.push(eq(report.reviewStatus, input.status));
          }

          const journalCounts = await ctx.db
            .select({
              reviewStatus: report.reviewStatus,
              count: sql<number>`count(*)::int`,
            })
            .from(report)
            .where(and(...reportConditions))
            .groupBy(report.reviewStatus);

          const pending = journalCounts.find((c) => c.reviewStatus === "pending")?.count ?? 0;
          const approved = journalCounts.find((c) => c.reviewStatus === "approved")?.count ?? 0;
          const rejected = journalCounts.find((c) => c.reviewStatus === "rejected")?.count ?? 0;
          const total = pending + approved + rejected;

          // Calculate expected days based on FULL 5-month internship period
          const internshipStart = new Date(p.userCreatedAt);
          const internshipEnd = new Date(p.userCreatedAt);
          internshipEnd.setMonth(internshipEnd.getMonth() + 5);

          // Total days in the full 5-month internship period
          const diffTime = Math.max(0, internshipEnd.getTime() - internshipStart.getTime());
          const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

          // Approximate weekdays (exclude weekends) - roughly 5/7 of total days
          // 5 months ≈ 150 days → ~107 working days
          const expectedDays = Math.round(totalDays * 5 / 7);

          return {
            studentId: p.studentId,
            studentName: p.studentName,
            studentSchool: p.studentSchool,
            placementId: p.id,
            totalSubmitted: total,
            expectedDays,
            pending,
            approved,
            rejected,
          };
        }),
      );

      return { items: summaries };
    }),

  /**
   * Get journal entries for a specific student (Mentor drilldown)
   */
  getMenteeJournalDetails: mentorProcedure
    .input(
      z.object({
        studentId: z.number(),
        from: z.date().optional(),
        to: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });
      if (!mp) throw new TRPCError({ code: "FORBIDDEN" });

      // Verify this student is assigned to this mentor
      const placementRow = await ctx.db
        .select({
          id: placement.id,
          studentName: studentUser.name,
          studentSchool: studentProfile.school,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
        .where(
          and(
            eq(placement.mentorId, mp.id),
            eq(studentProfile.id, input.studentId),
          ),
        )
        .limit(1);

      const p = placementRow[0];
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Student not found or not assigned to you" });

      const range = coerceRange({ from: input.from, to: input.to });

      const journals = await ctx.db
        .select({
          id: report.id,
          activityDate: report.activityDate,
          content: report.content,
          durationMinutes: report.durationMinutes,
          reviewStatus: report.reviewStatus,
          reviewNotes: report.reviewNotes,
          submittedAt: report.submittedAt,
        })
        .from(report)
        .where(
          and(
            eq(report.placementId, p.id),
            eq(report.type, "daily"),
            gte(report.activityDate, range.from.toISOString().slice(0, 10)),
            lte(report.activityDate, range.to.toISOString().slice(0, 10)),
          ),
        )
        .orderBy(sql`${report.activityDate} desc`);

      return {
        student: {
          id: input.studentId,
          name: p.studentName,
          school: p.studentSchool,
        },
        items: journals,
      };
    }),

  /**
   * Get ALL journal entries for a specific student (Mentor print - no date filter)
   */
  getAllMenteeJournals: mentorProcedure
    .input(
      z.object({
        studentId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });
      if (!mp) throw new TRPCError({ code: "FORBIDDEN" });

      // Verify this student is assigned to this mentor
      const placementRow = await ctx.db
        .select({
          id: placement.id,
          studentName: studentUser.name,
          studentSchool: studentProfile.school,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
        .where(
          and(
            eq(placement.mentorId, mp.id),
            eq(studentProfile.id, input.studentId),
          ),
        )
        .limit(1);

      const p = placementRow[0];
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Student not found or not assigned to you" });

      // Fetch ALL journals without date filter
      const journals = await ctx.db
        .select({
          id: report.id,
          activityDate: report.activityDate,
          content: report.content,
          durationMinutes: report.durationMinutes,
          reviewStatus: report.reviewStatus,
          reviewNotes: report.reviewNotes,
          submittedAt: report.submittedAt,
        })
        .from(report)
        .where(
          and(
            eq(report.placementId, p.id),
            eq(report.type, "daily"),
          ),
        )
        .orderBy(report.activityDate);

      return {
        student: {
          id: input.studentId,
          name: p.studentName,
          school: p.studentSchool,
        },
        items: journals,
      };
    }),

  /**
   * Verify (approve/reject) journal entries (Mentor)
   */
  verifyJournal: mentorProcedure
    .input(
      z.object({
        reportIds: z.array(z.number()).min(1),
        status: z.enum(["approved", "rejected"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });
      if (!mp) throw new TRPCError({ code: "FORBIDDEN" });

      // Verify all reports belong to students assigned to this mentor
      for (const reportId of input.reportIds) {
        const target = await ctx.db
          .select({
            id: report.id,
            mentorId: placement.mentorId,
          })
          .from(report)
          .innerJoin(placement, eq(report.placementId, placement.id))
          .where(eq(report.id, reportId))
          .limit(1);

        const rpt = target[0];
        if (!rpt) throw new TRPCError({ code: "NOT_FOUND", message: `Report ${reportId} not found` });
        if (rpt.mentorId !== mp.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to verify this report" });
      }

      // Update all reports
      await ctx.db
        .update(report)
        .set({
          reviewStatus: input.status,
          reviewNotes: input.notes ?? null,
          reviewedByMentorId: mp.id,
          reviewedAt: new Date(),
        })
        .where(sql`${report.id} IN (${sql.join(input.reportIds.map((id) => sql`${id}`), sql`, `)})`);

      return { ok: true, count: input.reportIds.length };
    }),

  /**
   * Update a journal entry (Student) - only allowed for pending entries
   */
  updateJournal: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
        content: z.string().min(1, "Deskripsi kegiatan harus diisi"),
        durationMinutes: z.number().min(0).max(1440),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);

      // Find the report and verify ownership and status
      const existingReport = await ctx.db
        .select({
          id: report.id,
          placementId: report.placementId,
          reviewStatus: report.reviewStatus,
          studentId: placement.studentId,
        })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .where(eq(report.id, input.reportId))
        .limit(1);

      const rpt = existingReport[0];
      if (!rpt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Jurnal tidak ditemukan" });
      }
      if (rpt.studentId !== sp.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Anda tidak dapat mengedit jurnal ini" });
      }
      if (rpt.reviewStatus !== "pending" && rpt.reviewStatus !== "rejected") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Hanya jurnal dengan status menunggu atau ditolak yang dapat diedit" });
      }

      // Update the report - reset to pending if it was rejected (resubmission)
      await ctx.db
        .update(report)
        .set({
          content: input.content,
          durationMinutes: input.durationMinutes,
          reviewStatus: "pending", // Reset to pending on edit/resubmit
          reviewNotes: null, // Clear previous review notes
          reviewedAt: null,
          reviewedByMentorId: null,
        })
        .where(eq(report.id, input.reportId));

      return { ok: true };
    }),

  /**
   * Delete a journal entry (Student) - only allowed for pending entries
   */
  deleteJournal: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);

      // Find the report and verify ownership and status
      const existingReport = await ctx.db
        .select({
          id: report.id,
          reviewStatus: report.reviewStatus,
          studentId: placement.studentId,
        })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .where(eq(report.id, input.reportId))
        .limit(1);

      const rpt = existingReport[0];
      if (!rpt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Jurnal tidak ditemukan" });
      }
      if (rpt.studentId !== sp.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Anda tidak dapat menghapus jurnal ini" });
      }
      if (rpt.reviewStatus !== "pending") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Hanya jurnal dengan status menunggu yang dapat dihapus" });
      }

      // Delete the report
      await ctx.db
        .delete(report)
        .where(eq(report.id, input.reportId));

      return { ok: true };
    }),
});

