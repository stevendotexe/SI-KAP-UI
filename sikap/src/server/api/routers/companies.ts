import { z } from "zod";
import { eq, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  adminOrMentorProcedure,
} from "@/server/api/trpc";
import { company } from "@/server/db/schema";

const docs = {
  list: {
    description:
      "## List Companies\n\nList companies with filter and pagination.\n\n### Parameters\n- `search` (string, optional)\n- `limit` (number, 1-200, default 100)\n- `offset` (number, >=0, default 0)\n\n### Response\n`{ items: Company[], pagination: { total, limit, offset } }`.",
  },
  detail: {
    description:
      "## Detail Company\n\nGet company details by ID.\n\n### Parameters\n- `id` (number)\n\n### Response\nCompany object.",
  },
  create: {
    description:
      "## Create Company\n\nCreate a new company.\n\n### Parameters\n- `name` (string)\n- `address` (string, optional)\n- `contactEmail` (string, email, optional)\n- `contactPhone` (string, optional)\n- `website` (string, url, optional)\n- `latitude` (string, optional)\n- `longitude` (string, optional)\n\n### Response\nCreated company.",
  },
  update: {
    description:
      "## Update Company\n\nUpdate an existing company.\n\n### Parameters\n- `id` (number)\n- `name` (string, optional)\n- ...others\n\n### Response\nUpdated company.",
  },
  delete: {
    description:
      "## Delete Company\n\nDelete a company by ID.\n\n### Parameters\n- `id` (number)\n\n### Response\n`{ success: true }`.",
  },
};

export const companiesRouter = createTRPCRouter({
  list: adminOrMentorProcedure
    .meta(docs.list)
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.search
        ? sql`(lower(${company.name}) like ${"%" + input.search.toLowerCase() + "%"})`
        : undefined;

      const items = await ctx.db
        .select()
        .from(company)
        .where(where)
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(desc(company.createdAt));

      const countRows = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(company)
        .where(where);

      const total = countRows[0]?.total ?? 0;

      return {
        items,
        pagination: {
          total: Number(total),
          limit: input.limit,
          offset: input.offset,
        },
      };
    }),

  detail: adminOrMentorProcedure
    .meta(docs.detail)
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.query.company.findFirst({
        where: eq(company.id, input.id),
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      return item;
    }),

  create: protectedProcedure
    .meta(docs.create)
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        contactPhone: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create companies",
        });
      }

      const [newItem] = await ctx.db
        .insert(company)
        .values({
          name: input.name,
          address: input.address,
          contactEmail: input.contactEmail ?? null,
          contactPhone: input.contactPhone,
          website: input.website ?? null,
          latitude: input.latitude,
          longitude: input.longitude,
        })
        .returning();

      return newItem;
    }),

  update: protectedProcedure
    .meta(docs.update)
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        contactPhone: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update companies",
        });
      }

      const [updatedItem] = await ctx.db
        .update(company)
        .set({
          name: input.name,
          address: input.address,
          contactEmail: input.contactEmail ?? null,
          contactPhone: input.contactPhone,
          website: input.website ?? null,
          latitude: input.latitude,
          longitude: input.longitude,
          updatedAt: new Date(),
        })
        .where(eq(company.id, input.id))
        .returning();

      if (!updatedItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      return updatedItem;
    }),

  delete: protectedProcedure
    .meta(docs.delete)
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete companies",
        });
      }

      const [deletedItem] = await ctx.db
        .delete(company)
        .where(eq(company.id, input.id))
        .returning();

      if (!deletedItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      return { success: true };
    }),
});
