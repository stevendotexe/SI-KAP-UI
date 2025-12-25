import { z } from "zod";
import { and, eq, ilike, sql, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  adminOrMentorProcedure,
  createTRPCRouter,
  protectedProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import {
  finalReport,
  finalReportScore,
  placement,
  studentProfile,
  user,
  competencyTemplate,
  mentorProfile,
  certificate,
  company,
  task,
  taskCompetencyImpact,
  type FinalReportScoreInsert,
  type CertificateInsert,
  attachment,
} from "@/server/db/schema";

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
  const p = await ctx.db.query.placement.findFirst({
    where: eq(placement.id, placementId),
  });
  if (!p || p.mentorId !== (await getMentorId(ctx)))
    throw new TRPCError({ code: "FORBIDDEN" });
}

async function getMentorId(ctx: any) {
  const mp = await ctx.db.query.mentorProfile.findFirst({
    where: eq(mentorProfile.userId, ctx.session.user.id),
  });
  return mp?.id ?? null;
}

export const finalReportsRouter = createTRPCRouter({
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
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
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
          studentName: finalReport.studentName,
          studentNis: finalReport.studentNis,
          schoolName: finalReport.schoolName,
          status: finalReport.status,
          total: sql<number>`coalesce(sum(${finalReportScore.score}),0)`,
          count: sql<number>`count(${finalReportScore.id})`,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .innerJoin(finalReport, eq(finalReport.placementId, placement.id))
        .leftJoin(
          finalReportScore,
          eq(finalReportScore.finalReportId, finalReport.id),
        )
        .where(where)
        .groupBy(
          finalReport.id,
          placement.id,
          finalReport.studentName,
          finalReport.studentNis,
          finalReport.schoolName,
          finalReport.status,
        )
        .limit(input.limit)
        .offset(input.offset);

      const countRows = await ctx.db
        .select({ total: sql<number>`count(distinct ${finalReport.id})` })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .innerJoin(finalReport, eq(finalReport.placementId, placement.id))
        .where(where);

      return {
        items: rows.map((r) => {
          const total = Number(r.total ?? 0);
          const cnt = Number(r.count ?? 0);
          return {
            id: r.id,
            studentName: r.studentName ?? "",
            studentNis: r.studentNis ?? "",
            schoolName: r.schoolName ?? "",
            status: r.status ?? "draft",
            totalScore: total,
            averageScore: cnt === 0 ? 0 : Number((total / cnt).toFixed(2)),
          };
        }),
        pagination: {
          total: Number(countRows[0]?.total ?? 0),
          limit: input.limit,
          offset: input.offset,
        },
        lastUpdated: new Date().toISOString(),
      };
    }),

  /**
   * Get finalized report for the current student.
   */
  getStudentReport: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "student") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only students can use this endpoint",
      });
    }

    // Get student profile and active placement
    const p = await ctx.db.query.studentProfile.findFirst({
      where: eq(studentProfile.userId, ctx.session.user.id),
      with: {
        placements: {
          limit: 1,
        },
      },
    });

    if (!p || !p.placements?.[0]) {
      return null;
    }

    const activePlacement = p.placements[0];

    // Find finalized report for this placement
    const fr = await ctx.db.query.finalReport.findFirst({
      where: and(
        eq(finalReport.placementId, activePlacement.id),
        eq(finalReport.status, "finalized"),
      ),
      with: {
        scores: {
          with: {
            competency: true,
          },
        },
        certificate: true,
      },
    });

    if (!fr) {
      return null; // No finalized report yet
    }

    // Format certificate number if certificate exists
    let certificateNumber: string | null = null;
    if (fr.certificate) {
      const c = fr.certificate;
      const seq = String(c.sequenceNumber).padStart(3, "0");
      certificateNumber = `${seq}/${c.companyCode}/PKL/${c.month}/${c.year}`;
    }

    return {
      ...fr,
      certificateNumber,
    };
  }),

  // New endpoint: List all students for the mentor with their report status
  listStudentsWithReportStatus: adminOrMentorProcedure
    .use(
      requirePermissions({
        placement: ["read"],
        studentProfile: ["read"],
      }),
    )
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      let mentorId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorId = mp.id;
      }

      const where = and(
        mentorId ? eq(placement.mentorId, mentorId) : undefined,
        input.search
          ? or(
              ilike(user.name, `%${input.search}%`),
              ilike(studentProfile.nis, `%${input.search}%`),
            )
          : undefined,
      );

      // Get all students for mentor with LEFT JOIN to final_report
      const rows = await ctx.db
        .select({
          placementId: placement.id,
          studentProfileId: studentProfile.id,
          studentName: user.name,
          studentNis: studentProfile.nis,
          school: studentProfile.school,
          cohort: studentProfile.cohort,
          placementStatus: placement.status,
          // Final report fields (may be null)
          reportId: finalReport.id,
          reportStatus: finalReport.status,
          reportStudentName: finalReport.studentName,
          reportStudentNis: finalReport.studentNis,
          reportSchoolName: finalReport.schoolName,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .leftJoin(finalReport, eq(finalReport.placementId, placement.id))
        .where(where)
        .limit(input.limit)
        .offset(input.offset);

      // Get scores for reports that exist
      const reportIds = rows.filter((r) => r.reportId).map((r) => r.reportId!);
      const scoresMap: Record<number, { total: number; count: number }> = {};

      if (reportIds.length > 0) {
        const scoresData = await ctx.db
          .select({
            reportId: finalReportScore.finalReportId,
            total: sql<number>`coalesce(sum(${finalReportScore.score}),0)`,
            count: sql<number>`count(${finalReportScore.id})`,
          })
          .from(finalReportScore)
          .where(
            sql`${finalReportScore.finalReportId} = ANY(ARRAY[${sql.join(reportIds, sql`, `)}]::int[])`,
          )
          .groupBy(finalReportScore.finalReportId);

        scoresData.forEach((s) => {
          scoresMap[s.reportId] = {
            total: Number(s.total ?? 0),
            count: Number(s.count ?? 0),
          };
        });
      }

      const countResult = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(where);

      return {
        items: rows.map((r) => {
          const scoreData = r.reportId ? scoresMap[r.reportId] : null;
          const total = scoreData?.total ?? 0;
          const cnt = scoreData?.count ?? 0;

          return {
            placementId: r.placementId,
            studentProfileId: r.studentProfileId,
            studentName: r.studentName ?? "",
            studentNis: r.studentNis ?? "",
            school: r.school ?? "",
            cohort: r.cohort ?? "",
            placementStatus: r.placementStatus,
            // Report info (null if no report)
            reportId: r.reportId ?? null,
            reportStatus: r.reportStatus ?? null, // null = no report, "draft", "finalized"
            totalScore: total,
            averageScore: cnt === 0 ? 0 : Number((total / cnt).toFixed(2)),
          };
        }),
        pagination: {
          total: Number(countResult[0]?.total ?? 0),
          limit: input.limit,
          offset: input.offset,
        },
      };
    }),

  detail: adminOrMentorProcedure
    .meta(docs.detail)
    .use(
      requirePermissions({
        finalReport: ["read"],
        placement: ["read"],
        studentProfile: ["read"],
      }),
    )
    .input(z.object({ finalReportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: finalReport.id,
          placementId: placement.id,
          studentId: studentProfile.id,
          studentName: user.name,
          studentCode: studentProfile.nis,
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
        const p = await ctx.db.query.placement.findFirst({
          where: eq(placement.id, fr.placementId),
        });
        if (!p || p.mentorId !== (await getMentorId(ctx)))
          throw new TRPCError({ code: "FORBIDDEN" });
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
        .innerJoin(
          competencyTemplate,
          eq(finalReportScore.competencyTemplateId, competencyTemplate.id),
        )
        .where(eq(finalReportScore.finalReportId, input.finalReportId))
        .orderBy(competencyTemplate.position, competencyTemplate.id);

      const personality = scores.filter((s) => s.category === "personality");
      const technical = scores.filter((s) => s.category === "technical");
      const totalScore = scores.reduce(
        (acc, s) => acc + Number(s.score ?? 0),
        0,
      );
      const avgScore =
        scores.length === 0
          ? 0
          : Number((totalScore / scores.length).toFixed(2));

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
          personality: personality.map((p) => ({
            id: p.competencyId,
            name: p.name,
            score: Number(p.score ?? 0),
          })),
          technical: technical.map((p) => ({
            id: p.competencyId,
            name: p.name,
            score: Number(p.score ?? 0),
          })),
        },
        totalScore,
        averageScore: avgScore,
        lastUpdated: new Date().toISOString(),
      };
    }),

  // Get full report by ID for editing
  getById: adminOrMentorProcedure
    .use(
      requirePermissions({
        finalReport: ["read"],
        placement: ["read"],
      }),
    )
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      console.log("[finalReports] getById:start", { id: input.id });
      // Get the full final report with all fields using explicit select
      const rows = await ctx.db
        .select()
        .from(finalReport)
        .where(eq(finalReport.id, input.id))
        .limit(1);
      const fr = rows[0];
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });

      console.log("[finalReports] getById:found", {
        id: fr.id,
        companyLogoUrl: fr.companyLogoUrl ? "exists" : "empty",
        mentorSignatureUrl: fr.mentorSignatureUrl ? "exists" : "empty",
        schoolLogoUrl: fr.schoolLogoUrl ? "exists" : "empty",
      });

      // Check mentor scope if applicable
      if (ctx.session.user.role === "mentor") {
        await enforceMentorScope(ctx, fr.placementId);
      }

      // Get placement info
      const placementRow = await ctx.db
        .select({
          placementId: placement.id,
          studentId: studentProfile.id,
          startDate: placement.startDate,
          endDate: placement.endDate,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .where(eq(placement.id, fr.placementId))
        .limit(1);

      // Get scores
      const scores = await ctx.db
        .select({
          competencyId: competencyTemplate.id,
          name: competencyTemplate.name,
          category: competencyTemplate.category,
          score: finalReportScore.score,
        })
        .from(finalReportScore)
        .innerJoin(
          competencyTemplate,
          eq(finalReportScore.competencyTemplateId, competencyTemplate.id),
        )
        .where(eq(finalReportScore.finalReportId, input.id))
        .orderBy(competencyTemplate.position);

      // Get certificate if exists
      const cert = await ctx.db.query.certificate.findFirst({
        where: eq(certificate.finalReportId, input.id),
      });

      const p = placementRow[0];

      return {
        id: fr.id,
        placementId: fr.placementId,
        studentProfileId: p?.studentId ?? null,
        status: fr.status,
        // Company info
        companyName: fr.companyName ?? "",
        companyLogoUrl: fr.companyLogoUrl ?? "",
        mentorName: fr.mentorName ?? "",
        mentorSignatureUrl: fr.mentorSignatureUrl ?? "",
        // Student info
        studentName: fr.studentName ?? "",
        studentNis: fr.studentNis ?? "",
        studentMajor: fr.studentMajor ?? "",
        studentGrade: fr.studentGrade ?? "XII (Dua Belas)",
        // School info
        schoolName: fr.schoolName ?? "",
        schoolLogoUrl: fr.schoolLogoUrl ?? "",
        programKeahlian: fr.programKeahlian ?? "",
        konsentrasiKeahlian: fr.konsentrasiKeahlian ?? "",
        bidangKeahlian: fr.bidangKeahlian ?? "",
        academicYear: fr.academicYear ?? "",
        place: fr.place ?? "",
        issuedAt: fr.issuedAt ?? null,
        // Scores
        scores: scores.map((s) => ({
          competencyId: s.competencyId,
          name: s.name ?? "",
          category: s.category ?? "technical",
          score: Number(s.score ?? 0),
        })),
        // Certificate data
        certificate: cert
          ? {
              id: cert.id,
              certificateNumber: `${String(cert.sequenceNumber).padStart(3, "0")}/${cert.companyCode}/PKL/${cert.month}/${cert.year}`,
              predicate: cert.predicate ?? "BAIK",
              sequenceNumber: cert.sequenceNumber,
              companyCode: cert.companyCode,
              issuedAt: cert.issuedAt ?? null,
              signerName: cert.signerName ?? "",
              signerRole: cert.signerRole ?? "Pembimbing",
            }
          : null,
        // Placement dates
        startDate: p?.startDate ?? null,
        endDate: p?.endDate ?? null,
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
      if (ctx.session.user.role === "mentor")
        await enforceMentorScope(ctx, input.placementId);

      let fr = await ctx.db.query.finalReport.findFirst({
        where: eq(finalReport.placementId, input.placementId),
      });
      if (!fr) {
        const inserted = await ctx.db
          .insert(finalReport)
          .values({ placementId: input.placementId, submittedAt: new Date() })
          .returning();
        fr = inserted[0];
      }
      if (!fr?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.db
        .delete(finalReportScore)
        .where(eq(finalReportScore.finalReportId, fr.id));
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

        const totalScore = scores.reduce(
          (acc, s) => acc + Number(s.score ?? 0),
          0,
        );
        const avgScore =
          scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

        // Create score trend matching attendance months (or default 6 months)
        const months =
          attendanceTrend.length > 0
            ? attendanceTrend.map((a) => a.period)
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

  /**
   * Get a draft of calculated scores for a student based on their task performance.
   * This calculates what scores would be based on tasks linked to competencies.
   */
  getDraft: adminOrMentorProcedure
    .use(requirePermissions({ task: ["read"], placement: ["read"] }))
    .input(z.object({ studentProfileId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Get placement from student profile
      const placementRow = await ctx.db
        .select({
          placementId: placement.id,
          studentId: studentProfile.id,
          studentName: user.name,
          studentNis: studentProfile.nis,
          studentMajor: studentProfile.major,
          school: studentProfile.school,
          cohort: studentProfile.cohort,
          companyId: company.id,
          companyName: company.name,
          mentorId: placement.mentorId,
          mentorUserId: mentorProfile.userId,
          startDate: placement.startDate,
          endDate: placement.endDate,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .innerJoin(company, eq(placement.companyId, company.id))
        .innerJoin(mentorProfile, eq(placement.mentorId, mentorProfile.id))
        .where(eq(studentProfile.id, input.studentProfileId))
        .limit(1);

      if (!placementRow[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Placement not found for this student",
        });
      }
      const p = placementRow[0];

      if (ctx.session.user.role === "mentor") {
        await enforceMentorScope(ctx, p.placementId);
      }

      const mentorUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, p.mentorUserId),
      });

      // Check if report already exists
      const existingReport = await ctx.db.query.finalReport.findFirst({
        where: eq(finalReport.placementId, p.placementId),
      });

      // --- DERIVE DEFAULTS FROM PREVIOUS REPORTS ---
      // 1. Get latest report from same company & school (most specific)
      const latestMatch = await ctx.db
        .select()
        .from(finalReport)
        .innerJoin(placement, eq(finalReport.placementId, placement.id))
        .where(
          and(
            eq(placement.companyId, p.companyId),
            eq(finalReport.schoolName, p.school ?? ""),
          ),
        )
        .orderBy(sql`${finalReport.submittedAt} DESC`)
        .limit(1);

      // 2. Get latest report by this mentor (to get signature)
      const latestMentorReport = await ctx.db
        .select()
        .from(finalReport)
        .innerJoin(placement, eq(finalReport.placementId, placement.id))
        .where(eq(placement.mentorId, p.mentorId)) // mentorId is what we need here
        .orderBy(sql`${finalReport.submittedAt} DESC`)
        .limit(1);

      // 3. Get latest report for this school (to get school logo)
      const latestSchoolReport = await ctx.db
        .select()
        .from(finalReport)
        .where(eq(finalReport.schoolName, p.school ?? ""))
        .orderBy(sql`${finalReport.submittedAt} DESC`)
        .limit(1);

      const match = latestMatch[0]?.final_report;
      const mentorReport = latestMentorReport[0]?.final_report;
      const schoolReport = latestSchoolReport[0];

      // Build derived snapshot if no existing report
      const derivedSnapshot = !existingReport
        ? {
            companyLogoUrl:
              match?.companyLogoUrl || mentorReport?.companyLogoUrl || "",
            mentorSignatureUrl:
              mentorReport?.mentorSignatureUrl ||
              match?.mentorSignatureUrl ||
              "",
            schoolLogoUrl:
              schoolReport?.schoolLogoUrl || match?.schoolLogoUrl || "",
            studentGrade: match?.studentGrade || "XII (Dua Belas)",
            studentMajor: match?.studentMajor || p.studentMajor || "",
            programKeahlian: match?.programKeahlian || "",
            konsentrasiKeahlian: match?.konsentrasiKeahlian || "",
            bidangKeahlian: match?.bidangKeahlian || "Teknologi Informasi",
            academicYear:
              match?.academicYear || schoolReport?.academicYear || "2024/2025",
            place:
              match?.place ||
              mentorReport?.place ||
              schoolReport?.place ||
              "Tasikmalaya",
            // Also derive mentor name if available
            mentorName: mentorReport?.mentorName || mentorUser?.name || "",
          }
        : null;
      // ----------------------------------------------

      // Get all competency templates for student's major
      const templates = await ctx.db
        .select()
        .from(competencyTemplate)
        .where(
          p.studentMajor
            ? sql`${competencyTemplate.major} LIKE ${"%" + p.studentMajor + "%"}`
            : undefined,
        )
        .orderBy(competencyTemplate.category, competencyTemplate.position);

      // Get tasks for this placement with their linked competencies
      const tasksWithScores = await ctx.db
        .select({
          taskId: task.id,
          score: task.score,
          competencyId: taskCompetencyImpact.competencyTemplateId,
        })
        .from(task)
        .leftJoin(
          taskCompetencyImpact,
          eq(task.id, taskCompetencyImpact.taskId),
        )
        .where(
          and(eq(task.placementId, p.placementId), eq(task.status, "approved")),
        );

      // Calculate average score per competency
      const competencyScores: Record<number, { total: number; count: number }> =
        {};
      for (const t of tasksWithScores) {
        if (t.competencyId && t.score) {
          const existing = competencyScores[t.competencyId] ?? {
            total: 0,
            count: 0,
          };
          existing.total += Number(t.score);
          existing.count += 1;
          competencyScores[t.competencyId] = existing;
        }
      }

      // Build draft scores
      const draftScores = templates.map((tmpl) => {
        const data = competencyScores[tmpl.id];
        const calculatedScore =
          data && data.count > 0 ? Math.round(data.total / data.count) : 0;
        return {
          competencyId: tmpl.id,
          competencyName: tmpl.name ?? "",
          category: tmpl.category ?? "technical",
          calculatedScore,
          taskCount: data?.count ?? 0,
        };
      });

      // --- Calculate next sequence number for certificate preview ---
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Default company code from mentor's previous reports or company name
      const defaultCompanyCode = mentorReport?.companyName
        ? mentorReport.companyName
            .toUpperCase()
            .replace(/\s+/g, "-")
            .slice(0, 20)
        : p.companyName.toUpperCase().replace(/\s+/g, "-").slice(0, 20);

      // Check if existing report has a certificate already
      let nextSequenceNumber = 1;
      let existingCompanyCode = defaultCompanyCode;

      if (existingReport) {
        // Check if certificate exists for this report
        const existingCert = await ctx.db.query.certificate.findFirst({
          where: eq(certificate.finalReportId, existingReport.id),
        });

        if (existingCert) {
          // Use existing certificate data
          nextSequenceNumber = existingCert.sequenceNumber;
          existingCompanyCode = existingCert.companyCode;
        } else {
          // Calculate next sequence for this company/month/year
          const lastCert = await ctx.db
            .select({ seq: certificate.sequenceNumber })
            .from(certificate)
            .where(
              and(
                eq(certificate.companyCode, defaultCompanyCode),
                eq(certificate.month, currentMonth),
                eq(certificate.year, currentYear),
              ),
            )
            .orderBy(sql`${certificate.sequenceNumber} DESC`)
            .limit(1);
          nextSequenceNumber = (lastCert[0]?.seq ?? 0) + 1;
        }
      } else {
        // No existing report, calculate next sequence
        const lastCert = await ctx.db
          .select({ seq: certificate.sequenceNumber })
          .from(certificate)
          .where(
            and(
              eq(certificate.companyCode, defaultCompanyCode),
              eq(certificate.month, currentMonth),
              eq(certificate.year, currentYear),
            ),
          )
          .orderBy(sql`${certificate.sequenceNumber} DESC`)
          .limit(1);
        nextSequenceNumber = (lastCert[0]?.seq ?? 0) + 1;
      }
      // ---------------------------------------------------------------

      return {
        placement: {
          id: p.placementId,
          startDate: p.startDate ?? null,
          endDate: p.endDate ?? null,
        },
        student: {
          id: p.studentId,
          name: p.studentName ?? "",
          nis: p.studentNis ?? "",
          major: p.studentMajor ?? "",
          school: p.school ?? "",
          cohort: p.cohort ?? "",
        },
        company: {
          id: p.companyId,
          name: p.companyName ?? "",
        },
        mentor: {
          name: mentorUser?.name ?? "",
        },
        reportId: existingReport?.id ?? null,
        // Certificate preview data
        certificatePreview: {
          nextSequenceNumber,
          companyCode: existingCompanyCode,
          month: currentMonth,
          year: currentYear,
        },
        existingSnapshot: existingReport
          ? {
              companyLogoUrl: existingReport.companyLogoUrl ?? "",
              mentorSignatureUrl: existingReport.mentorSignatureUrl ?? "",
              schoolLogoUrl: existingReport.schoolLogoUrl ?? "",
              studentGrade: existingReport.studentGrade ?? "XII (Dua Belas)",
              studentMajor: existingReport.studentMajor ?? "",
              programKeahlian: existingReport.programKeahlian ?? "",
              konsentrasiKeahlian: existingReport.konsentrasiKeahlian ?? "",
              bidangKeahlian:
                existingReport.bidangKeahlian ?? "Teknologi Informasi",
              academicYear: existingReport.academicYear ?? "2024/2025",
              place: existingReport.place ?? "Tasikmalaya",
              mentorName: existingReport.mentorName ?? "",
            }
          : derivedSnapshot,
        draftScores,
      };
    }),

  /**
   * Create a new final report draft for a placement.
   */
  create: adminOrMentorProcedure
    .use(requirePermissions({ finalReport: ["create"], placement: ["read"] }))
    .input(
      z.object({
        placementId: z.number(),
        // Snapshot data
        studentName: z.string().optional(),
        studentNis: z.string().optional(),
        studentMajor: z.string().optional(),
        studentGrade: z.string().optional(),
        schoolName: z.string().optional(),
        schoolLogoUrl: z.string().optional(),
        companyName: z.string().optional(),
        companyLogoUrl: z.string().optional(),
        mentorName: z.string().optional(),
        mentorSignatureUrl: z.string().optional(),
        programKeahlian: z.string().optional(),
        konsentrasiKeahlian: z.string().optional(),
        bidangKeahlian: z.string().optional(),
        academicYear: z.string().optional(),
        place: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role === "mentor") {
        await enforceMentorScope(ctx, input.placementId);
      }

      // Check if a report already exists - if so, just return it so we can transition to update mode
      const existing = await ctx.db.query.finalReport.findFirst({
        where: eq(finalReport.placementId, input.placementId),
      });
      if (existing) {
        console.log("[finalReports] create:existing found", {
          id: existing.id,
        });
        return { id: existing.id, status: "existing" };
      }

      console.log("[finalReports] create:input", {
        placementId: input.placementId,
        studentName: input.studentName,
        companyLogoUrl: input.companyLogoUrl ? "present" : "absent",
        mentorSignatureUrl: input.mentorSignatureUrl ? "present" : "absent",
      });

      const [created] = await ctx.db.transaction(async (tx) => {
        const [report] = await tx
          .insert(finalReport)
          .values({
            placementId: input.placementId,
            studentName: input.studentName,
            studentNis: input.studentNis,
            studentMajor: input.studentMajor,
            studentGrade: input.studentGrade,
            schoolName: input.schoolName,
            schoolLogoUrl: input.schoolLogoUrl,
            companyName: input.companyName,
            companyLogoUrl: input.companyLogoUrl,
            mentorName: input.mentorName,
            mentorSignatureUrl: input.mentorSignatureUrl,
            programKeahlian: input.programKeahlian,
            konsentrasiKeahlian: input.konsentrasiKeahlian,
            bidangKeahlian: input.bidangKeahlian,
            academicYear: input.academicYear,
            place: input.place,
            status: "draft",
            currentStep: 1,
          })
          .returning();

        if (report) {
          // Sync with attachment table (like tasks do)
          const logoSigUrls = [
            { url: input.schoolLogoUrl, type: "school_logo" },
            { url: input.companyLogoUrl, type: "company_logo" },
            { url: input.mentorSignatureUrl, type: "mentor_signature" },
          ].filter((item) => !!item.url);

          for (const item of logoSigUrls) {
            await tx.insert(attachment).values({
              ownerType: "final_report",
              ownerId: report.id,
              url: item.url!,
              filename: `${item.type.replace("_", " ")}`,
              createdById: ctx.session.user.id,
            });
          }
        }
        return [report];
      });

      console.log("[finalReports] create:success", { id: created?.id });

      return { id: created?.id, status: "created" };
    }),

  /**
   * Update a final report (supports partial updates for autosave).
   */
  update: adminOrMentorProcedure
    .use(requirePermissions({ finalReport: ["update"] }))
    .input(
      z.object({
        id: z.number(),
        // Snapshot data (all optional for partial updates)
        studentName: z.string().optional(),
        studentNis: z.string().optional(),
        studentMajor: z.string().optional(),
        studentGrade: z.string().optional(),
        schoolName: z.string().optional(),
        schoolLogoUrl: z.string().optional(),
        companyName: z.string().optional(),
        companyLogoUrl: z.string().optional(),
        mentorName: z.string().optional(),
        mentorSignatureUrl: z.string().optional(),
        programKeahlian: z.string().optional(),
        konsentrasiKeahlian: z.string().optional(),
        bidangKeahlian: z.string().optional(),
        academicYear: z.string().optional(),
        place: z.string().optional(),
        issuedAt: z.string().optional(),
        currentStep: z.number().optional(),
        // Scores
        scores: z
          .array(
            z.object({
              competencyTemplateId: z.number(),
              score: z.number().min(0).max(100),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fr = await ctx.db.query.finalReport.findFirst({
        where: eq(finalReport.id, input.id),
      });
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.session.user.role === "mentor") {
        await enforceMentorScope(ctx, fr.placementId);
      }

      // Update final report fields
      const updateData: Record<string, unknown> = {};
      if (input.studentName !== undefined)
        updateData.studentName = input.studentName;
      if (input.studentNis !== undefined)
        updateData.studentNis = input.studentNis;
      if (input.studentMajor !== undefined)
        updateData.studentMajor = input.studentMajor;
      if (input.studentGrade !== undefined)
        updateData.studentGrade = input.studentGrade;
      if (input.schoolName !== undefined)
        updateData.schoolName = input.schoolName;
      if (input.schoolLogoUrl !== undefined)
        updateData.schoolLogoUrl = input.schoolLogoUrl;
      if (input.companyName !== undefined)
        updateData.companyName = input.companyName;
      if (input.companyLogoUrl !== undefined)
        updateData.companyLogoUrl = input.companyLogoUrl;
      if (input.mentorName !== undefined)
        updateData.mentorName = input.mentorName;
      if (input.mentorSignatureUrl !== undefined)
        updateData.mentorSignatureUrl = input.mentorSignatureUrl;
      if (input.programKeahlian !== undefined)
        updateData.programKeahlian = input.programKeahlian;
      if (input.konsentrasiKeahlian !== undefined)
        updateData.konsentrasiKeahlian = input.konsentrasiKeahlian;
      if (input.bidangKeahlian !== undefined)
        updateData.bidangKeahlian = input.bidangKeahlian;
      if (input.academicYear !== undefined)
        updateData.academicYear = input.academicYear;
      if (input.place !== undefined) updateData.place = input.place;
      if (input.issuedAt !== undefined) updateData.issuedAt = input.issuedAt;
      if (input.currentStep !== undefined)
        updateData.currentStep = input.currentStep;

      if (Object.keys(updateData).length > 0) {
        console.log("[finalReports] update:fields", {
          id: input.id,
          fields: Object.keys(updateData),
          companyLogoUrl: input.companyLogoUrl ? "present" : "absent",
          mentorSignatureUrl: input.mentorSignatureUrl ? "present" : "absent",
        });
        await ctx.db
          .update(finalReport)
          .set(updateData)
          .where(eq(finalReport.id, input.id));

        // Sync with attachment table (like tasks do)
        const logoSigUrls = [
          { url: input.schoolLogoUrl, type: "school_logo" },
          { url: input.companyLogoUrl, type: "company_logo" },
          { url: input.mentorSignatureUrl, type: "mentor_signature" },
        ].filter((item) => !!item.url);

        for (const item of logoSigUrls) {
          // Check if already exists to avoid duplication
          const existingAtt = await ctx.db.query.attachment.findFirst({
            where: and(
              eq(attachment.ownerType, "final_report"),
              eq(attachment.ownerId, input.id),
              eq(attachment.url, item.url!),
            ),
          });

          if (!existingAtt) {
            await ctx.db.insert(attachment).values({
              ownerType: "final_report",
              ownerId: input.id,
              url: item.url!,
              filename: `${item.type.replace("_", " ")}`,
              createdById: ctx.session.user.id,
            });
          }
        }
      }

      // Update scores if provided
      if (input.scores && input.scores.length > 0) {
        await ctx.db
          .delete(finalReportScore)
          .where(eq(finalReportScore.finalReportId, input.id));
        const values: FinalReportScoreInsert[] = input.scores.map((s) => ({
          finalReportId: input.id,
          competencyTemplateId: s.competencyTemplateId,
          score: s.score.toString(),
        }));
        await ctx.db.insert(finalReportScore).values(values);

        // Recalculate totals
        const totalScore = input.scores.reduce((acc, s) => acc + s.score, 0);
        const avgScore =
          input.scores.length > 0 ? totalScore / input.scores.length : 0;
        await ctx.db
          .update(finalReport)
          .set({
            totalScore: totalScore.toString(),
            averageScore: avgScore.toFixed(2),
          })
          .where(eq(finalReport.id, input.id));
      }

      return { id: input.id, status: "updated" };
    }),

  /**
   * Get full final report data including certificate.
   */
  get: adminOrMentorProcedure
    .use(requirePermissions({ finalReport: ["read"] }))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const fr = await ctx.db.query.finalReport.findFirst({
        where: eq(finalReport.id, input.id),
        with: {
          scores: {
            with: {
              competency: true,
            },
          },
          certificate: true,
          placement: {
            with: {
              company: true,
              student: {
                with: {
                  user: true,
                },
              },
              mentor: {
                with: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.session.user.role === "mentor") {
        await enforceMentorScope(ctx, fr.placementId);
      }

      // Format certificate number if certificate exists
      let certificateNumber: string | null = null;
      if (fr.certificate) {
        const c = fr.certificate;
        const seq = String(c.sequenceNumber).padStart(3, "0");
        certificateNumber = `${seq}/${c.companyCode}/PKL/${c.month}/${c.year}`;
      }

      return {
        ...fr,
        certificateNumber,
      };
    }),

  /**
   * Finalize report and generate certificate.
   */
  finalize: adminOrMentorProcedure
    .use(
      requirePermissions({ finalReport: ["update"], certificate: ["create"] }),
    )
    .input(
      z.object({
        id: z.number(),
        // Certificate data
        predicate: z.string(),
        companyCode: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        durationMonths: z.number().optional(),
        place: z.string().optional(),
        signerName: z.string().optional(),
        signerRole: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fr = await ctx.db.query.finalReport.findFirst({
        where: eq(finalReport.id, input.id),
      });
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.session.user.role === "mentor") {
        await enforceMentorScope(ctx, fr.placementId);
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Check if certificate already exists for this report
      const existingCert = await ctx.db.query.certificate.findFirst({
        where: eq(certificate.finalReportId, input.id),
      });

      let finalSeq: number;
      let finalMonth: number;
      let finalYear: number;

      if (existingCert) {
        // Update existing certificate - keep the original sequence number/month/year
        finalSeq = existingCert.sequenceNumber;
        finalMonth = existingCert.month;
        finalYear = existingCert.year;

        await ctx.db
          .update(certificate)
          .set({
            predicate: input.predicate,
            companyCode: input.companyCode,
            startDate: input.startDate,
            endDate: input.endDate,
            durationMonths: input.durationMonths,
            place: input.place,
            signerName: input.signerName,
            signerRole: input.signerRole,
            issuedAt: now.toISOString().split("T")[0],
          })
          .where(eq(certificate.id, existingCert.id));
      } else {
        // Create new certificate - calculate next sequence number
        finalMonth = currentMonth;
        finalYear = currentYear;

        // Get next sequence number for this company/month/year
        const lastCert = await ctx.db
          .select({ seq: certificate.sequenceNumber })
          .from(certificate)
          .where(
            and(
              eq(certificate.companyCode, input.companyCode),
              eq(certificate.month, finalMonth),
              eq(certificate.year, finalYear),
            ),
          )
          .orderBy(sql`${certificate.sequenceNumber} DESC`)
          .limit(1);

        finalSeq = (lastCert[0]?.seq ?? 0) + 1;

        const certData: CertificateInsert = {
          finalReportId: input.id,
          sequenceNumber: finalSeq,
          companyCode: input.companyCode,
          month: finalMonth,
          year: finalYear,
          predicate: input.predicate,
          startDate: input.startDate,
          endDate: input.endDate,
          durationMonths: input.durationMonths,
          place: input.place,
          signerName: input.signerName,
          signerRole: input.signerRole,
          issuedAt: now.toISOString().split("T")[0],
        };
        await ctx.db.insert(certificate).values(certData);
      }

      // Update final report status
      await ctx.db
        .update(finalReport)
        .set({
          status: "finalized",
          submittedAt: now,
          issuedAt: now.toISOString().split("T")[0],
        })
        .where(eq(finalReport.id, input.id));

      const seq = String(finalSeq).padStart(3, "0");
      return {
        id: input.id,
        status: "finalized",
        certificateNumber: `${seq}/${input.companyCode}/PKL/${finalMonth}/${finalYear}`,
      };
    }),

  /**
   * Delete a final report.
   */
  delete: adminOrMentorProcedure
    .use(requirePermissions({ finalReport: ["delete"] }))
    .input(
      z.object({
        id: z.number(),
        confirmCode: z.string(), // Must match student NIS for confirmation
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fr = await ctx.db.query.finalReport.findFirst({
        where: eq(finalReport.id, input.id),
      });
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.session.user.role === "mentor") {
        await enforceMentorScope(ctx, fr.placementId);
      }

      // Verify confirmation code matches student NIS
      if (fr.studentNis !== input.confirmCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kode konfirmasi tidak sesuai dengan NIS siswa",
        });
      }

      // Delete will cascade to scores and certificate
      await ctx.db.delete(finalReport).where(eq(finalReport.id, input.id));

      return { status: "deleted" };
    }),
});
