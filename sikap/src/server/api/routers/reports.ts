import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  adminOrMentorProcedure,
  createTRPCRouter,
  mentorProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import {
  attachment,
  mentorProfile,
  placement,
  report,
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
};

const studentUser = alias(user, "student_user");
const mentorUser = alias(user, "mentor_user");

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
      const submittedExpr = sql`coalesce(${report.submittedAt}, ${report.createdAt})`;
      const where = and(
        eq(placement.companyId, input.companyId),
        input.from ? gte(submittedExpr, input.from) : undefined,
        input.to ? lte(submittedExpr, input.to) : undefined,
        input.mentorId ? eq(placement.mentorId, input.mentorId) : undefined,
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
});
