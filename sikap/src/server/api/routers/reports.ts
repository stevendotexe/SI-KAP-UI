import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { and, eq, gte, lte, sql } from "drizzle-orm";
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
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const sp = await ctx.db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, ctx.session.user.id),
  });
  if (!sp) throw new TRPCError({ code: "FORBIDDEN" });
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
    .meta(docs.list)
    .use(
      requirePermissions({
        report: ["read"],
        placement: ["read"],
        studentProfile: ["read"],
      }),
    )
    .input(
      z.object({
        companyId: z.number(),
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
      let mentorFilterId = input.mentorId;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
      }

      const submittedExpr = sql`coalesce(${report.submittedAt}, ${report.createdAt})`;
      const where = and(
        eq(placement.companyId, input.companyId),
        input.from ? gte(submittedExpr, input.from) : undefined,
        input.to ? lte(submittedExpr, input.to) : undefined,
        mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
        input.status ? eq(report.reviewStatus, input.status) : undefined,
        input.search
          ? sql`(lower(${report.title}) like ${"%" + input.search.toLowerCase() + "%"} or lower(${studentUser.name}) like ${"%" + input.search.toLowerCase() + "%"})`
          : undefined,
      );

      const rows = await ctx.db
        .select({
          id: report.id,
          title: report.title,
          content: report.content,
          type: report.type,
          submittedAt: report.submittedAt,
          reviewStatus: report.reviewStatus,
          score: report.score,
          studentId: studentProfile.id,
          studentUserId: studentProfile.userId,
          studentName: studentUser.name,
          mentorId: mentorProfile.id,
          mentorName: mentorUser.name,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
        })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
        .leftJoin(mentorProfile, eq(placement.mentorId, mentorProfile.id))
        .leftJoin(mentorUser, eq(mentorProfile.userId, mentorUser.id))
        .where(where)
        .orderBy(sql`${submittedExpr} desc`)
        .limit(input.limit)
        .offset(input.offset);

      const totalRows = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
        .leftJoin(mentorProfile, eq(placement.mentorId, mentorProfile.id))
        .leftJoin(mentorUser, eq(mentorProfile.userId, mentorUser.id))
        .where(where);
      const total = totalRows[0]?.total ?? 0;

      return {
        items: rows.map((r) => ({
          id: r.id,
          title: r.title ?? null,
          summary: r.content ? r.content.slice(0, 180) : null,
          type: r.type,
          reviewStatus: r.reviewStatus,
          score: r.score === null || r.score === undefined ? null : Number(r.score),
          submittedAt: r.submittedAt ?? null,
          periodStart: r.periodStart ?? null,
          periodEnd: r.periodEnd ?? null,
          student: {
            id: r.studentId,
            userId: r.studentUserId,
            name: r.studentName ?? "",
          },
          mentor: r.mentorId ? { id: r.mentorId, name: r.mentorName ?? null } : null,
        })),
        pagination: { total: Number(total ?? 0), limit: input.limit, offset: input.offset },
        lastUpdated: new Date().toISOString(),
      };
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
});
