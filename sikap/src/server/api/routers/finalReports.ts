import { z } from "zod";
import { and, eq, ilike, sql } from "drizzle-orm";
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
        input.search ? ilike(user.name, `%${input.search}%`) : undefined,
      );

      const rows = await ctx.db
        .select({
          id: finalReport.id,
          placementId: placement.id,
          studentName: user.name,
          studentCode: user.id,
          school: studentProfile.school,
          cohort: studentProfile.cohort,
          status: placement.status,
          total: sql<number>`coalesce(sum(${finalReportScore.score}),0)`,
          count: sql<number>`count(${finalReportScore.id})`,
        })
        .from(finalReport)
        .innerJoin(placement, eq(finalReport.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .leftJoin(finalReportScore, eq(finalReportScore.finalReportId, finalReport.id))
        .where(where)
        .groupBy(
          finalReport.id,
          placement.id,
          user.name,
          user.id,
          studentProfile.school,
          studentProfile.cohort,
          placement.status,
        )
        .limit(input.limit)
        .offset(input.offset);

      const countRows = await ctx.db
        .select({ total: sql<number>`count(distinct ${finalReport.id})` })
        .from(finalReport)
        .innerJoin(placement, eq(finalReport.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(where);

      return {
        items: rows.map((r) => {
          const total = Number(r.total ?? 0);
          const cnt = Number(r.count ?? 0);
          return {
            id: r.id,
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
    .input(z.object({ finalReportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: finalReport.id,
          placementId: placement.id,
          studentId: studentProfile.id,
          studentName: user.name,
          studentCode: user.id,
          school: studentProfile.school,
          cohort: studentProfile.cohort,
          status: placement.status,
          major: studentProfile.major,
        })
        .from(finalReport)
        .innerJoin(placement, eq(finalReport.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(eq(finalReport.id, input.finalReportId))
        .limit(1);
      const fr = row[0];
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.session.user.role === "mentor") {
        const p = await ctx.db.query.placement.findFirst({ where: eq(placement.id, fr.placementId) });
        if (!p || p.mentorId !== (await getMentorId(ctx))) throw new TRPCError({ code: "FORBIDDEN" });
      }

      const scores = await ctx.db
        .select({
          id: finalReportScore.id,
          competencyId: competencyTemplate.id,
          name: competencyTemplate.name,
          category: competencyTemplate.category,
          major: competencyTemplate.major,
          score: finalReportScore.score,
          weight: competencyTemplate.weight,
        })
        .from(finalReportScore)
        .innerJoin(competencyTemplate, eq(finalReportScore.competencyTemplateId, competencyTemplate.id))
        .where(eq(finalReportScore.finalReportId, input.finalReportId))
        .orderBy(competencyTemplate.position, competencyTemplate.id);

      const personality = scores.filter((s) => s.category === "personality");
      const technical = scores.filter((s) => s.category === "technical");
      const totalScore = scores.reduce((acc, s) => acc + Number(s.score ?? 0), 0);
      const avgScore = scores.length === 0 ? 0 : Number((totalScore / scores.length).toFixed(2));

      return {
        id: fr.id,
        placementId: fr.placementId,
        student: {
          id: fr.studentId,
          name: fr.studentName ?? "",
          code: fr.studentCode ?? "",
          school: fr.school ?? null,
          cohort: fr.cohort ?? null,
          major: fr.major ?? null,
        },
        placementStatus: fr.status,
        scores: {
          personality: personality.map((p) => ({ id: p.competencyId, name: p.name, score: Number(p.score ?? 0) })),
          technical: technical.map((p) => ({ id: p.competencyId, name: p.name, score: Number(p.score ?? 0) })),
        },
        totalScore,
        averageScore: avgScore,
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
});
