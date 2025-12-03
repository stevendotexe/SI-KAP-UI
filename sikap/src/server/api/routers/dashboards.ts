import { z } from "zod";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  mentorProcedure,
  adminOrMentorProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import {
  assessment,
  attendanceLog,
  mentorProfile,
  placement,
  report,
  studentProfile,
  user,
} from "@/server/db/schema";

const docs = {
  getAverageStudentScores: {
    description:
      "## Rata-Rata Skor Siswa\n\nTimeseries rata-rata skor siswa berdasarkan asesmen.\n\n### Parameters\n- `from` (Date, optional)\n- `to` (Date, optional)\n- `granularity` (day | week | month, default month)\n- `programId` (number, optional)\n\n### Response\nArray timeseries dengan format `{ period: string, count: number }[]`.\n\n### Example (React)\n```ts\nconst { data } = api.dashboards.getAverageStudentScores.useQuery({\n  from: new Date(new Date().getFullYear(), new Date().getMonth()-5, 1),\n  granularity: 'month'\n});\n```",
  },
  getAverageStudentAttendances: {
    description:
      "## Rata-Rata Kehadiran Siswa\n\nTimeseries rata-rata kehadiran (present+late / total) dalam persen.\n\n### Parameters\n- `from` (Date, optional)\n- `to` (Date, optional)\n- `granularity` (day | week | month, default month)\n- `programId` (number, optional)\n\n### Response\nArray timeseries `{ period: string, count: number }[]` dengan nilai persen 0-100.\n\n### Example (React)\n```ts\nconst { data } = api.dashboards.getAverageStudentAttendances.useQuery({ granularity: 'month' });\n```",
  },
  getStudentCountPerPeriod: {
    description:
      "## Jumlah Siswa per Periode\n\nTimeseries jumlah siswa berdasarkan bulan mulai penempatan.\n\n### Parameters\n- `from` (Date, optional)\n- `to` (Date, optional)\n- `granularity` (month | week | day, default month)\n- `programId` (number, optional)\n\n### Response\nArray timeseries dengan format `{ period: string, count: number }[]`.\n\n### Example (React)\n```ts\nconst { data } = api.dashboards.getStudentCountPerPeriod.useQuery({ granularity: 'month' });\n```",
  },
  getDashboardCounts: {
    description:
      "## Dashboard Counts\n\nRingkasan jumlah entity inti.\n\n### Parameters\n- `from` (Date, optional)\n- `to` (Date, optional)\n\n### Response\n`{ students: number, mentors: number, reports: number, graduates: number, lastUpdated: string }`\n\n### Example (React)\n```ts\nconst { data } = api.dashboards.getDashboardCounts.useQuery();\n```",
  },
  getAttendancePieChart: {
    description:
      "## Diagram Kehadiran (Mentor)\n\nDistribusi kehadiran untuk siswa di bawah mentor yang login.\n\n### Parameters\n- `from` (Date, optional)\n- `to` (Date, optional)\n\n### Response\nArray pie chart `{ name: string, value: number }[]`.\n\n### Example (React)\n```ts\nconst { data } = api.dashboards.getAttendancePieChart.useQuery();\n```",
  },
  getAttendanceTable: {
    description:
      "## Tabel Kehadiran (Mentor)\n\nAggregasi kehadiran per siswa untuk mentor yang login.\n\n### Parameters\n- `from` (Date, optional)\n- `to` (Date, optional)\n\n### Response\nArray objek untuk tabel, contoh: `{ name: string, present: number, absent: number, excused: number, late: number }[]`.\n\n### Example (React)\n```ts\nconst { data } = api.dashboards.getAttendanceTable.useQuery();\n```",
  },
};

function coerceRange(input: { from?: Date; to?: Date }) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: input.from ?? firstOfMonth,
    to: input.to ?? now,
  };
}

