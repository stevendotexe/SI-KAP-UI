import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { and, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { adminOrMentorProcedure, createTRPCRouter, protectedProcedure, requirePermissions } from "@/server/api/trpc";
import {
  attachment,
  calendarEvent,
  company,
  eventType,
  mentorProfile,
  placement,
  studentProfile,
  type AttachmentInsert,
  type CalendarEventInsert,
  user,
} from "@/server/db/schema";

const docs = {
  list: {
    description:
      "## List Calendar Events (Admin/Mentor)\n\nFilter per bulan + tipe + pencarian judul/penyelenggara.\n\n### Parameters\n- `companyId` (number)\n- `month` (1-12, optional, default bulan ini)\n- `year` (number, optional, default tahun ini)\n- `type` (in_class | field_trip | meet_greet | meeting | deadline | milestone, optional)\n- `search` (string, optional; judul atau penyelenggara)\n\n### Response\nArray `items` berisi `{ id, title, startDate, dueDate, type, organizerName, colorHex, placementId }`.\n\n### Example (React)\n```ts\nconst { data } = api.calendarEvents.list.useQuery({ companyId: 1, month: 8, year: 2025, type: 'field_trip' });\n```",
  },
  detail: {
    description:
      "## Detail Calendar Event (Admin/Mentor)\n\nMengembalikan semua field event termasuk lampiran.\n\n### Parameters\n- `eventId` (number)\n\n### Response\n`{ id, title, description, type, startDate, dueDate, organizerName, organizerLogoUrl, colorHex, placementId, attachments, createdBy }`.\n\n### Example (React)\n```ts\nconst { data } = api.calendarEvents.detail.useQuery({ eventId: 10 });\n```",
  },
  create: {
    description:
      "## Create Calendar Event\n\nMembuat event baru.\n\n### Parameters\n- `title` (string)\n- `type` (in_class | field_trip | meet_greet | meeting | deadline | milestone)\n- `date` (Date)\n- `endDate` (Date, optional)\n- `description` (string, optional)\n- `location` (string, optional)\n- `organizerName` (string, optional)\n- `organizerLogoUrl` (string, optional)\n- `colorHex` (string, optional)\n- `placementId` (number, optional)\n- `attachments` (array `{ url, filename? }`, optional)\n\n### Response\n`{ id }`.\n\n### Example (React)\n```ts\nconst m = api.calendarEvents.create.useMutation();\nm.mutate({ title: 'Workshop', type: 'in_class', date: new Date(), organizerName: 'PT TI' });\n```",
  },
  update: {
    description:
      "## Update Calendar Event\n\nMengubah event dan lampiran.\n\n### Parameters\n- `eventId` (number)\n- field sama seperti create (opsional)\n\n### Response\n`{ ok: true }`.",
  },
  delete: { description: "## Delete Calendar Event\n\nHapus event beserta lampirannya." },
  listForStudent: {
    description:
      "## List Calendar Events (Student)\\n\\nDaftar event kalender untuk siswa berdasarkan placement mereka.\\n\\n### Parameters\\n- `month` (1-12, optional, default bulan ini)\\n- `year` (number, optional, default tahun ini)\\n- `type` (in_class | field_trip | meet_greet | meeting | deadline | milestone, optional)\\n\\n### Response\\nArray `items` berisi `{ id, title, startDate, endDate, type, colorHex }`.\\n\\n### Example (React)\\n```ts\\nconst { data } = api.calendarEvents.listForStudent.useQuery({ month: 8, year: 2025 });\\n```",
  },
  listForAdmin: {
    description:
      "## List Calendar Events (Admin)\\n\\nDaftar semua event kalender untuk admin (semua companies).\\n\\n### Parameters\\n- `month` (1-12, optional, default bulan ini)\\n- `year` (number, optional, default tahun ini)\\n- `type` (in_class | field_trip | meet_greet | meeting | deadline | milestone, optional)\\n- `search` (string, optional; judul atau penyelenggara)\\n\\n### Response\\nArray berisi `{ id, title, startDate, endDate, type, organizerName, colorHex, placementId, companyName }`.\\n\\n### Example (React)\\n```ts\\nconst { data } = api.calendarEvents.listForAdmin.useQuery({ month: 8, year: 2025 });\\n```",
  },
};


async function requireStudentPlacement(ctx: { db: any; session: any }) {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });

  // Check role first
  const role = ctx.session.user.role;
  if (role !== "student") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only students can access this endpoint" });
  }

  const sp = await ctx.db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, ctx.session.user.id),
  });
  if (!sp) throw new TRPCError({ code: "FORBIDDEN", message: "Student profile not found" });
  return sp;
}
const creatorUser = alias(user, "creator_user");

