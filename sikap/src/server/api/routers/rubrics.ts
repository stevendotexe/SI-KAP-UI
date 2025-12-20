import { z } from "zod";
import { eq, and, sql, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, adminOrMentorProcedure } from "@/server/api/trpc";
import { competencyTemplate } from "@/server/db/schema";

const docs = {
  list: {
    description:
      "## List Rubrik Penilaian\n\nMenampilkan daftar rubrik penilaian dengan filter opsional.\n\n### Parameters\n- `major` (string, optional) - Filter by major (RPL/TKJ)\n- `category` (personality | technical, optional)\n- `search` (string, optional)\n\n### Response\n`{ items: RubricItem[], lastUpdated: string }`",
  },
  create: {
    description:
      "## Create Rubrik\n\nMembuat rubrik penilaian baru.\n\n### Parameters\n- `name` (string) - Nama rubrik\n- `category` (personality | technical)\n- `major` (string) - RPL atau TKJ\n- `weight` (number, optional) - Bobot rubrik\n\n### Response\n`{ id: number }`",
  },
  update: {
    description:
      "## Update Rubrik\n\nMemperbarui rubrik penilaian.\n\n### Parameters\n- `id` (number)\n- `name` (string, optional)\n- `category` (personality | technical, optional)\n- `major` (string, optional)\n- `weight` (number, optional)\n\n### Response\n`{ ok: true }`",
  },
  delete: {
    description:
      "## Delete Rubrik\n\nMenghapus rubrik penilaian.\n\n### Parameters\n- `id` (number)\n\n### Response\n`{ ok: true }`",
  },
};

export const rubricsRouter = createTRPCRouter({
  list: adminOrMentorProcedure
    .meta(docs.list)
    .input(
      z.object({
        major: z.string().optional(),
        category: z.enum(["personality", "technical"]).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(competencyTemplate)
        .where(
          and(
            input.major ? eq(competencyTemplate.major, input.major) : undefined,
            input.category
              ? eq(competencyTemplate.category, input.category)
              : undefined,
            input.search
              ? sql`lower(${competencyTemplate.name}) like ${
                  "%" + input.search.toLowerCase() + "%"
                }`
              : undefined,
          ),
        )
        .orderBy(asc(competencyTemplate.position), asc(competencyTemplate.id));

      return {
        items: rows.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          major: r.major,
          weight: r.weight ? Number(r.weight) : null,
          position: r.position,
          createdAt: r.createdAt?.toISOString() ?? null,
        })),
        lastUpdated: new Date().toISOString(),
      };
    }),

  create: adminOrMentorProcedure
    .meta(docs.create)
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum(["personality", "technical"]),
        major: z.string().min(1),
        weight: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get max position
      const maxPos = await ctx.db
        .select({
          max: sql<number>`coalesce(max(${competencyTemplate.position}), 0)`,
        })
        .from(competencyTemplate);
      const nextPosition = (maxPos[0]?.max ?? 0) + 1;

      const [created] = await ctx.db
        .insert(competencyTemplate)
        .values({
          name: input.name,
          category: input.category,
          major: input.major,
          weight: input.weight !== undefined ? String(input.weight) : null,
          position: nextPosition,
        })
        .returning({ id: competencyTemplate.id });

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat rubrik",
        });
      }

      return { id: created.id };
    }),

  update: adminOrMentorProcedure
    .meta(docs.update)
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: z.enum(["personality", "technical"]).optional(),
        major: z.string().min(1).optional(),
        weight: z.number().optional(),
        position: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.competencyTemplate.findFirst({
        where: eq(competencyTemplate.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rubrik tidak ditemukan",
        });
      }

      await ctx.db
        .update(competencyTemplate)
        .set({
          name: input.name ?? existing.name,
          category: input.category ?? existing.category,
          major: input.major ?? existing.major,
          weight:
            input.weight !== undefined ? String(input.weight) : existing.weight,
          position: input.position ?? existing.position,
        })
        .where(eq(competencyTemplate.id, input.id));

      return { ok: true };
    }),

  delete: adminOrMentorProcedure
    .meta(docs.delete)
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.competencyTemplate.findFirst({
        where: eq(competencyTemplate.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rubrik tidak ditemukan",
        });
      }

      await ctx.db
        .delete(competencyTemplate)
        .where(eq(competencyTemplate.id, input.id));

      return { ok: true };
    }),
});
