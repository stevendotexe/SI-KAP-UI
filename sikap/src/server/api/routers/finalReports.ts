import { z } from "zod";
import { and, eq, ilike, sql, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { adminOrMentorProcedure, createTRPCRouter, requirePermissions } from "@/server/api/trpc";
import {
  finalReport,
  finalReportScore,
  placement,
  studentProfile,
  user,
  competencyTemplate,
  mentorProfile,
  type FinalReportScoreInsert,
} from "@/server/db/schema";

/**
 * TODO: Add endpoint to fetch competency templates by major
 * 
 * Required for frontend to display score input forms for new final reports.
 * 
 * Suggested procedure:
 * ```
 * getCompetencyTemplates: adminOrMentorProcedure
 *   .input(z.object({ major: z.string() })) // e.g., "TKJ" or "RPL"
 *   .query(async ({ ctx, input }) => {
 *     const templates = await ctx.db.query.competencyTemplate.findMany({
 *       where: eq(competencyTemplate.major, input.major),
 *       orderBy: [competencyTemplate.category, competencyTemplate.position]
 *     });
 *     return {
 *       personality: templates.filter(t => t.category === 'personality'),
 *       technical: templates.filter(t => t.category === 'technical')
 *     };
 *   })
 * ```
 * 
 * Also ensure competency templates are seeded in the database (currently missing in seed.ts).
 * Example seed data:
 * - Personality (both majors): Disiplin, Inisiatif, Tanggung Jawab, Kerja Sama, Kerajinan
 * - Technical TKJ: Penerapan KSLH, Menginstalasi sistem operasi, Perbaikan peripheral, etc.
 * - Technical RPL: Penerapan KSLH, Pemrograman Dasar, Basis Data, Pemrograman Web, etc.
 */

const docs = {
  list: {
    description:
      "## List Final Reports\n\nAdmin melihat semua, mentor hanya mentee-nya. Filter angkatan/status dan search nama/kode.\n\n### Parameters\n- `cohort` (string, optional)\n- `status` (placement_status, optional)\n- `search` (string, optional; nama atau kode siswa)\n- `limit` (1-200, default 50)\n- `offset` (>=0, default 0)\n\n### Response\n`{ items, pagination, lastUpdated }` dengan total/average skor dihitung dari skor kompetensi.\n\n### Example (React)\n```ts\nconst { data } = api.finalReports.list.useQuery({ cohort: '2024', status: 'completed' });\n```",
  },
  detail: {
    description:
      "## Detail Final Report\n\nDetail rapor akhir (kompetensi kepribadian & kejuruan) beserta total dan rata-rata.\n\n### Parameters\n- `finalReportId` (number)\n\n### Response\n`{ student, placementStatus, cohort, scores: { personality[], technical[] }, totalScore, averageScore, lastUpdated }`.\n\n### Example (React)\n```ts\nconst { data } = api.finalReports.detail.useQuery({ finalReportId: 1 });\n```",
  },
  upsertScores: {
    description:
      "## Upsert Final Report Scores\n\nAdmin/Mentor isi/ubah skor kompetensi. Membuat final report jika belum ada untuk placement tersebut.\n\n### Parameters\n- `placementId` (number)\n- `scores` (array `{ competencyTemplateId: number, score: number }`)\n\n### Response\n`{ finalReportId, totalScore, averageScore }`.",
  },
};

async function enforceMentorScope(ctx: any, placementId: number) {
  if (ctx.session.user.role !== "mentor") return;
  const p = await ctx.db.query.placement.findFirst({ where: eq(placement.id, placementId) });
  if (!p || p.mentorId !== (await getMentorId(ctx))) throw new TRPCError({ code: "FORBIDDEN" });
}

async function getMentorId(ctx: any) {
  const mp = await ctx.db.query.mentorProfile.findFirst({ where: eq(mentorProfile.userId, ctx.session.user.id) });
  return mp?.id ?? null;
}

export const finalReportsRouter = createTRPCRouter({
  list: adminOrMentorProcedure
    .meta(docs.list)
    .use(requirePermissions({ finalReport: ["read"], placement: ["read"], studentProfile: ["read"] }))
    .input(
      z.object({
        cohort: z.string().optional(),
        status: z.enum(["active", "completed", "canceled"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      let mentorId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({ where: eq(mentorProfile.userId, ctx.session.user.id) });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorId = mp.id;
      }

      const where = and(
        input.cohort ? eq(studentProfile.cohort, input.cohort) : undefined,
        input.status ? eq(placement.status, input.status) : undefined,
        mentorId ? eq(placement.mentorId, mentorId) : undefined,
        input.search
          ? or(
            ilike(user.name, `%${input.search}%`),
            ilike(studentProfile.nis, `%${input.search}%`),
          )
          : undefined,
      );

      const rows = await ctx.db
        .select({
          id: finalReport.id,
          placementId: placement.id,
          studentName: user.name,
          studentCode: studentProfile.nis,
          school: studentProfile.school,
          cohort: studentProfile.cohort,
          status: placement.status,
          total: sql<number>`coalesce(sum(${finalReportScore.score}),0)`,
          count: sql<number>`count(${finalReportScore.id})`,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .leftJoin(finalReport, eq(finalReport.placementId, placement.id))
        .leftJoin(finalReportScore, eq(finalReportScore.finalReportId, finalReport.id))
        .where(where)
        .groupBy(
          finalReport.id,
          placement.id,
          user.name,
          studentProfile.nis,
          studentProfile.school,
          studentProfile.cohort,
          placement.status,
        )
        .limit(input.limit)
        .offset(input.offset);

      const countRows = await ctx.db
        .select({ total: sql<number>`count(distinct ${placement.id})` })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .leftJoin(finalReport, eq(finalReport.placementId, placement.id))
        .where(where);

      return {
        items: rows.map((r) => {
          const total = Number(r.total ?? 0);
          const cnt = Number(r.count ?? 0);
          return {
            id: r.id,
            placementId: r.placementId, // Use placementId as unique key since id (finalReportId) can be null
            studentName: r.studentName ?? "",
            studentCode: r.studentCode ?? "",
            school: r.school ?? null,
            cohort: r.cohort ?? null,
            status: r.status,
            totalScore: total,
            averageScore: cnt === 0 ? 0 : Number((total / cnt).toFixed(2)),
          };
        }),
        pagination: { total: Number(countRows[0]?.total ?? 0), limit: input.limit, offset: input.offset },
        lastUpdated: new Date().toISOString(),
      };
    }),

  detail: adminOrMentorProcedure
    .meta(docs.detail)
    .use(requirePermissions({ finalReport: ["read"], placement: ["read"], studentProfile: ["read"] }))
    .input(z.object({ placementId: z.number() }))
    .query(async ({ ctx, input }) => {
      // 1. Validate mentor access first
      if (ctx.session.user.role === "mentor") {
        await enforceMentorScope(ctx, input.placementId);
      }

      // 2. Get Placement + Student Info
      const row = await ctx.db
        .select({
          placementId: placement.id,
          status: placement.status,
          studentId: studentProfile.id,
          studentName: user.name,
          studentCode: studentProfile.nis,
          school: studentProfile.school,
          cohort: studentProfile.cohort,
          major: studentProfile.major,
          finalReportId: finalReport.id, // Can be null
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .leftJoin(finalReport, eq(finalReport.placementId, placement.id))
        .where(eq(placement.id, input.placementId))
        .limit(1);

      const p = row[0];
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Placement info not found" });

      // 3. Get Scores (if final report exists)
      let personality: { id: number; name: string; score: number }[] = [];
      let technical: { id: number; name: string; score: number }[] = [];
      let totalScore = 0;
      let averageScore = 0;

      if (p.finalReportId) {
        const scores = await ctx.db
          .select({
            id: finalReportScore.id,
            competencyId: competencyTemplate.id,
            name: competencyTemplate.name,
            category: competencyTemplate.category,
            major: competencyTemplate.major,
            score: finalReportScore.score,
          })
          .from(finalReportScore)
          .innerJoin(competencyTemplate, eq(finalReportScore.competencyTemplateId, competencyTemplate.id))
          .where(eq(finalReportScore.finalReportId, p.finalReportId))
          .orderBy(competencyTemplate.position, competencyTemplate.id);

        const pScores = scores.filter((s) => s.category === "personality");
        const tScores = scores.filter((s) => s.category === "technical");

        personality = pScores.map((s) => ({ id: s.competencyId, name: s.name, score: Number(s.score ?? 0) }));
        technical = tScores.map((s) => ({ id: s.competencyId, name: s.name, score: Number(s.score ?? 0) }));

        totalScore = scores.reduce((acc, s) => acc + Number(s.score ?? 0), 0);
        averageScore = scores.length === 0 ? 0 : Number((totalScore / scores.length).toFixed(2));
      } else {
        // Fetch templates for new report
        const templates = await ctx.db
          .select()
          .from(competencyTemplate)
          .orderBy(competencyTemplate.position);

        // Filter relevant templates
        const pTemplates = templates.filter(t => t.category === "personality" && (t.major === "GENERAL" || t.major === null));
        const tTemplates = templates.filter(t => t.category === "technical" && t.major === p.major);

        personality = pTemplates.map(t => ({ id: t.id, name: t.name, score: 0 }));
        technical = tTemplates.map(t => ({ id: t.id, name: t.name, score: 0 }));
      }

      return {
        id: p.finalReportId, // Can be null
        placementId: p.placementId,
        student: {
          id: p.studentId,
          name: p.studentName ?? "",
          code: p.studentCode ?? "",
          school: p.school ?? null,
          cohort: p.cohort ?? null,
          major: p.major ?? null,
        },
        placementStatus: p.status,
        scores: {
          personality,
          technical,
        },
        totalScore,
        averageScore,
        lastUpdated: new Date().toISOString(),
      };
    }),

  upsertScores: adminOrMentorProcedure
    .meta(docs.upsertScores)
    .use(requirePermissions({ finalReport: ["update"], placement: ["read"] }))
    .input(
      z.object({
        placementId: z.number(),
        scores: z.array(
          z.object({
            competencyTemplateId: z.number(),
            score: z.number().min(0),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role === "mentor") await enforceMentorScope(ctx, input.placementId);

      let fr = await ctx.db.query.finalReport.findFirst({ where: eq(finalReport.placementId, input.placementId) });
      if (!fr) {
        const inserted = await ctx.db
          .insert(finalReport)
          .values({ placementId: input.placementId, submittedAt: new Date() })
          .returning({
            id: finalReport.id,
            placementId: finalReport.placementId,
            title: finalReport.title,
            content: finalReport.content,
            submittedAt: finalReport.submittedAt,
            approvedByMentorId: finalReport.approvedByMentorId,
            approvedAt: finalReport.approvedAt,
            grade: finalReport.grade,
            totalScore: finalReport.totalScore,
            averageScore: finalReport.averageScore,
            createdAt: finalReport.createdAt,
          });
        fr = inserted[0];
      }
      if (!fr?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.db.delete(finalReportScore).where(eq(finalReportScore.finalReportId, fr.id));
      if (input.scores.length) {
        const values: FinalReportScoreInsert[] = input.scores.map((s) => ({
          finalReportId: fr.id,
          competencyTemplateId: s.competencyTemplateId,
          score: s.score.toString(),
        }));
        await ctx.db.insert(finalReportScore).values(values);
      }

      const agg = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${finalReportScore.score}),0)`,
          count: sql<number>`count(${finalReportScore.id})`,
        })
        .from(finalReportScore)
        .where(eq(finalReportScore.finalReportId, fr.id));
      const total = Number(agg[0]?.total ?? 0);
      const count = Number(agg[0]?.count ?? 0);
      const avg = count === 0 ? 0 : Number((total / count).toFixed(2));

      await ctx.db
        .update(finalReport)
        .set({ totalScore: total.toString(), averageScore: avg.toString() })
        .where(eq(finalReport.id, fr.id));

      return { finalReportId: fr.id, totalScore: total, averageScore: avg };
    }),

  /**
   * Get student attendance and score trends per month for charts
   */
  getStudentTrends: adminOrMentorProcedure
    .use(requirePermissions({ attendanceLog: ["read"], placement: ["read"] }))
    .input(z.object({ placementId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Validate mentor access
      if (ctx.session.user.role === "mentor") {
        await enforceMentorScope(ctx, input.placementId);
      }

      // Import attendanceLog table
      const { attendanceLog } = await import("@/server/db/schema");

      // Get attendance stats grouped by month
      const attendanceRows = await ctx.db
        .select({
          month: sql<string>`to_char(${attendanceLog.date}::date, 'YYYY-MM')`,
          total: sql<number>`count(*)`,
          present: sql<number>`count(*) filter (where ${attendanceLog.status} in ('present', 'late'))`,
        })
        .from(attendanceLog)
        .where(eq(attendanceLog.placementId, input.placementId))
        .groupBy(sql`to_char(${attendanceLog.date}::date, 'YYYY-MM')`)
        .orderBy(sql`to_char(${attendanceLog.date}::date, 'YYYY-MM')`);

      // Calculate attendance percentage per month
      const attendanceTrend = attendanceRows.map((row) => ({
        period: row.month,
        count: row.total > 0 ? Math.round((row.present / row.total) * 100) : 0,
      }));

      // Get score history - we don't have historical scores, so just return current score as placeholder
      // In a full implementation, you'd track score changes over time
      const fr = await ctx.db.query.finalReport.findFirst({
        where: eq(finalReport.placementId, input.placementId),
      });

      let scoreTrend: { period: string; count: number }[] = [];
      if (fr) {
        const scores = await ctx.db
          .select({ score: finalReportScore.score })
          .from(finalReportScore)
          .where(eq(finalReportScore.finalReportId, fr.id));

        const totalScore = scores.reduce((acc, s) => acc + Number(s.score ?? 0), 0);
        const avgScore = scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

        // Create score trend matching attendance months (or default 6 months)
        const months = attendanceTrend.length > 0
          ? attendanceTrend.map(a => a.period)
          : Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return d.toISOString().slice(0, 7);
          });

        scoreTrend = months.map((period) => ({
          period,
          count: avgScore, // Same score for all months since we don't track history
        }));
      }

      return {
        attendanceTrend,
        scoreTrend,
      };
    }),
});