function periodExpr(granularity: "day" | "week" | "month", dateCol: unknown) {
  if (granularity === "day") {
    return sql<string>`to_char(date_trunc('day', ${dateCol}::timestamp), 'YYYY-MM-DD')`;
  }
  if (granularity === "week") {
    return sql<string>`to_char(date_trunc('week', ${dateCol}::timestamp), 'IYYY-IW')`;
  }
  return sql<string>`to_char(date_trunc('month', ${dateCol}::timestamp), 'YYYY-MM')`;
}

export const dashboardsRouter = createTRPCRouter({
  getAverageStudentScores: adminOrMentorProcedure
    .meta(docs.getAverageStudentScores)
    .use(requirePermissions({ analytics: ["read"] }))
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        granularity: z.enum(["day", "week", "month"]).default("month"),
        programId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const range = coerceRange(input);
      const per = periodExpr(input.granularity, assessment.createdAt);

      let mentorFilterId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
      }

      const rows = await ctx.db
        .select({
          period: per,
          count: sql<number>`avg(${assessment.totalScore})`,
        })
        .from(assessment)
        .innerJoin(placement, eq(assessment.placementId, placement.id))
        .where(
          and(
            gte(assessment.createdAt, range.from),
            lte(assessment.createdAt, range.to),
            input.programId === undefined
              ? undefined
              : eq(placement.programId, input.programId),
            mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
          ),
        )
        .groupBy(per)
        .orderBy(per);
      return rows.map((r) => ({
        period: r.period,
        count: Number(r.count ?? 0),
      }));
    }),

  getAverageStudentAttendances: adminOrMentorProcedure
    .meta(docs.getAverageStudentAttendances)
    .use(requirePermissions({ analytics: ["read"] }))
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        granularity: z.enum(["day", "week", "month"]).default("month"),
        programId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const range = coerceRange(input);
      const fromDateStr = range.from.toISOString().slice(0, 10);
      const toDateStr = range.to.toISOString().slice(0, 10);
      const per = periodExpr(input.granularity, attendanceLog.date);

      let mentorFilterId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
      }

      const rows = await ctx.db
        .select({
          period: per,
          status: attendanceLog.status,
          total: sql<number>`count(*)`,
        })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .where(
          and(
            gte(attendanceLog.date, fromDateStr),
            lte(attendanceLog.date, toDateStr),
            input.programId === undefined
              ? undefined
              : eq(placement.programId, input.programId),
            mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
          ),
        )
        .groupBy(per, attendanceLog.status)
        .orderBy(per);

      const grouped: Record<
        string,
        { present: number; late: number; total: number }
      > = {};
      for (const r of rows) {
        const key = r.period as unknown as string;
        const g = grouped[key] ?? { present: 0, late: 0, total: 0 };
        const st = String(r.status);
        if (st === "present") g.present += Number(r.total);
        if (st === "late") g.late += Number(r.total);
        g.total += Number(r.total);
        grouped[key] = g;
      }
      return Object.entries(grouped)
        .map(([period, v]) => ({
          period,
          count:
            v.total === 0
              ? 0
              : Math.round(((v.present + v.late) / v.total) * 100),
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    }),

  getStudentCountPerPeriod: adminOrMentorProcedure
    .meta(docs.getStudentCountPerPeriod)
    .use(requirePermissions({ analytics: ["read"] }))
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        granularity: z.enum(["day", "week", "month"]).default("month"),
        programId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const range = coerceRange(input);
      const fromDateStr = range.from.toISOString().slice(0, 10);
      const toDateStr = range.to.toISOString().slice(0, 10);
      const per = periodExpr(input.granularity, placement.startDate);

      let mentorFilterId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
      }

      const rows = await ctx.db
        .select({
          period: per,
          count: sql<number>`count(distinct ${placement.studentId})`,
        })
        .from(placement)
        .where(
          and(
            placement.startDate
              ? gte(placement.startDate, fromDateStr)
              : undefined,
            placement.startDate
              ? lte(placement.startDate, toDateStr)
              : undefined,
            input.programId === undefined
              ? undefined
              : eq(placement.programId, input.programId),
            mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
          ),
        )
        .groupBy(per)
        .orderBy(per);
      return rows.map((r) => ({
        period: r.period,
        count: Number(r.count ?? 0),
      }));
    }),

  getDashboardCounts: adminOrMentorProcedure
    .meta(docs.getDashboardCounts)
    .use(requirePermissions({ analytics: ["read"] }))
    .input(z.object({ from: z.date().optional(), to: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const range = coerceRange(input);

      let mentorFilterId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
      }

      // Students: count active students (filtered by mentor if applicable)
      const [studentsRow] = await ctx.db
        .select({ count: sql<number>`count(distinct ${studentProfile.id})` })
        .from(studentProfile)
        .innerJoin(placement, eq(studentProfile.id, placement.studentId))
        .where(
          and(
            eq(studentProfile.active, true),
            eq(placement.status, "active"),
            mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
          ),
        );

      // Mentors: global count (or just 1 if mentor? keeping global for now as it's less critical)
      const [mentorsRow] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(mentorProfile)
        .where(eq(mentorProfile.active, true));

      // Reports: count reports (filtered by mentor's students)
      const [reportsRow] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .where(
          and(
            gte(report.createdAt, range.from),
            lte(report.createdAt, range.to),
            mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
          ),
        );

      // Graduates: count completed placements (filtered by mentor)
      const [graduatesRow] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(placement)
        .where(
          and(
            eq(placement.status, "completed"),
            mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
          ),
        );

      return {
        students: Number(studentsRow?.count ?? 0),
        mentors: Number(mentorsRow?.count ?? 0),
        reports: Number(reportsRow?.count ?? 0),
        graduates: Number(graduatesRow?.count ?? 0),
        lastUpdated: new Date().toISOString(),
      };
    }),

  getAttendancePieChart: mentorProcedure
    .meta(docs.getAttendancePieChart)
    .use(requirePermissions({ analytics: ["read"] }))
    .input(z.object({ from: z.date().optional(), to: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const range = coerceRange(input);
      const fromDateStr = range.from.toISOString().slice(0, 10);
      const toDateStr = range.to.toISOString().slice(0, 10);
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });
      if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
      const rows = await ctx.db
        .select({ status: attendanceLog.status, value: sql<number>`count(*)` })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .where(
          and(
            eq(placement.mentorId, mp.id),
            gte(attendanceLog.date, fromDateStr),
            lte(attendanceLog.date, toDateStr),
          ),
        )
        .groupBy(attendanceLog.status);
      return rows.map((r) => ({
        name: String(r.status),
        value: Number(r.value ?? 0),
      }));
    }),

  getAttendanceTable: mentorProcedure
    .meta(docs.getAttendanceTable)
    .use(requirePermissions({ analytics: ["read"] }))
    .input(z.object({ from: z.date().optional(), to: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const range = coerceRange(input);
      const fromDateStr = range.from.toISOString().slice(0, 10);
      const toDateStr = range.to.toISOString().slice(0, 10);
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, ctx.session.user.id),
      });
      if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
      const rows = await ctx.db
        .select({
          name: user.name,
          present: sql<number>`sum(case when ${attendanceLog.status} in ('present','late') then 1 else 0 end)`,
          absent: sql<number>`sum(case when ${attendanceLog.status} = 'absent' then 1 else 0 end)`,
          excused: sql<number>`sum(case when ${attendanceLog.status} = 'excused' then 1 else 0 end)`,
          late: sql<number>`sum(case when ${attendanceLog.status} = 'late' then 1 else 0 end)`,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .leftJoin(attendanceLog, eq(attendanceLog.placementId, placement.id))
        .where(
          and(
            eq(placement.mentorId, mp.id),
            gte(attendanceLog.date, fromDateStr),
            lte(attendanceLog.date, toDateStr),
          ),
        )
        .groupBy(user.name)
        .orderBy(user.name);
      return rows.map((r) => ({
        name: r.name ?? "",
        present: Number(r.present ?? 0),
        absent: Number(r.absent ?? 0),
        excused: Number(r.excused ?? 0),
        late: Number(r.late ?? 0),
      }));
    }),
});
