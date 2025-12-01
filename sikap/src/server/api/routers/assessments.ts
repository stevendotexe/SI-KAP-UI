import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  protectedProcedure,
  createTRPCRouter,
  requirePermissions,
} from "@/server/api/trpc";
import {
  assessment,
  assessmentItem,
  placement,
  studentProfile,
} from "@/server/db/schema";

const docs = {
  detailFinalReport: {
    description:
      "## Detail Final Report (Siswa)\n\nMengambil profil siswa yang sedang login dan seluruh asesmen beserta item untuk perhitungan total dan rata-rata.\n\n### Parameters\nTidak ada.\n\n### Response\n`{ profile, assessments, totals, lastUpdated }` di mana `totals = { totalScore: number, averageScore: number, itemsCount: number }`.\n\n### Example (React)\n```ts\nconst { data } = api.assessments.detailFinalReport.useQuery();\n```",
  },
};

export const assessmentsRouter = createTRPCRouter({
  detailFinalReport: protectedProcedure
    .meta(docs.detailFinalReport)
    .use(
      requirePermissions({
        assessment: ["read"],
        studentProfile: ["read"],
        placement: ["read"],
      }),
    )
    .query(async ({ ctx }) => {
      const sp = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
        with: { user: true },
      });
      if (!sp)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not a student" });

      const rows = await ctx.db
        .select({
          assessmentId: assessment.id,
          createdAt: assessment.createdAt,
          totalScore: assessment.totalScore,
          itemId: assessmentItem.id,
          criterion: assessmentItem.criterion,
          maxScore: assessmentItem.maxScore,
          score: assessmentItem.score,
          position: assessmentItem.position,
        })
        .from(assessment)
        .innerJoin(placement, eq(assessment.placementId, placement.id))
        .leftJoin(
          assessmentItem,
          eq(assessmentItem.assessmentId, assessment.id),
        )
        .where(and(eq(placement.studentId, sp.id)))
        .orderBy(assessment.createdAt, assessmentItem.position);

      const grouped = new Map<
        number,
        {
          id: number;
          createdAt: Date | null;
          totalScore: number | null;
          items: Array<{
            id: number;
            criterion: string;
            maxScore: number | null;
            score: number | null;
            position: number | null;
          }>;
        }
      >();

      let sum = 0;
      let count = 0;

      for (const r of rows) {
        const gid = Number(r.assessmentId);
        const g = grouped.get(gid) ?? {
          id: gid,
          createdAt: r.createdAt ?? null,
          totalScore:
            r.totalScore === null || r.totalScore === undefined
              ? null
              : Number(r.totalScore),
          items: [],
        };
        if (r.itemId !== null && r.itemId !== undefined) {
          const s =
            r.score === null || r.score === undefined ? null : Number(r.score);
          const m =
            r.maxScore === null || r.maxScore === undefined
              ? null
              : Number(r.maxScore);
          g.items.push({
            id: Number(r.itemId),
            criterion: r.criterion ?? "",
            maxScore: m,
            score: s,
            position: r.position ?? null,
          });
          if (s !== null) {
            sum += s;
            count += 1;
          }
        }
        grouped.set(gid, g);
      }

      const average = count === 0 ? 0 : Math.round(sum / count);

      return {
        profile: {
          id: sp.id,
          userId: sp.userId,
          name: sp.user?.name ?? "",
          email: sp.user?.email ?? "",
          school: sp.school ?? null,
          major: sp.major ?? null,
          cohort: sp.cohort ?? null,
          phone: sp.phone ?? null,
          active: sp.active,
        },
        assessments: Array.from(grouped.values()).sort((a, b) => {
          const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return at - bt;
        }),
        totals: { totalScore: sum, averageScore: average, itemsCount: count },
        lastUpdated: new Date().toISOString(),
      };
    }),
});
