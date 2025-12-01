import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  adminOrMentorProcedure,
  createTRPCRouter,
  requirePermissions,
} from "@/server/api/trpc";
import {
  calendarEvent,
  mentorProfile,
  placement,
  user,
} from "@/server/db/schema";

const docs = {
  list: {
    description:
      "## List Calendar Events (Admin/Mentor)\n\nFilter per bulan untuk menampilkan rentang event (start–due) dalam sebuah company.\n\n### Parameters\n- `companyId` (number)\n- `month` (1-12, optional, default bulan ini)\n- `year` (number, optional, default tahun ini)\n\n### Response\nArray `items` berisi `{ id, title, startDate, dueDate, type, placementId }` untuk ditampilkan di kalender.\n\n### Example (React)\n```ts\nconst { data } = api.calendarEvents.list.useQuery({ companyId: 1, month: 8, year: 2025 });\n```",
  },
  detail: {
    description:
      "## Detail Calendar Event (Admin/Mentor)\n\nMengembalikan semua field event untuk tampilan detail.\n\n### Parameters\n- `eventId` (number)\n\n### Response\n`{ id, title, description, type, startDate, dueDate, placementId, createdBy }`.\n\n### Example (React)\n```ts\nconst { data } = api.calendarEvents.detail.useQuery({ eventId: 10 });\n```",
  },
};

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
        companyId: z.number(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const range = monthRange({ month: input.month, year: input.year });
      const startStr = range.start.toISOString().slice(0, 10);
      const endStr = range.end.toISOString().slice(0, 10);

      let mentorFilterId: number | null = null;
      if (ctx.session.user.role === "mentor") {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp) throw new TRPCError({ code: "FORBIDDEN" });
        mentorFilterId = mp.id;
      }

      const startDateExpr = sql`(${calendarEvent.scheduledAt})::date`;
      const dueDateExpr = sql`coalesce(${calendarEvent.endDate}, ${calendarEvent.scheduledAt})::date`;
      const overlapWhere = and(
        lte(startDateExpr, endStr),
        gte(dueDateExpr, startStr),
      );

      const rows = await ctx.db
        .select({
          id: calendarEvent.id,
          title: calendarEvent.title,
          description: calendarEvent.description,
          type: calendarEvent.type,
          startDate: calendarEvent.scheduledAt,
          dueDate: calendarEvent.endDate,
          placementId: placement.id,
        })
        .from(calendarEvent)
        .innerJoin(placement, eq(calendarEvent.placementId, placement.id))
        .where(
          and(
            eq(placement.companyId, input.companyId),
            mentorFilterId ? eq(placement.mentorId, mentorFilterId) : undefined,
            overlapWhere,
          ),
        )
        .orderBy(calendarEvent.scheduledAt);

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        startDate: r.startDate,
        dueDate: r.dueDate ?? r.startDate,
        placementId: r.placementId,
      }));
    }),

  detail: adminOrMentorProcedure
    .meta(docs.detail)
    .use(
      requirePermissions({
        calendarEvent: ["read"],
        placement: ["read"],
      }),
    )
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
          placementId: placement.id,
          createdById: calendarEvent.createdById,
          createdByName: creatorUser.name,
          createdByEmail: creatorUser.email,
        })
        .from(calendarEvent)
        .innerJoin(placement, eq(calendarEvent.placementId, placement.id))
        .leftJoin(creatorUser, eq(calendarEvent.createdById, creatorUser.id))
        .where(eq(calendarEvent.id, input.eventId))
        .limit(1);

      const ev = rows[0];
      if (!ev) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.session.user.role === "mentor") {
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

      return {
        id: ev.id,
        title: ev.title,
        description: ev.description ?? null,
        type: ev.type,
        startDate: ev.startDate,
        dueDate: ev.dueDate ?? ev.startDate,
        placementId: ev.placementId,
        createdBy: ev.createdById
          ? {
              id: ev.createdById,
              name: ev.createdByName ?? null,
              email: ev.createdByEmail ?? null,
            }
          : null,
      };
    }),
});
