import { z } from "zod";
import { eq } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  requirePermissions,
} from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import { user, userRole } from "@/server/db/schema";
import { generateUserCode } from "@/server/db/utils";

const docs = {
  list: {
    description:
      "## List Users\n\nList all users with flexible search, sort, and filter options.\n\n### Parameters\n- `searchValue` (string, optional)\n- `searchField` (email | name, optional)\n- `searchOperator` (contains | starts_with | ends_with, optional)\n- `limit` (number, 1-200)\n- `offset` (number, >=0)\n- `sortBy` (string, optional)\n- `sortDirection` (asc | desc, optional)\n- `filterField` (string, optional)\n- `filterValue` (string | number | boolean, optional)\n- `filterOperator` (eq | ne | lt | lte | gt | gte, optional)\n\n### Response\nReturns an array of users and pagination info from auth provider.\n\n### Example (React)\n```ts\nconst { data, isLoading } = api.users.list.useQuery({\n  searchField: 'email',\n  searchValue: 'john',\n  limit: 50,\n});\n```",
  },
  create: {
    description:
      "## Create User\n\nCreate a new user (default role: student).\n\n### Parameters\n- `email` (string, email)\n- `password` (string, min 8)\n- `name` (string, min 1)\n- `role` (admin | mentor | student, optional)\n\n### Response\nReturns the created user record from the local database.\n\n### Example (React)\n```ts\nconst createUser = api.users.create.useMutation();\ncreateUser.mutate({ email, password, name, role: 'student' });\n```",
  },
  update: {
    description:
      "## Update User\n\nUpdate basic user fields via admin privileges.\n\n### Parameters\n- `userId` (string)\n- `name` (string, optional)\n- `email` (string, optional)\n- `role` (admin | mentor | student, optional)\n\n### Response\nReturns the updated user record.\n\n### Example (React)\n```ts\nconst updateUser = api.users.update.useMutation();\nupdateUser.mutate({ userId, name: 'New Name', role: 'mentor' });\n```",
  },
  delete: {
    description:
      "## Delete User\n\nHard-delete a user and cascade related records (sessions, profiles).\n\n### Parameters\n- `userId` (string)\n\n### Response\nReturns `{ ok: true }` when deletion succeeds.\n\n### Example (React)\n```ts\nconst deleteUser = api.users.delete.useMutation();\ndeleteUser.mutate({ userId });\n```",
  },
  setRole: {
    description:
      "## Set Role\n\nUpdate a user's role only.\n\n### Parameters\n- `userId` (string)\n- `role` (admin | mentor | student)\n\n### Response\nVoid.\n\n### Example (React)\n```ts\nconst setRole = api.users.setRole.useMutation();\nsetRole.mutate({ userId, role: 'admin' });\n```",
  },
  ban: {
    description:
      "## Ban User\n\nPrevent a user from accessing the system.\n\n### Parameters\n- `userId` (string)\n- `reason` (string, optional)\n- `expiresInSeconds` (number, optional)\n\n### Response\nVoid.\n\n### Example (React)\n```ts\nconst ban = api.users.ban.useMutation();\nban.mutate({ userId, reason: 'Policy violation' });\n```",
  },
  unban: {
    description:
      "## Unban User\n\nRestore access for a previously banned user.\n\n### Parameters\n- `userId` (string)\n\n### Response\nVoid.\n\n### Example (React)\n```ts\nconst unban = api.users.unban.useMutation();\nunban.mutate({ userId });\n```",
  },
};

export const usersRouter = createTRPCRouter({
  list: protectedProcedure
    .meta(docs.list)
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

  create: protectedProcedure
    .meta(docs.create)
    .use(requirePermissions({ user: ["create"] }))
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
        role: z.enum(userRole.enumValues).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const role = input.role ?? "student";
      const code = await generateUserCode(role);

      await auth.api.createUser({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
          role: role,
          code: code,
        } as any,
        headers: ctx.headers,
      });
      const created = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
      });
      return created ?? null;
    }),

  update: protectedProcedure
    .meta(docs.update)
    .use(requirePermissions({ user: ["update"] }))
    .input(
      z.object({
        userId: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.enum(userRole.enumValues).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await auth.api.adminUpdateUser({
        body: {
          userId: input.userId,
          data: {
            name: input.name,
            email: input.email,
            role: input.role as any,
          },
        },
        headers: ctx.headers,
      });
      const updated = await ctx.db.query.user.findFirst({
        where: eq(user.id, input.userId),
      });
      return updated ?? null;
    }),

  delete: protectedProcedure
    .meta(docs.delete)
    .use(requirePermissions({ user: ["delete"] }))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(user).where(eq(user.id, input.userId));
      return { ok: true };
    }),

  setRole: protectedProcedure
    .meta(docs.setRole)
    .use(requirePermissions({ user: ["set-role"] }))
    .input(z.object({ userId: z.string(), role: z.enum(userRole.enumValues) }))
    .mutation(async ({ ctx, input }) => {
      await auth.api.adminUpdateUser({
        body: {
          userId: input.userId,
          data: {
            role: input.role as any,
          },
        },
        headers: ctx.headers,
      });
    }),

  ban: protectedProcedure
    .meta(docs.ban)
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
    .meta(docs.unban)
    .use(requirePermissions({ user: ["unban"] }))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await auth.api.unbanUser({
        body: { userId: input.userId },
        headers: ctx.headers,
      });
    }),
});
