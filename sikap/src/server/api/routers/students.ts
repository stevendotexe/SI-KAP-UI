import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  adminOrMentorProcedure,
  requirePermissions,
  protectedProcedure,
} from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import {
  assessment,
  attendanceLog,
  mentorProfile,
  placement,
  report,
  task,
  studentProfile,
  user,
  attachment,
} from "@/server/db/schema";
import { calculateDistanceInMeters } from "@/lib/haversine";
import { buildPublicUrlAction } from "@/server/storage";

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
  getDashboardData: {
    description:
      "## Dashboard Data (Siswa)\n\nRingkasan statistik untuk kartu dashboard siswa.\n\n### Response\n`{ assignedAssessments, pendingReviewAssessments, submittedReports, averageScore }`.\n\n### Example (React)\n```ts\nconst { data } = api.students.getDashboardData.useQuery();\n```",
  },
  getTodayStatus: {
    description:
      "## Status Hari Ini (Siswa)\n\nStatus absensi untuk hari ini, termasuk izin check-in / check-out.\n\n### Response\n`{ canCheckIn, canCheckOut, hasCompleted, logData, placementId, studentName, studentId }`.\n\n### Example (React)\n```ts\nconst { data } = api.students.getTodayStatus.useQuery();\n```",
  },
  checkIn: {
    description:
      "## Check In (Siswa)\n\nMelakukan absensi masuk dengan validasi jarak maksimum 100 meter dan wajib menyertakan nama file selfie yang sudah di-upload oleh FE.\n\n### Parameters\n- `latitude` (number)\n- `longitude` (number)\n- `selfieFilename` (string)\n\n### Response\n`{ success: true }`.\n\n### Example (React)\n```ts\nconst m = api.students.checkIn.useMutation();\nm.mutate({ latitude, longitude, selfieFilename: 'in.jpg' });\n```",
  },
  checkOut: {
    description:
      "## Check Out (Siswa)\n\nMelakukan absensi keluar dengan validasi jarak maksimum 100 meter, memastikan sudah check-in, dan wajib menyertakan nama file selfie yang sudah di-upload oleh FE.\n\n### Parameters\n- `latitude` (number)\n- `longitude` (number)\n- `selfieFilename` (string)\n\n### Response\n`{ success: true }`.\n\n### Example (React)\n```ts\nconst m = api.students.checkOut.useMutation();\nm.mutate({ latitude, longitude, selfieFilename: 'out.jpg' });\n```",
  },
};

