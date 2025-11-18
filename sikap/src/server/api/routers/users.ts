import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import { userRole } from "@/server/db/schema";

export const usersRouter = createTRPCRouter({
  list: protectedProcedure
    .use(requirePermissions({ user: ["list"] }))
    .input(
      z.object({
        searchValue: z.string().optional(),
        searchField: z.enum(["email", "name"]).optional(),
        searchOperator: z
          .enum(["contains", "starts_with", "ends_with"])
          .optional(),
        limit: z.number().min(1).max(200).optional(),
        offset: z.number().min(0).optional(),
        sortBy: z.string().optional(),
        sortDirection: z.enum(["asc", "desc"]).optional(),
        filterField: z.string().optional(),
        filterValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
        filterOperator: z
          .enum(["eq", "ne", "lt", "lte", "gt", "gte"])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await auth.api.listUsers({
        query: input,
        headers: ctx.headers,
      });
      return users;
    }),

  setRole: protectedProcedure
    .use(requirePermissions({ user: ["set-role"] }))
    .input(z.object({ userId: z.string(), role: z.enum(userRole.enumValues) }))
    .mutation(async ({ ctx, input }) => {
      await auth.api.adminUpdateUser({
        body: {
          userId: input.userId,
          data: {
            role: input.role,
          },
        },
        headers: ctx.headers,
      });
    }),

  ban: protectedProcedure
    .use(requirePermissions({ user: ["ban"] }))
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().optional(),
        expiresInSeconds: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await auth.api.banUser({
        body: {
          userId: input.userId,
          banReason: input.reason,
          banExpiresIn: input.expiresInSeconds,
        },
        headers: ctx.headers,
      });
    }),

  unban: protectedProcedure
    .use(requirePermissions({ user: ["unban"] }))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await auth.api.unbanUser({
        body: { userId: input.userId },
        headers: ctx.headers,
      });
    }),
});
