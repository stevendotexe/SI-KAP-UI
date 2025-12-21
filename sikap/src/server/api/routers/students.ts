import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, adminOrMentorProcedure, protectedProcedure, requirePermissions } from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import { assessment, attendanceLog, mentorProfile, placement, report, studentProfile, task, user } from "@/server/db/schema";

const docs = {
  list: {
    description:
      "## List Siswa\n\nMenampilkan daftar siswa di suatu perusahaan dengan filter.\n\n### Parameters\n- `companyId` (number)\n- `year` (number, optional)\n- `school` (string, optional)\n- `status` (active | completed | canceled, optional)\n- `search` (string, optional)\n- `limit` (number, 1-200, default 100)\n- `offset` (number, >=0, default 0)\n\n### Response\n`{ items: StudentRow[], pagination: { total, limit, offset }, lastUpdated: string }` dengan `StudentRow = { id: number, studentId: string, name: string, school: string | null, cohort: string | null, year: number | null, status: string }`.\n\n### Example (React)\n```ts\nconst { data } = api.students.list.useQuery({ companyId: 1, year: 2025, search: 'rafif' });\n```",
  },
  detail: {
    description:
      "## Detail Siswa\n\nDetail profil siswa, statistik nilai, kehadiran, dan relasi laporan/asesmen.\n\n### Parameters\n- `userId` (string)\n\n### Response\n`{ profile, stats, attendance, reports, assessments, lastUpdated }`.\n\n### Example (React)\n```ts\nconst { data } = api.students.detail.useQuery({ userId });\n```",
  },
  reportDetail: {
    description:
      "## Detail Laporan Siswa\n\nInformasi lengkap laporan termasuk mentor, status, skor.\n\n### Parameters\n- `reportId` (number)\n\n### Response\n`{ id, type, title, content, periodStart, periodEnd, submittedAt, reviewStatus, score, mentor: { id, name }, placementId }`.\n\n### Example (React)\n```ts\nconst { data } = api.students.reportDetail.useQuery({ reportId: 123 });\n```",
  },
  create: {
    description:
      "## Create Siswa\n\nMembuat akun siswa dan profil.\n\n### Parameters\n- `email` (string, email)\n- `password` (string, min 8)\n- `name` (string, min 1)\n- `school` (string, optional)\n- `major` (string, optional)\n- `cohort` (string, optional)\n- `phone` (string, optional)\n\n### Response\nMengembalikan record profil siswa.\n\n### Example (React)\n```ts\nconst m = api.students.create.useMutation();\nm.mutate({ email, password, name, school, cohort });\n```",
  },
  update: {
    description:
      "## Update Siswa\n\nMemperbarui profil siswa dan data user.\n\n### Parameters\n- `userId` (string)\n- `school` (string | null, optional)\n- `major` (string | null, optional)\n- `cohort` (string | null, optional)\n- `phone` (string | null, optional)\n- `active` (boolean, optional)\n- `name` (string, optional)\n- `email` (string, optional)\n\n### Response\nVoid.\n\n### Example (React)\n```ts\nconst m = api.students.update.useMutation();\nm.mutate({ userId, name: 'Rafif', school: 'SMK 1' });\n```",
  },
  delete: {
    description:
      "## Delete Siswa\n\nMenghapus akun siswa dan seluruh relasi yang dikaitkan.\n\n### Parameters\n- `userId` (string)\n\n### Response\n`{ ok: true }`.\n\n### Example (React)\n```ts\nconst m = api.students.delete.useMutation();\nm.mutate({ userId });\n```",
  },
  me: {
    description:
      "## Profile Siswa (Self)\n\nAmbil biodata siswa yang sedang login.\n\n### Response\n`{ id, userId, name, email, nis, birthPlace, birthDate, gender, semester, school, major, cohort, address, phone }`.\n\n### Example (React)\n```ts\nconst { data } = api.students.me.useQuery();\n```",
  },
  updateProfile: {
    description:
      "## Update Profile Siswa (Self)\n\nPerbarui biodata siswa yang sedang login.\n\n### Parameters\n- `name` (string, optional)\n- `nis` (string, optional)\n- `birthPlace` (string, optional)\n- `birthDate` (Date, optional)\n- `gender` (string, optional)\n- `semester` (number, optional)\n- `school` (string, optional)\n- `major` (string, optional)\n- `cohort` (string, optional)\n- `address` (string, optional)\n- `phone` (string, optional)\n\n### Response\nProfil yang sudah diperbarui.\n\n### Example (React)\n```ts\nconst m = api.students.updateProfile.useMutation();\nm.mutate({ name: 'Rafif', nis: '123', semester: 6 });\n```",
  },
};