export const studentsRouter = createTRPCRouter({
  list: adminOrMentorProcedure
    .meta(docs.list)
    .use(requirePermissions({ studentProfile: ["read"], placement: ["read"] }))
    .input(
      z.object({
        companyId: z.number(),
        year: z.number().optional(),
        school: z.string().optional(),
        status: z.enum(["active", "completed", "canceled"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: studentProfile.id,
          studentId: user.id,
          name: user.name,
          school: studentProfile.school,
          cohort: studentProfile.cohort,
          year: sql<number>`date_part('year', ${placement.startDate}::timestamp)`,
          status: placement.status,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(
          and(
            eq(placement.companyId, input.companyId),
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
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(
          and(
            eq(placement.companyId, input.companyId),
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
          status: String(r.status),
        })),
        pagination: {
          total: Number(total),
          limit: input.limit,
          offset: input.offset,
        },
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
      const attendancePercent =
        total === 0 ? 0 : Math.round(((present + late) / total) * 100);

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

      const assessments = await ctx.db
        .select({
          id: assessment.id,
          totalScore: assessment.totalScore,
          createdAt: assessment.createdAt,
        })
        .from(assessment)
        .innerJoin(placement, eq(assessment.placementId, placement.id))
        .where(eq(placement.studentId, sp.id))
        .orderBy(assessment.createdAt);

      const activePlacement = await ctx.db.query.placement.findFirst({
        where: eq(placement.studentId, sp.id),
      });
      let mentorName: string | null = null;
      if (activePlacement?.mentorId) {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.id, activePlacement.mentorId),
          with: { user: true },
        });
        mentorName = mp?.user?.name ?? null;
      }

      return {
        profile: {
          id: sp.id,
          userId: sp.userId,
          name: sp.user?.name ?? "",
          email: sp.user?.email ?? "",
          school: sp.school ?? null,
          cohort: sp.cohort ?? null,
          phone: sp.phone ?? null,
          active: sp.active,
          mentorName,
        },
        stats: { averageScore: Number(avgScoreRow?.avg ?? 0) },
        attendance: {
          percent: attendancePercent,
          present,
          late,
          absent,
          excused,
        },
        reports,
        assessments,
        lastUpdated: new Date().toISOString(),
      };
    }),

  reportDetail: adminOrMentorProcedure
    .meta(docs.reportDetail)
    .use(
      requirePermissions({
        report: ["read"],
        placement: ["read"],
        mentorProfile: ["read"],
      }),
    )
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
        .leftJoin(
          mentorProfile,
          eq(report.reviewedByMentorId, mentorProfile.id),
        )
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await auth.api.createUser({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
          role: "student",
        },
        headers: ctx.headers,
      });
      const u = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
      });
      if (!u) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await ctx.db.insert(studentProfile).values({
        userId: u.id,
        school: input.school ?? null,
        major: input.major ?? null,
        cohort: input.cohort ?? null,
        phone: input.phone ?? null,
      });
      const sp = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, u.id),
      });
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
        active: z.boolean().optional(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sp = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, input.userId),
      });
      if (sp) {
        await ctx.db
          .update(studentProfile)
          .set({
            school: input.school ?? null,
            major: input.major ?? null,
            cohort: input.cohort ?? null,
            phone: input.phone ?? null,
            active: input.active ?? undefined,
          })
          .where(eq(studentProfile.id, sp.id));
      }
      if (input.name || input.email) {
        await auth.api.adminUpdateUser({
          body: {
            userId: input.userId,
            data: { name: input.name, email: input.email },
          },
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

  getDashboardData: protectedProcedure
    .meta(docs.getDashboardData)
    .use(
      requirePermissions({
        task: ["read"],
        report: ["read"],
        assessment: ["read"],
        placement: ["read"],
      }),
    )
    .query(async ({ ctx }) => {
      const student = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
      });
      if (!student) {
        return {
          assignedAssessments: 0,
          pendingReviewAssessments: 0,
          submittedReports: 0,
          averageScore: 0,
        };
      }

      const activePlacement = await ctx.db.query.placement.findFirst({
        where: and(
          eq(placement.studentId, student.id),
          eq(placement.status, "active"),
        ),
      });

      if (!activePlacement) {
        return {
          assignedAssessments: 0,
          pendingReviewAssessments: 0,
          submittedReports: 0,
          averageScore: 0,
        };
      }

      const [assigned] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(task)
        .where(
          and(
            eq(task.placementId, activePlacement.id),
            sql`${task.status} IN ('todo', 'in_progress')`,
          ),
        );

      const [pending] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(task)
        .where(
          and(
            eq(task.placementId, activePlacement.id),
            eq(task.status, "submitted"),
          ),
        );

      const [reports] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(report)
        .where(eq(report.placementId, activePlacement.id));

      const [avgScore] = await ctx.db
        .select({ avg: sql<number>`avg(${assessment.totalScore})` })
        .from(assessment)
        .where(eq(assessment.placementId, activePlacement.id));

      return {
        assignedAssessments: Number(assigned?.count ?? 0),
        pendingReviewAssessments: Number(pending?.count ?? 0),
        submittedReports: Number(reports?.count ?? 0),
        averageScore: Number(avgScore?.avg ?? 0),
      };
    }),

  getTodayStatus: protectedProcedure
    .meta(docs.getTodayStatus)
    .use(
      requirePermissions({
        attendanceLog: ["read"],
        placement: ["read"],
        studentProfile: ["read"],
      }),
    )
    .query(async ({ ctx }) => {
      const student = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
        with: { user: true },
      });
      if (!student) throw new TRPCError({ code: "UNAUTHORIZED" });

      const activePlacement = await ctx.db.query.placement.findFirst({
        where: and(
          eq(placement.studentId, student.id),
          eq(placement.status, "active"),
        ),
      });

      if (!activePlacement) {
        return {
          canCheckIn: false,
          canCheckOut: false,
          hasCompleted: false,
          logData: null,
          placementId: null,
          studentName: student.user.name,
          studentId: student.userId,
        };
      }

      const todayStr = new Date().toISOString().slice(0, 10);

      const log = await ctx.db.query.attendanceLog.findFirst({
        where: and(
          eq(attendanceLog.placementId, activePlacement.id),
          eq(attendanceLog.date, todayStr),
        ),
      });

      const canCheckIn = !log;
      const canCheckOut = !!log && !log.checkOutAt;
      const hasCompleted = !!log && !!log.checkOutAt;

      return {
        canCheckIn,
        canCheckOut,
        hasCompleted,
        logData: log ?? null,
        placementId: String(activePlacement.id),
        studentName: student.user.name,
        studentId: student.userId,
      };
    }),

  checkIn: protectedProcedure
    .meta(docs.checkIn)
    .use(
      requirePermissions({
        attendance: ["create"],
        placement: ["read"],
        studentProfile: ["read"],
      }),
    )
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        selfieFilename: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const student = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
      });
      if (!student)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not a student",
        });

      const activePlacement = await ctx.db.query.placement.findFirst({
        where: and(
          eq(placement.studentId, student.id),
          eq(placement.status, "active"),
        ),
        with: { company: true },
      });

      if (!activePlacement)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No active placement",
        });
      if (!activePlacement.company)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Placement has no company",
        });

      const companyLat = Number(activePlacement.company.latitude);
      const companyLon = Number(activePlacement.company.longitude);

      console.log(activePlacement.company);
      const distance = calculateDistanceInMeters(
        input.latitude,
        input.longitude,
        companyLat,
        companyLon,
      );

      if (distance > 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Too far from company location (${Math.round(distance)}m)`,
        });
      }

      const todayStr = new Date().toISOString().slice(0, 10);

      const existing = await ctx.db.query.attendanceLog.findFirst({
        where: and(
          eq(attendanceLog.placementId, activePlacement.id),
          eq(attendanceLog.date, todayStr),
        ),
      });

      if (existing)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already checked in today",
        });

      await ctx.db.insert(attendanceLog).values({
        placementId: activePlacement.id,
        date: todayStr,
        checkInAt: new Date(),
        status: "present",
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
      });
      const saved = await ctx.db.query.attendanceLog.findFirst({
        where: and(
          eq(attendanceLog.placementId, activePlacement.id),
          eq(attendanceLog.date, todayStr),
        ),
      });
      if (!saved) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      const url = buildPublicUrlAction(input.selfieFilename);
      await ctx.db.insert(attachment).values({
        ownerType: "attendance_log",
        ownerId: saved.id,
        filename: input.selfieFilename,
        url,
        createdById: ctx.session.user.id,
      });
      return { success: true };
    }),

  checkOut: protectedProcedure
    .meta(docs.checkOut)
    .use(
      requirePermissions({
        attendance: ["create"],
        placement: ["read"],
        studentProfile: ["read"],
      }),
    )
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        selfieFilename: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const student = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
      });
      if (!student)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not a student",
        });

      const activePlacement = await ctx.db.query.placement.findFirst({
        where: and(
          eq(placement.studentId, student.id),
          eq(placement.status, "active"),
        ),
        with: { company: true },
      });

      if (!activePlacement)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No active placement",
        });
      if (!activePlacement.company)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Placement has no company",
        });

      const companyLat = Number(activePlacement.company.latitude);
      const companyLon = Number(activePlacement.company.longitude);
      const distance = calculateDistanceInMeters(
        input.latitude,
        input.longitude,
        companyLat,
        companyLon,
      );

      if (distance > 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Too far from company location (${Math.round(distance)}m)`,
        });
      }

      const todayStr = new Date().toISOString().slice(0, 10);

      const existing = await ctx.db.query.attendanceLog.findFirst({
        where: and(
          eq(attendanceLog.placementId, activePlacement.id),
          eq(attendanceLog.date, todayStr),
        ),
      });

      if (!existing)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not checked in yet",
        });
      if (existing.checkOutAt)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already checked out",
        });

      await ctx.db
        .update(attendanceLog)
        .set({ checkOutAt: new Date() })
        .where(eq(attendanceLog.id, existing.id));
      const url = buildPublicUrlAction(input.selfieFilename);
      await ctx.db.insert(attachment).values({
        ownerType: "attendance_log",
        ownerId: existing.id,
        filename: input.selfieFilename,
        url,
        createdById: ctx.session.user.id,
      });
      return { success: true };
    }),
});
