import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  attachment,
  ownerType,
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
};

async function requireStudentPlacement(ctx: { db: any; session: any }) {
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
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);
      const where = and(
        eq(placement.studentId, sp.id),
        input.status ? eq(task.status, input.status) : undefined,
        input.search
          ? sql`(lower(${task.title}) like ${"%" + input.search.toLowerCase() + "%"} or lower(${task.description}) like ${
              "%" + input.search.toLowerCase() + "%"
            })`
          : undefined,
      );

      const rows = await ctx.db
        .select({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
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
        })),
        pagination: { total: Number(total ?? 0), limit: input.limit, offset: input.offset },
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

      const files = await ctx.db.query.attachment.findMany({
        where: and(eq(attachment.ownerType, "task"), eq(attachment.ownerId, t.id)),
      });

      return {
        id: t.id,
        title: t.title,
        description: t.description ?? null,
        dueDate: t.dueDate ?? null,
        status: t.status,
        submission: {
          note: t.submissionNote ?? null,
          submittedAt: t.submittedAt ?? null,
          files: files.map((f) => ({
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
        fileUrl: z.string().url(),
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
        })
        .from(task)
        .innerJoin(placement, eq(task.placementId, placement.id))
        .where(eq(task.id, input.taskId))
        .limit(1);
      const t = rows[0];
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      if (t.placementStudentId !== sp.id) throw new TRPCError({ code: "FORBIDDEN" });

      await ctx.db.delete(attachment).where(and(eq(attachment.ownerType, "task"), eq(attachment.ownerId, t.id)));

      await ctx.db.insert(attachment).values({
        ownerType: ownerType.enumValues.includes("task") ? "task" : ("task" as any),
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
});
