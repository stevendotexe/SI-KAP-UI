import { z } from "zod";
import { and, eq } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import { mentorProfile, user } from "@/server/db/schema";

const docs = {
  list: {
    description:
      "## List Mentors\n\nList mentor profiles with optional filters.\n\n### Parameters\n- `active` (boolean, optional)\n- `companyId` (number, optional)\n- `limit` (number, 1-200, default 100)\n- `offset` (number, >=0, default 0)\n\n### Response\nReturns mentor profiles joined with user info.\n\n### Example (React)\n```ts\nconst { data, isLoading } = api.mentors.list.useQuery({ active: true });\n```",
  },
  create: {
    description:
      "## Create Mentor\n\nCreate a mentor account and profile.\n\n### Parameters\n- `email` (string, email)\n- `password` (string, min 8)\n- `name` (string, min 1)\n- `companyId` (number, optional)\n- `phone` (string, optional)\n\n### Response\nVoid; mentor profile is inserted after user creation.\n\n### Example (React)\n```ts\nconst createMentor = api.mentors.create.useMutation();\ncreateMentor.mutate({ email, password, name, companyId });\n```",
  },
  update: {
    description:
      "## Update Mentor\n\nUpdate mentor profile and optionally user fields.\n\n### Parameters\n- `userId` (string)\n- `phone` (string | null, optional)\n- `companyId` (number | null, optional)\n- `active` (boolean, optional)\n- `name` (string, optional)\n- `email` (string, optional)\n\n### Response\nVoid.\n\n### Example (React)\n```ts\nconst updateMentor = api.mentors.update.useMutation();\nupdateMentor.mutate({ userId, phone: '0123', name: 'Mentor A' });\n```",
  },
  delete: {
    description:
      "## Delete Mentor\n\nHard-delete mentor user and cascade the mentor profile.\n\n### Parameters\n- `userId` (string)\n\n### Response\nReturns `{ ok: true }`.\n\n### Example (React)\n```ts\nconst deleteMentor = api.mentors.delete.useMutation();\ndeleteMentor.mutate({ userId });\n```",
  },
};

export const mentorsRouter = createTRPCRouter({
  list: protectedProcedure
    .meta(docs.list)
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
        where: (t) =>
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

  create: protectedProcedure
    .meta(docs.create)
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

  update: protectedProcedure
    .meta(docs.update)
    .use(requirePermissions({ mentorProfile: ["update"] }))
    .input(
      z.object({
        userId: z.string(),
        phone: z.string().nullable().optional(),
        companyId: z.number().nullable().optional(),
        active: z.boolean().optional(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, input.userId),
      });
      if (mp) {
        await ctx.db
          .update(mentorProfile)
          .set({
            phone: input.phone ?? null,
            companyId: input.companyId ?? null,
            active: input.active ?? undefined,
          })
          .where(eq(mentorProfile.id, mp.id));
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

  // keep existing route for backward-compat
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

  delete: protectedProcedure
    .meta(docs.delete)
    .use(requirePermissions({ user: ["delete"] }))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(user).where(eq(user.id, input.userId));
      return { ok: true };
    }),
});
