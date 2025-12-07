import { z } from "zod";
import { and, eq, sql, inArray, notInArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { type db } from "@/server/db";
import { type Session } from "@/server/better-auth/config";

import {
  adminOrMentorProcedure,
  createTRPCRouter,
  protectedProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import {
  attachment,
  mentorProfile,
  placement,
  studentProfile,
  task,
  taskStatus,
  user,
} from "@/server/db/schema";

const docs = {
  listAssigned: {
    description:
      "## List Task untuk Siswa Login\n\nMengambil daftar tugas milik siswa dengan pencarian dan filter status.\n\n### Parameters\n- `search` (string, optional; judul/deskripsi)\n- `status` (todo | in_progress | submitted | approved | rejected, optional)\n- `limit` (number, 1-200, default 100)\n- `offset` (number, >=0, default 0)\n\n### Response\n`{ items, pagination, lastUpdated }` dengan `items` berisi `{ id, title, description, dueDate, status }`.\n\n### Example (React)\n```ts\nconst { data } = api.tasks.listAssigned.useQuery({ search: 'wireframe' });\n```",
  },
  detail: {
    description:
      "## Detail Task Siswa\n\nMenampilkan detail tugas beserta lampiran submission jika ada.\n\n### Parameters\n- `taskId` (number)\n\n### Response\n`{ id, title, description, dueDate, status, submission: { note, submittedAt, files[] } }`.\n\n### Example (React)\n```ts\nconst { data } = api.tasks.detail.useQuery({ taskId: 1 });\n```",
  },
  submit: {
    description:
      "## Submit Task Siswa\n\nMengirimkan file tugas dan catatan. Jika sudah pernah submit, data akan ditimpa (lampiran lama dihapus dari DB — hapus file storage di sisi FE jika perlu).\n\n### Parameters\n- `taskId` (number)\n- `fileUrl` (string, url)\n- `fileName` (string, optional)\n- `notes` (string, optional)\n\n### Response\n`{ ok: true }`.\n\n### Example (React)\n```ts\nconst submit = api.tasks.submit.useMutation();\nsubmit.mutate({ taskId: 1, fileUrl: upload.url, fileName: upload.name, notes: 'Done' });\n```",
  },
  list: {
    description: "## List Tasks (Mentor)\n\nList tugas untuk mentor.",
  },
  create: {
    description: "## Create Task (Mentor)\n\nBuat tugas baru untuk siswa.",
  },
  update: {
    description: "## Update Task (Mentor)\n\nUpdate detail tugas.",
  },
  delete: {
    description: "## Delete Task (Mentor)\n\nHapus tugas.",
  },
};

async function requireStudentPlacement(ctx: {
  db: typeof db;
  session: Session | null;
}) {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const role = ctx.session.user.role;
  if (role !== "student") throw new TRPCError({ code: "FORBIDDEN" });
  const sp = await ctx.db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, ctx.session.user.id),
  });
  if (!sp) throw new TRPCError({ code: "FORBIDDEN" });
  return sp;
}