export const studentsRouter = createTRPCRouter({
  list: adminOrMentorProcedure
    .meta(docs.list)
    .use(requirePermissions({ studentProfile: ["read"], placement: ["read"] }))
    .input(
      z.object({
        companyId: z.number().optional(),
        year: z.number().optional(),
        school: z.string().optional(),
        status: z.enum(["active", "completed", "canceled"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Note: companyId parameter is kept for backwards compatibility but not used for filtering anymore
      // For mentors, we show all students in the system regardless of placement company

      let mentorId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorId = mp.id;
      }

      const rows = await ctx.db
        .select({
          id: studentProfile.id,
          studentId: user.id,
          name: user.name,
          school: studentProfile.school,
          cohort: studentProfile.cohort,
          year: sql<number | null>`date_part('year', ${placement.startDate}::timestamp)`,
          status: placement.status,
          nis: studentProfile.nis,
        })
        .from(studentProfile)
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .leftJoin(placement, eq(placement.studentId, studentProfile.id))
        .where(
          and(
            mentorId ? eq(placement.mentorId, mentorId) : undefined,
            input.status ? eq(placement.status, input.status) : undefined,
            input.school ? eq(studentProfile.school, input.school) : undefined,
            input.year !== undefined
              ? sql`date_part('year', ${placement.startDate}::timestamp) = ${input.year}`
              : undefined,
            input.search
              ? sql`(lower(${user.name}) like ${"%" + input.search.toLowerCase() + "%"} or ${user.id} = ${input.search})`
              : undefined,
          ),
        )
        .limit(input.limit)
        .offset(input.offset);

      const countRows = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(studentProfile)
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .leftJoin(placement, eq(placement.studentId, studentProfile.id))
        .where(
          and(
            mentorId ? eq(placement.mentorId, mentorId) : undefined,
            input.status ? eq(placement.status, input.status) : undefined,
            input.school ? eq(studentProfile.school, input.school) : undefined,
            input.year !== undefined
              ? sql`date_part('year', ${placement.startDate}::timestamp) = ${input.year}`
              : undefined,
            input.search
              ? sql`(lower(${user.name}) like ${"%" + input.search.toLowerCase() + "%"} or ${user.id} = ${input.search})`
              : undefined,
          ),
        );
      const total = countRows[0]?.total ?? 0;

      return {
        items: rows.map((r) => ({
          id: r.id,
          studentId: r.studentId,
          name: r.name ?? "",
          school: r.school ?? null,
          cohort: r.cohort ?? null,
          year: r.year ?? null,
          status: r.status ? String(r.status) : "active", // Default to "active" if no placement
          nis: r.nis ?? null,
        })),
        pagination: { total: Number(total), limit: input.limit, offset: input.offset },
        lastUpdated: new Date().toISOString(),
      };
    }),

  detail: adminOrMentorProcedure
    .meta(docs.detail)
    .use(
      requirePermissions({
        studentProfile: ["read"],
        placement: ["read"],
        report: ["read"],
        assessment: ["read"],
        attendanceLog: ["read"],
        task: ["read"],
      }),
    )
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sp = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, input.userId),
        with: { user: true },
      });
      if (!sp) throw new TRPCError({ code: "NOT_FOUND" });

      const [avgScoreRow] = await ctx.db
        .select({ avg: sql<number>`avg(${assessment.totalScore})` })
        .from(assessment)
        .innerJoin(placement, eq(assessment.placementId, placement.id))
        .where(eq(placement.studentId, sp.id));

      const attendanceRows = await ctx.db
        .select({ status: attendanceLog.status, total: sql<number>`count(*)` })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .where(eq(placement.studentId, sp.id))
        .groupBy(attendanceLog.status);

      let present = 0,
        late = 0,
        absent = 0,
        excused = 0,
        total = 0;
      for (const r of attendanceRows) {
        const st = String(r.status);
        const v = Number(r.total ?? 0);
        if (st === "present") present += v;
        else if (st === "late") late += v;
        else if (st === "absent") absent += v;
        else if (st === "excused") excused += v;
        total += v;
      }
      const attendancePercent = total === 0 ? 0 : Math.round(((present + late) / total) * 100);

      const reports = await ctx.db
        .select({
          id: report.id,
          type: report.type,
          title: report.title,
          reviewStatus: report.reviewStatus,
          score: report.score,
          submittedAt: report.submittedAt,
        })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .where(eq(placement.studentId, sp.id))
        .orderBy(report.submittedAt);

      const tasks = await ctx.db
        .select({ id: task.id, title: task.title, dueDate: task.dueDate, status: task.status })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .where(eq(placement.studentId, sp.id))
        .orderBy(task.dueDate);

      // Score History (Daily Average from Tasks)
      const scoreHistoryRows = await ctx.db
        .select({
          period: sql<string>`to_char(${task.submittedAt}, 'YYYY-MM-DD')`,
          avgScore: sql<number>`avg(${task.score})`,
        })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .where(
          and(
            eq(placement.studentId, sp.id),
            eq(task.status, "approved"),
            sql`${task.submittedAt} is not null`
          )
        )
        .groupBy(sql`to_char(${task.submittedAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${task.submittedAt}, 'YYYY-MM-DD')`);

      // Attendance History (Daily Percentage)
      const attendanceHistoryRows = await ctx.db
        .select({
          period: sql<string>`to_char(${attendanceLog.date}, 'YYYY-MM-DD')`,
          status: attendanceLog.status,
          count: sql<number>`count(*)`,
        })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .where(eq(placement.studentId, sp.id))
        .groupBy(
          sql`to_char(${attendanceLog.date}, 'YYYY-MM-DD')`,
          attendanceLog.status,
        )
        .orderBy(sql`to_char(${attendanceLog.date}, 'YYYY-MM-DD')`);

      const attendanceHistoryMap: Record<string, { present: number; total: number }> = {};
      for (const r of attendanceHistoryRows) {
        const p = r.period;
        if (!attendanceHistoryMap[p]) attendanceHistoryMap[p] = { present: 0, total: 0 };
        const val = Number(r.count);
        attendanceHistoryMap[p].total += val;
        if (r.status === "present" || r.status === "late") {
          attendanceHistoryMap[p].present += val;
        }
      }
      const attendanceHistory = Object.entries(attendanceHistoryMap)
        .map(([period, data]) => ({
          period,
          count: data.total === 0 ? 0 : Math.round((data.present / data.total) * 100),
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      const assessments = await ctx.db
        .select({ id: assessment.id, totalScore: assessment.totalScore, createdAt: assessment.createdAt })
        .from(assessment)
        .innerJoin(placement, eq(assessment.placementId, placement.id))
        .where(eq(placement.studentId, sp.id))
        .orderBy(assessment.createdAt);

      const activePlacement = await ctx.db.query.placement.findFirst({ where: eq(placement.studentId, sp.id) });
      let mentorName: string | null = null;
      if (activePlacement?.mentorId) {
        const mp = await ctx.db.query.mentorProfile.findFirst({ where: eq(mentorProfile.id, activePlacement.mentorId), with: { user: true } });
        mentorName = mp?.user?.name ?? null;
      }

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
          mentorName,
          nis: sp.nis ?? null,
          address: sp.address ?? null,
          birthPlace: sp.birthPlace ?? null,
          birthDate: sp.birthDate ? new Date(sp.birthDate).toISOString().slice(0, 10) : null,
          gender: sp.gender ?? null,
          semester: sp.semester ?? null,
          startDate: activePlacement?.startDate ? new Date(activePlacement.startDate).toISOString().slice(0, 10) : null,
          endDate: activePlacement?.endDate ? new Date(activePlacement.endDate).toISOString().slice(0, 10) : null,
        },
        stats: { averageScore: Number(avgScoreRow?.avg ?? 0) },
        attendance: { percent: attendancePercent, present, late, absent, excused },
        reports,
        tasks,
        assessments,
        scoreHistory: scoreHistoryRows.map((r) => ({
          period: r.period,
          count: Number(r.avgScore ?? 0),
        })),
        attendanceHistory,
        lastUpdated: new Date().toISOString(),
      };
    }),

  reportDetail: adminOrMentorProcedure
    .meta(docs.reportDetail)
    .use(requirePermissions({ report: ["read"], placement: ["read"], mentorProfile: ["read"] }))
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: report.id,
          type: report.type,
          title: report.title,
          content: report.content,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          submittedAt: report.submittedAt,
          reviewStatus: report.reviewStatus,
          score: report.score,
          mentorId: mentorProfile.id,
          mentorName: user.name,
          placementId: placement.id,
        })
        .from(report)
        .innerJoin(placement, eq(report.placementId, placement.id))
        .leftJoin(mentorProfile, eq(report.reviewedByMentorId, mentorProfile.id))
        .leftJoin(user, eq(mentorProfile.userId, user.id))
        .where(eq(report.id, input.reportId))
        .limit(1);
      const r = row[0];
      if (!r) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        id: r.id,
        type: r.type,
        title: r.title ?? null,
        content: r.content ?? null,
        periodStart: r.periodStart ?? null,
        periodEnd: r.periodEnd ?? null,
        submittedAt: r.submittedAt ?? null,
        reviewStatus: r.reviewStatus,
        score: r.score ?? null,
        mentor: { id: r.mentorId ?? null, name: r.mentorName ?? null },
        placementId: r.placementId,
      };
    }),

  create: adminOrMentorProcedure
    .meta(docs.create)
    .use(requirePermissions({ user: ["create"], studentProfile: ["update"] }))
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
        school: z.string().optional(),
        major: z.string().optional(),
        cohort: z.string().optional(),
        phone: z.string().optional(),
        nis: z.string().optional(),
        birthPlace: z.string().optional(),
        birthDate: z.date().optional(),
        address: z.string().optional(),
        semester: z.number().optional(),
        gender: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Generate a simple unique code
      const code = `S-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await auth.api.createUser({
        body: { email: input.email, password: input.password, name: input.name, role: "student", code } as any,
        headers: ctx.headers,
      });
      const u = await ctx.db.query.user.findFirst({ where: eq(user.email, input.email) });
      if (!u) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Force update code to ensure it's set correctly (workaround for better-auth stripping it)
      await ctx.db.update(user).set({ code }).where(eq(user.id, u.id));

      await ctx.db.insert(studentProfile).values({
        userId: u.id,
        school: input.school ?? null,
        major: input.major ?? null,
        cohort: input.cohort ?? null,
        phone: input.phone ?? null,
        nis: input.nis ?? null,
        birthPlace: input.birthPlace ?? null,
        birthDate: input.birthDate ? input.birthDate.toISOString().slice(0, 10) : null,
        address: input.address ?? null,
        semester: input.semester ?? null,
        gender: input.gender ?? null,
      });
      const sp = await ctx.db.query.studentProfile.findFirst({ where: eq(studentProfile.userId, u.id) });

      // If creator is a mentor, automatically create a placement
      if (ctx.session.user.role === "mentor" && sp) {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });

        if (mp?.companyId) {
          await ctx.db.insert(placement).values({
            studentId: sp.id,
            mentorId: mp.id,
            companyId: mp.companyId,
            status: "active" as any,
            startDate: new Date().toISOString().slice(0, 10),
          });
        }
      }

      return sp ?? null;
    }),

  update: adminOrMentorProcedure
    .meta(docs.update)
    .use(requirePermissions({ studentProfile: ["update"] }))
    .input(
      z.object({
        userId: z.string(),
        school: z.string().nullable().optional(),
        major: z.string().nullable().optional(),
        cohort: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        nis: z.string().nullable().optional(),
        birthPlace: z.string().nullable().optional(),
        birthDate: z.date().nullable().optional(),
        gender: z.string().nullable().optional(),
        semester: z.number().nullable().optional(),
        startDate: z.date().nullable().optional(),
        endDate: z.date().nullable().optional(),
        active: z.boolean().optional(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sp = await ctx.db.query.studentProfile.findFirst({ where: eq(studentProfile.userId, input.userId) });
      if (sp) {
        await ctx.db
          .update(studentProfile)
          .set({
            school: input.school ?? null,
            major: input.major ?? null,
            cohort: input.cohort ?? null,
            phone: input.phone ?? null,
            address: input.address ?? null,
            nis: input.nis ?? null,
            birthPlace: input.birthPlace ?? null,
            birthDate: input.birthDate ? input.birthDate.toISOString().slice(0, 10) : null,
            gender: input.gender ?? null,
            semester: input.semester ?? null,
            active: input.active ?? undefined,
          })
          .where(eq(studentProfile.id, sp.id));

        // Update active placement dates if provided
        if (input.startDate !== undefined || input.endDate !== undefined) {
          const pl = await ctx.db.query.placement.findFirst({ where: eq(placement.studentId, sp.id) });
          if (pl) {
            await ctx.db
              .update(placement)
              .set({
                startDate: input.startDate ? input.startDate.toISOString().slice(0, 10) : undefined,
                endDate: input.endDate ? input.endDate.toISOString().slice(0, 10) : undefined,
              })
              .where(eq(placement.id, pl.id));
          }
        }
      }
      if (input.name || input.email) {
        await auth.api.adminUpdateUser({
          body: { userId: input.userId, data: { name: input.name, email: input.email } },
          headers: ctx.headers,
        });
      }
    }),

  delete: adminOrMentorProcedure
    .meta(docs.delete)
    .use(requirePermissions({ user: ["delete"] }))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(user).where(eq(user.id, input.userId));
      return { ok: true };
    }),

  me: protectedProcedure
    .meta(docs.me)
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== "student") throw new TRPCError({ code: "FORBIDDEN" });
      const sp = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
        with: { user: true },
      });
      if (!sp) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        id: sp.id,
        userId: sp.userId,
        name: sp.user?.name ?? "",
        email: sp.user?.email ?? "",
        nis: sp.nis ?? null,
        birthPlace: sp.birthPlace ?? null,
        birthDate: sp.birthDate ?? null,
        gender: sp.gender ?? null,
        semester: sp.semester ?? null,
        school: sp.school ?? null,
        major: sp.major ?? null,
        cohort: sp.cohort ?? null,
        address: sp.address ?? null,
        phone: sp.phone ?? null,
      };
    }),

  updateProfile: protectedProcedure
    .meta(docs.updateProfile)
    .input(
      z.object({
        name: z.string().min(1).optional(),
        nis: z.string().optional(),
        birthPlace: z.string().optional(),
        birthDate: z.date().optional(),
        gender: z.string().optional(),
        semester: z.number().optional(),
        school: z.string().optional(),
        major: z.string().optional(),
        cohort: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "student") throw new TRPCError({ code: "FORBIDDEN" });
      const sp = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
      });
      if (!sp) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db
        .update(studentProfile)
        .set({
          nis: input.nis ?? undefined,
          birthPlace: input.birthPlace ?? undefined,
          birthDate: input.birthDate ? input.birthDate.toISOString().slice(0, 10) : undefined,
          gender: input.gender ?? undefined,
          semester: input.semester ?? undefined,
          school: input.school ?? undefined,
          major: input.major ?? undefined,
          cohort: input.cohort ?? undefined,
          address: input.address ?? undefined,
          phone: input.phone ?? undefined,
        })
        .where(eq(studentProfile.id, sp.id));

      if (input.name) {
        await ctx.db.update(user).set({ name: input.name }).where(eq(user.id, ctx.session.user.id));
      }

      const updated = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
        with: { user: true },
      });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        id: updated.id,
        userId: updated.userId,
        name: updated.user?.name ?? "",
        email: updated.user?.email ?? "",
        nis: updated.nis ?? null,
        birthPlace: updated.birthPlace ?? null,
        birthDate: updated.birthDate ?? null,
        gender: updated.gender ?? null,
        semester: updated.semester ?? null,
        school: updated.school ?? null,
        major: updated.major ?? null,
        cohort: updated.cohort ?? null,
        address: updated.address ?? null,
        phone: updated.phone ?? null,
      };
    }),
});
