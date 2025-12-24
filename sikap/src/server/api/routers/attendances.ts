import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  adminOrMentorProcedure,
  createTRPCRouter,
  protectedProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import {
  attendanceLog,
  attendanceStatus,
  mentorProfile,
  placement,
  placementStatus,
  studentProfile,
  user,
} from "@/server/db/schema";

const docs = {
  list: {
    description:
      "## List Attendances (Admin/Mentor)\n\nRingkasan harian kehadiran dalam sebuah company, dengan filter tanggal dan paginasi.\n\n### Parameters\n- `companyId` (number)\n- `from` (Date, optional)\n- `to` (Date, optional)\n- `summaryDate` (Date, optional, default today)\n- `limit` (number, 1-200, default 30)\n- `offset` (number, >=0, default 0)\n\n### Response\n`{ summary, items, pagination, lastUpdated }` di mana `summary` berisi count hadir/tidak hadir untuk `summaryDate`, dan `items` adalah agregasi per tanggal `{ date, presentCount, absentCount, attendancePercent, total }`.\n\n### Example (React)\n```ts\nconst { data } = api.attendances.list.useQuery({ companyId: 1, from: dayjs().startOf('month').toDate() });\n```",
  },
  detail: {
    description:
      "## Detail Attendances per Tanggal (Admin/Mentor)\n\nDaftar kehadiran per siswa pada tanggal tertentu dengan filter mentor, status, dan pencarian.\n\n### Parameters\n- `companyId` (number)\n- `date` (Date)\n- `mentorId` (number, optional)\n- `status` (present | absent | late | excused, optional)\n- `search` (string, optional; nama atau kode siswa)\n- `limit` (number, 1-200, default 200)\n- `offset` (number, >=0, default 0)\n\n### Response\n`{ items, pagination, lastUpdated }` dengan `items` berisi `{ id, date, status, student: { id, userId, name, code }, mentor: { id, name } | null }`.\n\n### Example (React)\n```ts\nconst { data } = api.attendances.detail.useQuery({ companyId: 1, date: new Date(), mentorId });\n```",
  },
};

const studentUser = alias(user, "student_user");
const mentorUser = alias(user, "mentor_user");

function coerceRange(input: { from?: Date; to?: Date }) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: input.from ?? firstOfMonth,
    to: input.to ?? now,
  };
}