export const tasksRouter = createTRPCRouter({
  listAssigned: protectedProcedure
    .meta(docs.listAssigned)
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(taskStatus.enumValues).optional(),
        statuses: z.array(z.enum(taskStatus.enumValues)).optional(),
        excludeStatuses: z.array(z.enum(taskStatus.enumValues)).optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);

      // Build status filter
      const conditions = [
        eq(placement.studentId, sp.id),
        input.search
          ? sql`(lower(${task.title}) like ${"%" + input.search.toLowerCase() + "%"} or lower(${task.description}) like ${"%" + input.search.toLowerCase() + "%"})`
          : undefined,
      ];

      if (input.statuses && input.statuses.length > 0) {
        conditions.push(inArray(task.status, input.statuses));
      }

      if (input.excludeStatuses && input.excludeStatuses.length > 0) {
        conditions.push(notInArray(task.status, input.excludeStatuses));
      }

      if (input.status) {
        conditions.push(eq(task.status, input.status));
      }

      const where = and(...conditions);

      const rows = await ctx.db
        .select({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
          submittedAt: task.submittedAt,
          updatedAt: task.updatedAt,
        })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .where(where)
        .orderBy(task.dueDate)
        .limit(input.limit)
        .offset(input.offset);

      const totalRows = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .where(where);
      const total = totalRows[0]?.total ?? 0;

      return {
        items: rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description ?? null,
          dueDate: r.dueDate ?? null,
          status: r.status,
          submittedAt: r.submittedAt ?? null,
          updatedAt: r.updatedAt ?? null,
        })),
        pagination: {
          total: Number(total ?? 0),
          limit: input.limit,
          offset: input.offset,
        },
        lastUpdated: new Date().toISOString(),
      };
    }),

  detail: protectedProcedure
    .meta(docs.detail)
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);
      const rows = await ctx.db
        .select({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
          submissionNote: task.submissionNote,
          submittedAt: task.submittedAt,
          placementId: placement.id,
          studentId: placement.studentId,
          createdById: task.createdById,
        })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .where(eq(task.id, input.taskId))
        .limit(1);

      const t = rows[0];
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      if (t.studentId !== sp.id) throw new TRPCError({ code: "FORBIDDEN" });

      const allFiles = await ctx.db.query.attachment.findMany({
        where: and(
          eq(attachment.ownerType, "task"),
          eq(attachment.ownerId, t.id),
        ),
      });

      // Separate files into mentor's (task materials) and student's (submission)
      const taskAttachments = allFiles.filter(
        (f) => f.createdById === t.createdById,
      );
      const submissionFiles = allFiles.filter(
        (f) => f.createdById !== t.createdById,
      );

      return {
        id: t.id,
        title: t.title,
        description: t.description ?? null,
        dueDate: t.dueDate ?? null,
        status: t.status,
        attachments: taskAttachments.map((f) => ({
          id: f.id,
          url: f.url,
          filename: f.filename ?? null,
          mimeType: f.mimeType ?? null,
          sizeBytes: f.sizeBytes ?? null,
        })),
        submission: {
          note: t.submissionNote ?? null,
          submittedAt: t.submittedAt ?? null,
          files: submissionFiles.map((f) => ({
            id: f.id,
            url: f.url,
            filename: f.filename ?? null,
            mimeType: f.mimeType ?? null,
            sizeBytes: f.sizeBytes ?? null,
          })),
        },
      };
    }),

  // Mentor version of task detail - allows mentors to view task details with attachments
  detailForMentor: adminOrMentorProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const t = await ctx.db.query.task.findFirst({
        where: eq(task.id, input.taskId),
      });

      if (!t) throw new TRPCError({ code: "NOT_FOUND" });

      // For mentors, verify they created the task or have access
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        // Check if mentor created this task or has access to the placement
        if (t.createdById !== ctx.session.user.id) {
          const placementData = await ctx.db.query.placement.findFirst({
            where: and(eq(placement.id, t.placementId), eq(placement.mentorId, mp.id)),
          });
          if (!placementData) throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      const allFiles = await ctx.db.query.attachment.findMany({
        where: and(
          eq(attachment.ownerType, "task"),
          eq(attachment.ownerId, t.id),
        ),
      });

      // Separate files into mentor's (task materials) and student's (submission)
      const taskAttachments = allFiles.filter(
        (f) => f.createdById === t.createdById,
      );
      const submissionFiles = allFiles.filter(
        (f) => f.createdById !== t.createdById,
      );

      return {
        id: t.id,
        title: t.title,
        description: t.description ?? null,
        dueDate: t.dueDate ?? null,
        status: t.status,
        attachments: taskAttachments.map((f) => ({
          id: f.id,
          url: f.url,
          filename: f.filename ?? null,
          mimeType: f.mimeType ?? null,
          sizeBytes: f.sizeBytes ?? null,
        })),
        submission: {
          note: t.submissionNote ?? null,
          submittedAt: t.submittedAt ?? null,
          files: submissionFiles.map((f) => ({
            id: f.id,
            url: f.url,
            filename: f.filename ?? null,
            mimeType: f.mimeType ?? null,
            sizeBytes: f.sizeBytes ?? null,
          })),
        },
      };
    }),

  submit: protectedProcedure
    .meta(docs.submit)
    .input(
      z.object({
        taskId: z.number(),
        fileUrl: z.string(),
        fileName: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);

      const rows = await ctx.db
        .select({
          id: task.id,
          placementStudentId: placement.studentId,
          status: task.status,
        })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .where(eq(task.id, input.taskId))
        .limit(1);
      const t = rows[0];
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      if (t.placementStudentId !== sp.id)
        throw new TRPCError({ code: "FORBIDDEN" });

      // Validate task status - only allow submission for 'todo' or 'in_progress' tasks
      if (t.status !== "todo" && t.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tugas ini sudah diserahkan dan tidak dapat diunggah ulang",
        });
      }

      // Delete ONLY student's previous attachments for this task
      await ctx.db.delete(attachment).where(
        and(
          eq(attachment.ownerType, "task"),
          eq(attachment.ownerId, t.id),
          eq(attachment.createdById, ctx.session.user.id), // Only delete files created by the student
        ),
      );

      await ctx.db.insert(attachment).values({
        ownerType: "task",
        ownerId: t.id,
        url: input.fileUrl,
        filename: input.fileName ?? null,
        createdById: ctx.session.user.id,
      });

      await ctx.db
        .update(task)
        .set({
          submissionNote: input.notes ?? null,
          submittedAt: new Date(),
          status: "submitted",
        })
        .where(eq(task.id, t.id));

      return { ok: true };
    }),

  list: adminOrMentorProcedure
    .meta(docs.list)
    .use(requirePermissions({ task: ["read"], placement: ["read"] }))
    .input(
      z.object({
        companyId: z.number().optional(),
        search: z.string().optional(),
        status: z.enum(taskStatus.enumValues).optional(),
        from: z.date().optional(),
        to: z.date().optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      let mentorFilterId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
      }

      const where = and(
        input.companyId ? eq(placement.companyId, input.companyId) : undefined,
        mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
        input.status ? eq(task.status, input.status) : undefined,
        input.from
          ? sql`${task.dueDate} >= ${input.from.toISOString()}`
          : undefined,
        input.to
          ? sql`${task.dueDate} <= ${input.to.toISOString()}`
          : undefined,
        input.search
          ? sql`(lower(${task.title}) like ${"%" + input.search.toLowerCase() + "%"} or lower(${task.description}) like ${"%" + input.search.toLowerCase() + "%"
            })`
          : undefined,
      );

      const rows = await ctx.db
        .select({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          targetMajor: task.targetMajor,
          createdAt: sql<Date>`min(${task.createdAt})`,
          assignedCount: sql<number>`count(*)`,
          submittedCount: sql<number>`sum(case when ${task.status} = 'submitted' then 1 else 0 end)`,
          id: sql<number>`min(${task.id})`,
        })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .where(where)
        .groupBy(
          task.title,
          task.description,
          task.dueDate,
          task.targetMajor,
        )
        .orderBy(sql`${task.dueDate} desc`)
        .limit(input.limit)
        .offset(input.offset);

      const totalRows = await ctx.db
        .select({ count: sql<number>`count(distinct ${task.title})` })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .where(where);

      return {
        items: rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description ?? "",
          dueDate: r.dueDate ? new Date(r.dueDate) : new Date(),
          targetMajor: r.targetMajor ?? undefined,
          createdAt: r.createdAt,
          assignedCount: Number(r.assignedCount),
          submittedCount: Number(r.submittedCount),
          status: "todo",
        })),
        pagination: {
          total: Number(totalRows[0]?.count ?? 0),
          limit: input.limit,
          offset: input.offset,
        },
        lastUpdated: new Date().toISOString(),
      };
    }),

  create: adminOrMentorProcedure
    .meta(docs.create)
    .use(requirePermissions({ task: ["create"] }))
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        dueDate: z.date(),
        targetMajor: z.string().optional(),
        placementIds: z.array(z.number()).optional(),
        attachments: z
          .array(z.object({ url: z.string(), filename: z.string().optional() }))
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let mentorId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorId = mp.id;
      }

      const placements = await ctx.db
        .select({
          id: placement.id,
          studentId: placement.studentId,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .where(
          and(
            eq(placement.status, "active"),
            mentorId ? eq(placement.mentorId, mentorId) : undefined,
            input.targetMajor
              ? eq(studentProfile.major, input.targetMajor)
              : undefined,
            input.placementIds
              ? inArray(placement.id, input.placementIds)
              : undefined,
          ),
        );

      if (placements.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tidak ada siswa aktif yang ditemukan untuk kriteria ini",
        });
      }

      await ctx.db.transaction(async (tx) => {
        for (const p of placements) {
          const [newTask] = await tx
            .insert(task)
            .values({
              placementId: p.id,
              title: input.title,
              description: input.description,
              dueDate: input.dueDate.toISOString(),
              targetMajor: input.targetMajor,
              createdById: ctx.session.user.id,
              status: "todo",
            })
            .returning({ id: task.id });

          if (input.attachments && input.attachments.length > 0 && newTask) {
            for (const att of input.attachments) {
              await tx.insert(attachment).values({
                ownerType: "task",
                ownerId: newTask.id,
                url: att.url,
                filename: att.filename,
                createdById: ctx.session.user.id,
              });
            }
          }
        }
      });

      return { count: placements.length };
    }),

  update: adminOrMentorProcedure
    .meta(docs.update)
    .use(requirePermissions({ task: ["update"] }))
    .input(
      z.object({
        originalTaskId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        targetMajor: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.db.query.task.findFirst({
        where: eq(task.id, input.originalTaskId),
      });
      if (!original) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        ctx.session.user.role === "mentor" &&
        original.createdById !== ctx.session.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .update(task)
        .set({
          title: input.title ?? undefined,
          description: input.description ?? undefined,
          dueDate: input.dueDate ? input.dueDate.toISOString() : undefined,
          targetMajor: input.targetMajor ?? undefined,
        })
        .where(
          and(
            eq(task.createdById, original.createdById),
            eq(task.title, original.title),
            eq(task.description, original.description ?? ""),
            eq(task.dueDate, original.dueDate ?? ""),
          ),
        );

      return { ok: true };
    }),

  delete: adminOrMentorProcedure
    .meta(docs.delete)
    .use(requirePermissions({ task: ["delete"] }))
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.db.query.task.findFirst({
        where: eq(task.id, input.taskId),
      });
      if (!original) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        ctx.session.user.role === "mentor" &&
        original.createdById !== ctx.session.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .delete(task)
        .where(
          and(
            eq(task.createdById, original.createdById),
            eq(task.title, original.title),
            eq(task.description, original.description ?? ""),
            eq(task.dueDate, original.dueDate ?? ""),
          ),
        );

      return { ok: true };
    }),

  getSubmissions: adminOrMentorProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      // 1. Get the reference task to find the group
      const refTask = await ctx.db.query.task.findFirst({
        where: eq(task.id, input.taskId),
      });
      if (!refTask) throw new TRPCError({ code: "NOT_FOUND" });

      // 2. Find all tasks in the same group (same title, description, dueDate, createdById)
      // Note: We use the same criteria as update/delete to identify the group
      const groupTasks = await ctx.db
        .select({
          id: task.id,
          status: task.status,
          submittedAt: task.submittedAt,
          submissionNote: task.submissionNote,
          studentId: studentProfile.id,
          studentName: user.name,
          studentCode: studentProfile.nis,
        })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(
          and(
            eq(task.createdById, refTask.createdById),
            eq(task.title, refTask.title),
            eq(task.description, refTask.description ?? ""),
            eq(task.dueDate, refTask.dueDate ?? ""),
          ),
        );

      // 3. Get attachments for these tasks (if any submission files)
      const taskIds = groupTasks.map((t) => t.id);
      const attachments =
        taskIds.length > 0
          ? await ctx.db.query.attachment.findMany({
            where: and(
              eq(attachment.ownerType, "task"),
              inArray(attachment.ownerId, taskIds),
            ),
          })
          : [];

      // 4. Calculate stats
      const stats = {
        total: groupTasks.length,
        todo: 0,
        inProgress: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
      };

      const submissions = groupTasks.map((t) => {
        // Count stats
        if (t.status === "todo") stats.todo++;
        else if (t.status === "in_progress") stats.inProgress++;
        else if (t.status === "submitted") stats.submitted++;
        else if (t.status === "approved") stats.approved++;
        else if (t.status === "rejected") stats.rejected++;

        return {
          id: t.id,
          studentId: t.studentId,
          studentName: t.studentName,
          studentCode: t.studentCode,
          status: t.status,
          submittedAt: t.submittedAt,
          submissionNote: t.submissionNote,
          files: attachments
            .filter((a) => a.ownerId === t.id)
            .map((a) => ({
              id: a.id,
              url: a.url,
              filename: a.filename,
              mimeType: a.mimeType,
              sizeBytes: a.sizeBytes,
            })),
        };
      });

      return {
        task: {
          id: refTask.id,
          title: refTask.title,
          description: refTask.description,
          dueDate: refTask.dueDate,
          createdAt: refTask.createdAt,
        },
        submissions,
        stats,
      };
    }),

  // List all tasks per student for Laporan page (mentor view)
  listForMentor: adminOrMentorProcedure
    .use(requirePermissions({ task: ["read"], placement: ["read"], studentProfile: ["read"] }))
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["belum_dikerjakan", "belum_direview", "sudah_direview"]).optional(),
        from: z.date().optional(),
        to: z.date().optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      let mentorFilterId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
      }

      // Map UI status to DB statuses
      let statusFilter: typeof taskStatus.enumValues[number][] | undefined;
      if (input.status === "belum_dikerjakan") {
        statusFilter = ["todo", "in_progress"];
      } else if (input.status === "belum_direview") {
        statusFilter = ["submitted"];
      } else if (input.status === "sudah_direview") {
        statusFilter = ["approved"];
      }
      // Note: "rejected" is hidden from UI

      const where = and(
        mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
        statusFilter ? inArray(task.status, statusFilter) : notInArray(task.status, ["rejected"]), // Hide rejected
        input.from
          ? sql`${task.dueDate} >= ${input.from.toISOString()}`
          : undefined,
        input.to
          ? sql`${task.dueDate} <= ${input.to.toISOString()}`
          : undefined,
        input.search
          ? sql`(lower(${task.title}) like ${"%" + input.search.toLowerCase() + "%"} or lower(${user.name}) like ${"%" + input.search.toLowerCase() + "%"})`
          : undefined,
      );

      const rows = await ctx.db
        .select({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
          submittedAt: task.submittedAt,
          createdAt: task.createdAt,
          studentId: studentProfile.id,
          studentUserId: studentProfile.userId,
          studentName: user.name,
        })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(where)
        .orderBy(sql`${task.dueDate} desc nulls last`, sql`${task.createdAt} desc`)
        .limit(input.limit)
        .offset(input.offset);

      const totalRows = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(where);
      const total = totalRows[0]?.total ?? 0;

      // Map DB status to UI status
      const mapStatus = (s: string): "belum_dikerjakan" | "belum_direview" | "sudah_direview" => {
        if (s === "todo" || s === "in_progress") return "belum_dikerjakan";
        if (s === "submitted") return "belum_direview";
        return "sudah_direview"; // approved
      };

      return {
        items: rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description ?? null,
          dueDate: r.dueDate ?? null,
          status: mapStatus(r.status),
          dbStatus: r.status, // Keep original for detail page
          submittedAt: r.submittedAt ?? null,
          createdAt: r.createdAt,
          student: {
            id: r.studentId,
            userId: r.studentUserId,
            name: r.studentName ?? "",
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

  // Review/approve a task submission
  review: adminOrMentorProcedure
    .use(requirePermissions({ task: ["update"] }))
    .input(
      z.object({
        taskId: z.number(),
        status: z.enum(["approved", "rejected"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const t = await ctx.db.query.task.findFirst({
        where: eq(task.id, input.taskId),
      });

      if (!t) throw new TRPCError({ code: "NOT_FOUND" });

      // Only allow reviewing submitted tasks
      if (t.status !== "submitted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Hanya tugas yang sudah disubmit yang bisa direview"
        });
      }

      // For mentors, verify they have access to this task
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });

        const p = await ctx.db.query.placement.findFirst({
          where: and(eq(placement.id, t.placementId), eq(placement.mentorId, mp.id)),
        });
        if (!p) throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .update(task)
        .set({
          status: input.status,
          submissionNote: input.notes ? `${t.submissionNote ?? ""}\n\n[Review]: ${input.notes}` : t.submissionNote,
        })
        .where(eq(task.id, input.taskId));

      return { ok: true };
    }),
});
