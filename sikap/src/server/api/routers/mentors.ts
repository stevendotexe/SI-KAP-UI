import { z } from "zod";
import { eq } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import { mentorProfile, user } from "@/server/db/schema";

export const mentorsRouter = createTRPCRouter({
  list: protectedProcedure
    .use(requirePermissions({ mentorProfile: ["read"] }))
    .input(
      z.object({
        active: z.boolean().optional(),
        companyId: z.number().optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.mentorProfile.findMany({
        where: (t, { and, eq }) =>
          and(
            input.active === undefined ? undefined : eq(t.active, input.active),
            input.companyId === undefined
              ? undefined
              : eq(t.companyId, input.companyId),
          ),
        with: { user: true },
        limit: input.limit,
        offset: input.offset,
      });
      return rows;
    }),

  createAccount: protectedProcedure
    .use(requirePermissions({ user: ["create"], mentorProfile: ["update"] }))
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
        companyId: z.number().optional(),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await auth.api.createUser({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
          role: "mentor",
        },
        headers: ctx.headers,
      });
      const u = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
      });
      if (!u) return;
      await ctx.db.insert(mentorProfile).values({
        userId: u.id,
        companyId: input.companyId ?? null,
        phone: input.phone ?? null,
      });
    }),

  updateProfile: protectedProcedure
    .use(requirePermissions({ mentorProfile: ["update"] }))
    .input(
      z.object({
        id: z.number(),
        phone: z.string().nullable().optional(),
        companyId: z.number().nullable().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(mentorProfile)
        .set({
          phone: input.phone ?? null,
          companyId: input.companyId ?? null,
          active: input.active ?? undefined,
        })
        .where(eq(mentorProfile.id, input.id));
    }),

  deactivate: protectedProcedure
    .use(requirePermissions({ mentorProfile: ["update"] }))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(mentorProfile)
        .set({ active: false })
        .where(eq(mentorProfile.id, input.id));
    }),
});