function monthRange(params: { month?: number; year?: number }) {
  const now = new Date();
  const m = params.month ? params.month - 1 : now.getMonth();
  const y = params.year ?? now.getFullYear();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0));
  return { start, end };
}

export const calendarEventsRouter = createTRPCRouter({
  list: adminOrMentorProcedure
    .meta(docs.list)
    .use(requirePermissions({ calendarEvent: ["read"], placement: ["read"] }))
    .input(
      z.object({
        companyId: z.number().optional(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
        type: z.enum(eventType.enumValues).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const range = monthRange({ month: input.month, year: input.year });
      const startStr = range.start.toISOString().slice(0, 10);
      const endStr = range.end.toISOString().slice(0, 10);

      let mentorFilterId: number | null = null;
      let effectiveCompanyId = input.companyId;

      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;

        // If companyId not provided, use mentor's companyId
        if (!effectiveCompanyId) {
          effectiveCompanyId = mp.companyId ?? undefined;
        } else if (mp.companyId && effectiveCompanyId !== mp.companyId) {
          // If companyId provided, validate it matches mentor's company
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot access events from other companies" });
        }
      }

      const startDateExpr = sql`(${calendarEvent.scheduledAt})::date`;
      const dueDateExpr = sql`coalesce(${calendarEvent.endDate}, ${calendarEvent.scheduledAt})::date`;
      const overlapWhere = and(lte(startDateExpr, endStr), gte(dueDateExpr, startStr));

      // Use LEFT JOIN to include company-wide events (placementId = null)
      const rows = await ctx.db
        .select({
          id: calendarEvent.id,
          title: calendarEvent.title,
          description: calendarEvent.description,
          type: calendarEvent.type,
          startDate: calendarEvent.scheduledAt,
          dueDate: calendarEvent.endDate,
          organizerName: calendarEvent.organizerName,
          colorHex: calendarEvent.colorHex,
          placementId: placement.id,
          organizerLogoUrl: calendarEvent.organizerLogoUrl,
        })
        .from(calendarEvent)
        .leftJoin(placement, eq(calendarEvent.placementId, placement.id))
        .where(
          and(
            // For admin: if companyId provided, show events for that company OR company-wide events (placementId is null)
            // For admin without companyId: show all events
            // For mentor: filter by their company OR company-wide events
            effectiveCompanyId
              ? sql`(${calendarEvent.placementId} IS NULL OR ${placement.companyId} = ${effectiveCompanyId})`
              : undefined,
            mentorFilterId
              ? sql`(${calendarEvent.placementId} IS NULL OR ${placement.mentorId} = ${mentorFilterId})`
              : undefined,
            overlapWhere,
            input.type ? eq(calendarEvent.type, input.type) : undefined,
            input.search
              ? sql`(lower(${calendarEvent.title}) like ${"%" + input.search.toLowerCase() + "%"} or lower(coalesce(${calendarEvent.organizerName}, '')) like ${"%" + input.search.toLowerCase() + "%"})`
              : undefined,
          ),
        )
        .orderBy(calendarEvent.scheduledAt);

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? null,
        type: r.type,
        startDate: r.startDate,
        dueDate: r.dueDate ?? r.startDate,
        organizerName: r.organizerName ?? null,
        organizerLogoUrl: r.organizerLogoUrl ?? null,
        colorHex: r.colorHex ?? null,
        placementId: r.placementId ?? null,
      }));
    }),

  detail: adminOrMentorProcedure
    .meta(docs.detail)
    .use(requirePermissions({ calendarEvent: ["read"], placement: ["read"] }))
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: calendarEvent.id,
          title: calendarEvent.title,
          description: calendarEvent.description,
          type: calendarEvent.type,
          startDate: calendarEvent.scheduledAt,
          dueDate: calendarEvent.endDate,
          organizerName: calendarEvent.organizerName,
          organizerLogoUrl: calendarEvent.organizerLogoUrl,
          colorHex: calendarEvent.colorHex,
          placementId: calendarEvent.placementId,
          createdById: calendarEvent.createdById,
          createdByName: creatorUser.name,
          createdByEmail: creatorUser.email,
        })
        .from(calendarEvent)
        .leftJoin(creatorUser, eq(calendarEvent.createdById, creatorUser.id))
        .where(eq(calendarEvent.id, input.eventId))
        .limit(1);

      const ev = rows[0];
      if (!ev) throw new TRPCError({ code: "NOT_FOUND" });

      // For mentors, check access only if event has a placementId
      if (ctx.session.user.role === "mentor" && ev.placementId) {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        const placementRow = await ctx.db.query.placement.findFirst({
          where: eq(placement.id, ev.placementId),
        });
        if (!placementRow || placementRow.mentorId !== mp.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      const files = await ctx.db.query.attachment.findMany({
        where: and(eq(attachment.ownerType, "calendar_event"), eq(attachment.ownerId, ev.id)),
      });

      return {
        id: ev.id,
        title: ev.title,
        description: ev.description ?? null,
        type: ev.type,
        startDate: ev.startDate,
        dueDate: ev.dueDate ?? ev.startDate,
        organizerName: ev.organizerName ?? null,
        organizerLogoUrl: ev.organizerLogoUrl ?? null,
        colorHex: ev.colorHex ?? null,
        placementId: ev.placementId,
        createdBy: ev.createdById
          ? {
            id: ev.createdById,
            name: ev.createdByName ?? null,
            email: ev.createdByEmail ?? null,
          }
          : null,
        attachments: files.map((f) => ({
          id: f.id,
          url: f.url,
          filename: f.filename ?? null,
          mimeType: f.mimeType ?? null,
          sizeBytes: f.sizeBytes ?? null,
        })),
      };
    }),

  create: adminOrMentorProcedure
    .meta(docs.create)
    .use(requirePermissions({ calendarEvent: ["create"], placement: ["read"] }))
    .input(
      z.object({
        title: z.string().min(1),
        type: z.enum(eventType.enumValues),
        date: z.date(),
        endDate: z.date().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        organizerName: z.string().optional(),
        organizerLogoUrl: z.string().url().optional(),
        colorHex: z.string().optional(),
        placementId: z.number().optional(),
        attachments: z
          .array(
            z.object({
              url: z.string().url(),
              filename: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const payload: CalendarEventInsert = {
        title: input.title,
        type: input.type,
        scheduledAt: input.date,
        endDate: input.endDate ?? null,
        description: input.description ?? null,
        location: input.location ?? null,
        organizerName: input.organizerName ?? null,
        organizerLogoUrl: input.organizerLogoUrl ?? null,
        colorHex: input.colorHex ?? null,
        placementId: input.placementId ?? null,
        createdById: ctx.session.user.id,
      };
      const inserted = await ctx.db.insert(calendarEvent).values(payload).returning({ id: calendarEvent.id });
      const eventId = inserted[0]?.id;
      if (!eventId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.attachments?.length) {
        const values = input.attachments.map(
          (a): AttachmentInsert => ({
            ownerType: "calendar_event",
            ownerId: eventId,
            url: a.url,
            filename: a.filename ?? null,
            createdById: ctx.session.user.id,
          }),
        );
        await ctx.db.insert(attachment).values(values);
      }

      return { id: eventId };
    }),

  update: adminOrMentorProcedure
    .meta(docs.update)
    .use(requirePermissions({ calendarEvent: ["update"], placement: ["read"] }))
    .input(
      z.object({
        eventId: z.number(),
        title: z.string().optional(),
        type: z.enum(eventType.enumValues).optional(),
        date: z.date().optional(),
        endDate: z.date().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        organizerName: z.string().optional(),
        organizerLogoUrl: z.string().url().optional(),
        colorHex: z.string().optional(),
        placementId: z.number().optional(),
        attachments: z
          .array(
            z.object({
              url: z.string().url(),
              filename: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.calendarEvent.findFirst({ where: eq(calendarEvent.id, input.eventId) });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db
        .update(calendarEvent)
        .set({
          title: input.title ?? undefined,
          type: input.type ?? undefined,
          scheduledAt: input.date ?? undefined,
          endDate: input.endDate ?? undefined,
          description: input.description ?? undefined,
          location: input.location ?? undefined,
          organizerName: input.organizerName ?? undefined,
          organizerLogoUrl: input.organizerLogoUrl ?? undefined,
          colorHex: input.colorHex ?? undefined,
          placementId: input.placementId ?? undefined,
        })
        .where(eq(calendarEvent.id, input.eventId));

      if (input.attachments) {
        await ctx.db.delete(attachment).where(and(eq(attachment.ownerType, "calendar_event"), eq(attachment.ownerId, input.eventId)));
        if (input.attachments.length) {
          const values = input.attachments.map(
            (a): AttachmentInsert => ({
              ownerType: "calendar_event",
              ownerId: input.eventId,
              url: a.url,
              filename: a.filename ?? null,
              createdById: ctx.session.user.id,
            }),
          );
          await ctx.db.insert(attachment).values(values);
        }
      }

      return { ok: true };
    }),

  delete: adminOrMentorProcedure
    .meta(docs.delete)
    .use(requirePermissions({ calendarEvent: ["delete"] }))
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(attachment).where(and(eq(attachment.ownerType, "calendar_event"), eq(attachment.ownerId, input.eventId)));
      await ctx.db.delete(calendarEvent).where(eq(calendarEvent.id, input.eventId));
      return { ok: true };
    }),
  listForStudent: protectedProcedure
    .meta(docs.listForStudent)
    .input(
      z.object({
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
        type: z.enum(eventType.enumValues).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sp = await requireStudentPlacement(ctx);

      // Get ALL student's placements (not just the first one)
      const placements = await ctx.db.query.placement.findMany({
        where: eq(placement.studentId, sp.id),
      });

      if (placements.length === 0) {
        // Student has no placements, return empty events
        return { items: [] };
      }

      // Extract all placement IDs
      const placementIds = placements.map((p) => p.id);

      const range = monthRange({ month: input.month, year: input.year });
      const startStr = range.start.toISOString().slice(0, 10);
      const endStr = range.end.toISOString().slice(0, 10);

      const startDateExpr = sql`(${calendarEvent.scheduledAt})::date`;
      const dueDateExpr = sql`coalesce(${calendarEvent.endDate}, ${calendarEvent.scheduledAt})::date`;
      const overlapWhere = and(lte(startDateExpr, endStr), gte(dueDateExpr, startStr));

      const rows = await ctx.db
        .select({
          id: calendarEvent.id,
          title: calendarEvent.title,
          description: calendarEvent.description,
          type: calendarEvent.type,
          startDate: calendarEvent.scheduledAt,
          endDate: calendarEvent.endDate,
          location: calendarEvent.location,
          organizerName: calendarEvent.organizerName,
          organizerLogoUrl: calendarEvent.organizerLogoUrl,
          colorHex: calendarEvent.colorHex,
        })
        .from(calendarEvent)
        .where(
          and(
            or(
              inArray(calendarEvent.placementId, placementIds),
              isNull(calendarEvent.placementId),
            ),
            overlapWhere,
            input.type ? eq(calendarEvent.type, input.type) : undefined,
          ),
        )
        .orderBy(calendarEvent.scheduledAt);

      return {
        items: rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description ?? null,
          type: r.type,
          startDate: r.startDate,
          endDate: r.endDate ?? r.startDate,
          location: r.location ?? null,
          organizerName: r.organizerName ?? null,
          organizerLogoUrl: r.organizerLogoUrl ?? null,
          colorHex: r.colorHex ?? null,
        })),
      };
    }),

  listForAdmin: adminOrMentorProcedure
    .meta(docs.listForAdmin)
    .input(
      z.object({
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
        type: z.enum(eventType.enumValues).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Only admins can access this endpoint
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const range = monthRange({ month: input.month, year: input.year });
      const startStr = range.start.toISOString().slice(0, 10);
      const endStr = range.end.toISOString().slice(0, 10);

      const startDateExpr = sql`(${calendarEvent.scheduledAt})::date`;
      const dueDateExpr = sql`coalesce(${calendarEvent.endDate}, ${calendarEvent.scheduledAt})::date`;
      const overlapWhere = and(lte(startDateExpr, endStr), gte(dueDateExpr, startStr));

      // Use LEFT JOIN to include company-wide events (placementId = null)
      const rows = await ctx.db
        .select({
          id: calendarEvent.id,
          title: calendarEvent.title,
          type: calendarEvent.type,
          startDate: calendarEvent.scheduledAt,
          endDate: calendarEvent.endDate,
          organizerName: calendarEvent.organizerName,
          colorHex: calendarEvent.colorHex,
          placementId: placement.id,
          companyId: placement.companyId,
          companyName: company.name,
        })
        .from(calendarEvent)
        .leftJoin(placement, eq(calendarEvent.placementId, placement.id))
        .leftJoin(company, eq(placement.companyId, company.id))
        .where(
          and(
            overlapWhere,
            input.type ? eq(calendarEvent.type, input.type) : undefined,
            input.search
              ? sql`(lower(${calendarEvent.title}) like ${"%" + input.search.toLowerCase() + "%"} or lower(coalesce(${calendarEvent.organizerName}, '')) like ${"%" + input.search.toLowerCase() + "%"})`
              : undefined,
          ),
        )
        .orderBy(calendarEvent.scheduledAt);

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        startDate: r.startDate,
        endDate: r.endDate ?? r.startDate,
        organizerName: r.organizerName ?? null,
        colorHex: r.colorHex ?? null,
        placementId: r.placementId ?? null,
        companyId: r.companyId ?? null,
        companyName: r.companyName ?? null,
      }));
    }),
});