export const attendancesRouter = createTRPCRouter({
  list: adminOrMentorProcedure
    .meta(docs.list)
    .use(
      requirePermissions({
        attendanceLog: ["read"],
        placement: ["read"],
        studentProfile: ["read"],
      }),
    )
    .input(
      z.object({
        companyId: z.number(),
        from: z.date().optional(),
        to: z.date().optional(),
        summaryDate: z.date().optional(),
        limit: z.number().min(1).max(200).default(30),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const range = coerceRange(input);
      const fromDateStr = range.from.toISOString().slice(0, 10);
      const toDateStr = range.to.toISOString().slice(0, 10);

      let mentorFilterId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
      }

      const baseWhere = and(
        eq(placement.companyId, input.companyId),
        gte(attendanceLog.date, fromDateStr),
        lte(attendanceLog.date, toDateStr),
        mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
      );

      const rows = await ctx.db
        .select({
          date: attendanceLog.date,
          present: sql<number>`sum(case when ${attendanceLog.status} in ('present','late') then 1 else 0 end)`,
          absent: sql<number>`sum(case when ${attendanceLog.status} in ('absent','excused') then 1 else 0 end)`,
          total: sql<number>`count(*)`,
        })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .where(baseWhere)
        .groupBy(attendanceLog.date)
        .orderBy(sql`${attendanceLog.date} desc`)
        .limit(input.limit)
        .offset(input.offset);

      const totalDaysRows = await ctx.db
        .select({ total: sql<number>`count(distinct ${attendanceLog.date})` })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .where(baseWhere);
      const totalDays = totalDaysRows[0]?.total ?? 0;

      const summaryDate = (input.summaryDate ?? new Date())
        .toISOString()
        .slice(0, 10);
      const [summaryRow] = await ctx.db
        .select({
          present: sql<number>`sum(case when ${attendanceLog.status} in ('present','late') then 1 else 0 end)`,
          absent: sql<number>`sum(case when ${attendanceLog.status} in ('absent','excused') then 1 else 0 end)`,
          total: sql<number>`count(*)`,
        })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .where(
          and(
            eq(placement.companyId, input.companyId),
            eq(attendanceLog.date, summaryDate),
            mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
          ),
        );

      const formatRow = (r: (typeof rows)[number]) => {
        const present = Number(r.present ?? 0);
        const absent = Number(r.absent ?? 0);
        const total = Number(r.total ?? 0);
        const attendancePercent =
          total === 0 ? 0 : Math.round((present / total) * 100);
        return {
          date: r.date,
          presentCount: present,
          absentCount: absent,
          total,
          attendancePercent,
        };
      };

      return {
        summary: summaryRow
          ? (() => {
            const present = Number(summaryRow.present ?? 0);
            const absent = Number(summaryRow.absent ?? 0);
            const total = Number(summaryRow.total ?? 0);
            const attendancePercent =
              total === 0 ? 0 : Math.round((present / total) * 100);
            return {
              date: summaryDate,
              presentCount: present,
              absentCount: absent,
              total,
              attendancePercent,
            };
          })()
          : {
            date: summaryDate,
            presentCount: 0,
            absentCount: 0,
            total: 0,
            attendancePercent: 0,
          },
        items: rows.map(formatRow),
        pagination: {
          total: Number(totalDays ?? 0),
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
        attendanceLog: ["read"],
        placement: ["read"],
        studentProfile: ["read"],
        mentorProfile: ["read"],
      }),
    )
    .input(
      z.object({
        companyId: z.number().optional(),
        date: z.date(),
        mentorId: z.number().optional(),
        status: z.enum(attendanceStatus.enumValues).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(200),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const dateStr = input.date.toISOString().slice(0, 10);

      let mentorFilterId: number | null = input.mentorId ?? null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (mp) {
          mentorFilterId = mp.id;
        } else {
          // Mentor without profile - allow access but show all data (unfiltered)
          console.warn(
            "[attendances.detail] Mentor has no profile, showing unfiltered data",
            { userId: ctx.session.user.id },
          );
        }
      }

      const where = and(
        eq(attendanceLog.date, dateStr),
        input.companyId ? eq(placement.companyId, input.companyId) : undefined,
        mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
        input.status ? eq(attendanceLog.status, input.status) : undefined,
        input.search
          ? sql`(lower(${studentUser.name}) like ${"%" + input.search.toLowerCase() + "%"} or ${studentUser.id} = ${input.search})`
          : undefined,
      );

      const rows = await ctx.db
        .select({
          id: attendanceLog.id,
          date: attendanceLog.date,
          status: attendanceLog.status,
          checkInAt: attendanceLog.checkInAt,
          checkOutAt: attendanceLog.checkOutAt,
          placementId: placement.id,
          studentId: studentProfile.id,
          studentUserId: studentProfile.userId,
          studentName: studentUser.name,
          studentCode: studentUser.code,
          studentSchool: studentProfile.school,
          mentorId: mentorProfile.id,
          mentorName: mentorUser.name,
          verifiedAt: attendanceLog.verifiedAt,
          verifiedByMentorId: attendanceLog.verifiedByMentorId,
        })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
        .leftJoin(mentorProfile, eq(placement.mentorId, mentorProfile.id))
        .leftJoin(mentorUser, eq(mentorProfile.userId, mentorUser.id))
        .where(where)
        .orderBy(studentUser.name)
        .limit(input.limit)
        .offset(input.offset);

      const totalRows = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
        .leftJoin(mentorProfile, eq(placement.mentorId, mentorProfile.id))
        .leftJoin(mentorUser, eq(mentorProfile.userId, mentorUser.id))
        .where(where);
      const total = totalRows[0]?.total ?? 0;

      // Get per-student attendance counters for each placement
      const placementIds = [...new Set(rows.map((r) => r.placementId))];
      const countersMap = new Map<
        number,
        { hadir: number; tidakHadir: number; izin: number; terlambat: number }
      >();

      if (placementIds.length > 0) {
        const countersRows = await ctx.db
          .select({
            placementId: attendanceLog.placementId,
            status: attendanceLog.status,
            count: sql<number>`count(*)`,
          })
          .from(attendanceLog)
          .where(inArray(attendanceLog.placementId, placementIds))
          .groupBy(attendanceLog.placementId, attendanceLog.status);

        for (const row of countersRows) {
          if (!countersMap.has(row.placementId)) {
            countersMap.set(row.placementId, {
              hadir: 0,
              tidakHadir: 0,
              izin: 0,
              terlambat: 0,
            });
          }
          const counters = countersMap.get(row.placementId)!;
          const count = Number(row.count ?? 0);

          if (row.status === "present") counters.hadir += count;
          else if (row.status === "late") counters.terlambat += count;
          else if (row.status === "absent") counters.tidakHadir += count;
          else if (row.status === "excused") counters.izin += count;
        }
      }

      return {
        items: rows.map((r) => ({
          id: r.id,
          date: r.date,
          status: r.status,
          checkInAt: r.checkInAt ? r.checkInAt.toISOString() : null,
          checkOutAt: r.checkOutAt ? r.checkOutAt.toISOString() : null,
          student: {
            id: r.studentId,
            userId: r.studentUserId,
            code: r.studentCode,
            name: r.studentName ?? "",
            school: r.studentSchool ?? "",
          },
          mentor: r.mentorId
            ? { id: r.mentorId, name: r.mentorName ?? null }
            : null,
          verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null,
          verifiedByMentorId: r.verifiedByMentorId,
          counters: countersMap.get(r.placementId) ?? {
            hadir: 0,
            tidakHadir: 0,
            izin: 0,
            terlambat: 0,
          },
        })),
        pagination: {
          total: Number(total ?? 0),
          limit: input.limit,
          offset: input.offset,
        },
        lastUpdated: new Date().toISOString(),
      };
    }),

  myLog: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify user is a student
      if (ctx.session.user.role !== "student") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only students can access their attendance log",
        });
      }

      // Get student profile
      const student = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student profile not found",
        });
      }

      // Get active placement
      const activePlacement = await ctx.db.query.placement.findFirst({
        where: and(
          eq(placement.studentId, student.id),
          eq(placement.status, "active"),
        ),
      });

      if (!activePlacement) {
        // If no active placement, return empty list
        return {
          items: [],
          pagination: { total: 0, limit: input.limit, offset: input.offset },
        };
      }

      // Get today's date in YYYY-MM-DD format to filter out future dates
      const today = new Date().toISOString().slice(0, 10);

      // Query attendance logs - only show dates up to today
      const rows = await ctx.db
        .select({
          id: attendanceLog.id,
          date: attendanceLog.date,
          checkInAt: attendanceLog.checkInAt,
          checkOutAt: attendanceLog.checkOutAt,
          status: attendanceLog.status,
          locationNote: attendanceLog.locationNote,
        })
        .from(attendanceLog)
        .where(
          and(
            eq(attendanceLog.placementId, activePlacement.id),
            lte(attendanceLog.date, today), // Only show dates <= today
          ),
        )
        .orderBy(sql`${attendanceLog.date} desc`)
        .limit(input.limit)
        .offset(input.offset);

      const totalRows = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(attendanceLog)
        .where(
          and(
            eq(attendanceLog.placementId, activePlacement.id),
            lte(attendanceLog.date, today), // Only count dates <= today
          ),
        );

      const total = totalRows[0]?.total ?? 0;

      return {
        items: rows,
        pagination: {
          total: Number(total),
          limit: input.limit,
          offset: input.offset,
        },
      };
    }),

  getTodayLog: protectedProcedure.query(async ({ ctx }) => {
    // Return null for non-students instead of throwing error
    // This prevents console errors during background refetch when navigating between pages
    if (ctx.session.user.role !== "student") {
      return null;
    }

    // Get student profile
    const student = await ctx.db.query.studentProfile.findFirst({
      where: eq(studentProfile.userId, ctx.session.user.id),
    });

    if (!student) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student profile not found",
      });
    }

    // Get active placement
    const activePlacement = await ctx.db.query.placement.findFirst({
      where: and(
        eq(placement.studentId, student.id),
        eq(placement.status, "active"),
      ),
    });

    if (!activePlacement) {
      // If no active placement, return null
      return null;
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().slice(0, 10);

    // Query today's attendance log
    const todayLog = await ctx.db.query.attendanceLog.findFirst({
      where: and(
        eq(attendanceLog.placementId, activePlacement.id),
        eq(attendanceLog.date, today),
      ),
    });

    return todayLog ?? null;
  }),

  recordCheckIn: protectedProcedure
    .input(
      z.object({
        timestamp: z.date(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        locationNote: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is a student
      if (ctx.session.user.role !== "student") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only students can record attendance",
        });
      }

      // Get student profile
      const student = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student profile not found",
        });
      }

      // Get active placement
      const activePlacement = await ctx.db.query.placement.findFirst({
        where: and(
          eq(placement.studentId, student.id),
          eq(placement.status, "active"),
        ),
      });

      if (!activePlacement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active placement found for this student",
        });
      }

      // Get today's date in YYYY-MM-DD format
      const today = input.timestamp.toISOString().slice(0, 10);

      // Check if attendance record already exists for today
      const existing = await ctx.db.query.attendanceLog.findFirst({
        where: and(
          eq(attendanceLog.placementId, activePlacement.id),
          eq(attendanceLog.date, today),
        ),
      });

      if (existing) {
        // Update existing record
        const [updated] = await ctx.db
          .update(attendanceLog)
          .set({
            checkInAt: input.timestamp,
            latitude: input.latitude?.toString(),
            longitude: input.longitude?.toString(),
            locationNote: input.locationNote,
            status: "present",
          })
          .where(eq(attendanceLog.id, existing.id))
          .returning();

        return updated;
      } else {
        // Create new record
        const [created] = await ctx.db
          .insert(attendanceLog)
          .values({
            placementId: activePlacement.id,
            date: today,
            checkInAt: input.timestamp,
            latitude: input.latitude?.toString(),
            longitude: input.longitude?.toString(),
            locationNote: input.locationNote,
            status: "present",
          })
          .returning();

        return created;
      }
    }),

  recordCheckOut: protectedProcedure
    .input(
      z.object({
        timestamp: z.date(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        locationNote: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is a student
      if (ctx.session.user.role !== "student") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only students can record attendance",
        });
      }

      // Get student profile
      const student = await ctx.db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, ctx.session.user.id),
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student profile not found",
        });
      }

      // Get active placement
      const activePlacement = await ctx.db.query.placement.findFirst({
        where: and(
          eq(placement.studentId, student.id),
          eq(placement.status, "active"),
        ),
      });

      if (!activePlacement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active placement found for this student",
        });
      }

      // Get today's date in YYYY-MM-DD format
      const today = input.timestamp.toISOString().slice(0, 10);

      // Find today's attendance record
      const existing = await ctx.db.query.attendanceLog.findFirst({
        where: and(
          eq(attendanceLog.placementId, activePlacement.id),
          eq(attendanceLog.date, today),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No check-in record found for today. Please check in first.",
        });
      }

      // Update with check-out time
      const [updated] = await ctx.db
        .update(attendanceLog)
        .set({
          checkOutAt: input.timestamp,
        })
        .where(eq(attendanceLog.id, existing.id))
        .returning();

      return updated;
    }),

  /**
   * Aggregates attendance per student for a period (for AccumulationTable)
   */
  listStudentAccumulation: adminOrMentorProcedure
    .use(
      requirePermissions({
        attendanceLog: ["read"],
        placement: ["read"],
        studentProfile: ["read"],
      }),
    )
    .input(
      z.object({
        companyId: z.number().optional(),
        from: z.date().optional(),
        to: z.date().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const range = coerceRange({ from: input.from, to: input.to });

      // For mentors, filter by their company
      let mentorFilterId: number | null = null;
      let effectiveCompanyId = input.companyId;

      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
        effectiveCompanyId = mp.companyId ?? undefined;
      }

      // Build where clause - convert dates to string format for comparison
      const fromStr = range.from
        ? range.from.toISOString().slice(0, 10)
        : undefined;
      const toStr = range.to ? range.to.toISOString().slice(0, 10) : undefined;

      const where = and(
        fromStr ? gte(attendanceLog.date, fromStr) : undefined,
        toStr ? lte(attendanceLog.date, toStr) : undefined,
        effectiveCompanyId
          ? eq(placement.companyId, effectiveCompanyId)
          : undefined,
        mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
        input.search
          ? sql`lower(${studentUser.name}) like ${`%${input.search.toLowerCase()}%`}`
          : undefined,
      );

      // Aggregate attendance counts per student
      const rows = await ctx.db
        .select({
          studentId: studentProfile.id,
          studentName: studentUser.name,
          studentNis: studentProfile.nis,
          status: attendanceLog.status,
          count: sql<number>`count(*)`,
        })
        .from(attendanceLog)
        .innerJoin(placement, eq(attendanceLog.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
        .where(where)
        .groupBy(
          studentProfile.id,
          studentUser.name,
          studentProfile.nis,
          attendanceLog.status,
        )
        .orderBy(studentUser.name);

      // Transform rows into per-student aggregation
      const studentMap = new Map<
        number,
        {
          studentId: number;
          studentName: string;
          studentNis: string | null;
          present: number;
          excused: number;
          absent: number;
          late: number;
        }
      >();

      for (const row of rows) {
        if (!studentMap.has(row.studentId)) {
          studentMap.set(row.studentId, {
            studentId: row.studentId,
            studentName: row.studentName ?? "Unknown",
            studentNis: row.studentNis,
            present: 0,
            excused: 0,
            absent: 0,
            late: 0,
          });
        }
        const student = studentMap.get(row.studentId)!;
        const count = Number(row.count);
        if (row.status === "present") student.present += count;
        else if (row.status === "excused") student.excused += count;
        else if (row.status === "absent") student.absent += count;
        else if (row.status === "late") {
          student.late += count;
          student.present += count; // Late is still present
        }
      }

      // Convert to array and apply pagination
      const allStudents = Array.from(studentMap.values());
      const paginatedStudents = allStudents.slice(
        input.offset,
        input.offset + input.limit,
      );

      return {
        items: paginatedStudents.map((s, idx) => ({
          no: input.offset + idx + 1,
          studentId: s.studentId,
          name: s.studentName,
          nis: s.studentNis,
          present: s.present,
          excused: s.excused,
          absent: s.absent,
        })),
        pagination: {
          total: allStudents.length,
          limit: input.limit,
          offset: input.offset,
        },
      };
    }),

  verify: adminOrMentorProcedure
    .use(
      requirePermissions({
        attendanceLog: ["update"],
      }),
    )
    .input(
      z.object({
        id: z.number(),
        status: z.enum(attendanceStatus.enumValues).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // If mentor, ensure the attendance belongs to their company
      let mentorProfileId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorProfileId = mp.id;
      }

      const log = await ctx.db.query.attendanceLog.findFirst({
        where: eq(attendanceLog.id, input.id),
        with: {
          placement: true,
        },
      });

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attendance log not found",
        });
      }

      // Check access
      if (mentorProfileId && log.placement.mentorId !== mentorProfileId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to verify this attendance",
        });
      }

      const [updated] = await ctx.db
        .update(attendanceLog)
        .set({
          status: input.status ?? log.status,
          verifiedByMentorId: mentorProfileId,
          verifiedAt: new Date(),
        })
        .where(eq(attendanceLog.id, input.id))
        .returning();

      return updated;
    }),

  delete: adminOrMentorProcedure
    .use(
      requirePermissions({
        attendanceLog: ["delete"],
      }),
    )
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // If mentor, ensure the attendance belongs to their company
      let mentorProfileId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorProfileId = mp.id;
      }

      const log = await ctx.db.query.attendanceLog.findFirst({
        where: eq(attendanceLog.id, input.id),
        with: {
          placement: true,
        },
      });

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attendance log not found",
        });
      }

      // Check access
      if (mentorProfileId && log.placement.mentorId !== mentorProfileId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this attendance",
        });
      }
      await ctx.db.delete(attendanceLog).where(eq(attendanceLog.id, input.id));

      return { success: true };
    }),
});
