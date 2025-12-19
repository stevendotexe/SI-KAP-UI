import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  requirePermissions,
  adminOrMentorProcedure,
  mentorProcedure,
} from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import {
  mentorProfile,
  placement,
  studentProfile,
  user,
} from "@/server/db/schema";
import { generateUserCode } from "@/server/db/utils";

const docs = {
  me: {
    description:
      "## Get Current Mentor Profile\n\nMengembalikan profil mentor yang sedang login beserta companyId.\n\n### Parameters\nTidak ada.\n\n### Response\n`{ id: number, userId: string, name: string, email: string, active: boolean, companyId: number | null }`.\n\n### Example (React)\n```ts\nconst { data } = api.mentors.me.useQuery();\nconst companyId = data?.companyId;\n```",
  },
  list: {
    description:
      "## List Mentor\n\nList mentor dalam company dengan filter dan paginasi. Untuk admin, companyId bersifat optional dan akan menampilkan semua mentor jika tidak diberikan. Untuk mentor, companyId akan otomatis diambil dari profil mentor.\n\n### Parameters\n- `companyId` (number, optional) - Optional untuk admin, akan menampilkan semua mentor jika tidak diberikan\n- `active` (boolean, optional)\n- `search` (string, optional)\n- `limit` (number, 1-200, default 100)\n- `offset` (number, >=0, default 0)\n\n### Response\n`{ items: MentorRow[], pagination: { total, limit, offset }, lastUpdated: string }` dengan `MentorRow = { id: number, mentorId: string, name: string, email: string, active: boolean, studentCount: number }`.\n\n### Example (React)\n```ts\n// Admin: get all mentors\nconst { data } = api.mentors.list.useQuery({ search: 'ahsan' });\n// Or filter by company\nconst { data } = api.mentors.list.useQuery({ companyId: 1, search: 'ahsan' });\n```",
  },
  detail: {
    description:
      "## Detail Mentor\n\nDetail lengkap mentor termasuk relasi siswa yang diajar.\n\n### Parameters\n- `userId` (string)\n\n### Response\n`{ profile, students, stats, lastUpdated }`, di mana `profile` mencakup data user dan mentor, `students` adalah daftar siswa di bawah mentor, `stats` berisi ringkasan seperti jumlah siswa dan tanggal penempatan awal/akhir.\n\n### Example (React)\n```ts\nconst { data } = api.mentors.detail.useQuery({ userId });\n```",
  },
  create: {
    description:
      "## Create Mentor\n\nMembuat akun mentor dan profil.\n\n### Parameters\n- `email` (string, email)\n- `password` (string, min 8)\n- `name` (string, min 1)\n- `companyId` (number, optional)\n- `phone` (string, optional)\n\n### Response\nMengembalikan data mentor yang dibuat.\n\n### Example (React)\n```ts\nconst m = api.mentors.create.useMutation();\nm.mutate({ email, password, name, companyId });\n```",
  },
  update: {
    description:
      "## Update Mentor\n\nMemperbarui profil mentor dan data user.\n\n### Parameters\n- `userId` (string)\n- `companyId` (number | null, optional)\n- `phone` (string | null, optional)\n- `active` (boolean, optional)\n- `name` (string, optional)\n- `email` (string, optional)\n- `currentUpdatedAt` (Date, optional)\n\n### Response\nMengembalikan data mentor yang sudah diperbarui.\n\n### Example (React)\n```ts\nconst m = api.mentors.update.useMutation();\nm.mutate({ userId, name: 'Ahsan', active: true });\n```",
  },
  delete: {
    description:
      "## Delete Mentor\n\nSoft delete mentor (menonaktifkan profil).\n\n### Parameters\n- `userId` (string)\n\n### Response\n`{ ok: true }`.\n\n### Example (React)\n```ts\nconst m = api.mentors.delete.useMutation();\nm.mutate({ userId });\n```",
  },
};

export const mentorsRouter = createTRPCRouter({
  me: mentorProcedure.meta(docs.me).query(async ({ ctx }) => {
    const mp = await ctx.db.query.mentorProfile.findFirst({
      where: eq(mentorProfile.userId, ctx.session.user.id),
      with: { user: true },
    });
    if (!mp)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Mentor profile not found",
      });
    return {
      id: mp.id,
      userId: mp.userId,
      name: mp.user?.name ?? "",
      email: mp.user?.email ?? "",
      active: mp.active,
      companyId: mp.companyId ?? null,
    };
  }),

  list: adminOrMentorProcedure
    .meta(docs.list)
    .use(requirePermissions({ mentorProfile: ["read"], placement: ["read"] }))
    .input(
      z.object({
        companyId: z.number().optional(),
        active: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      // For mentors, get their companyId if not provided
      let companyId = input.companyId;
      if (ctx.session.user.role === "mentor" && !companyId) {
        const mp = await ctx.db.query.mentorProfile.findFirst({
          where: eq(mentorProfile.userId, ctx.session.user.id),
        });
        if (!mp?.companyId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Mentor must have a companyId",
          });
        }
        companyId = mp.companyId;
      }

      const rows = await ctx.db
        .select({
          id: mentorProfile.id,
          mentorId: user.id,
          name: user.name,
          email: user.email,
          active: mentorProfile.active,
          studentCount: sql<number>`count(distinct ${placement.studentId})`,
        })
        .from(mentorProfile)
        .innerJoin(user, eq(mentorProfile.userId, user.id))
        .leftJoin(placement, eq(placement.mentorId, mentorProfile.id))
        .where(
          and(
            companyId !== undefined
              ? eq(mentorProfile.companyId, companyId)
              : undefined,
            input.active === undefined
              ? undefined
              : eq(mentorProfile.active, input.active),
            input.search
              ? sql`(lower(${user.name}) like ${"%" + input.search.toLowerCase() + "%"} or ${user.id} = ${input.search})`
              : undefined,
          ),
        )
        .groupBy(
          mentorProfile.id,
          user.id,
          user.name,
          user.email,
          mentorProfile.active,
        )
        .limit(input.limit)
        .offset(input.offset);

      const countRows = await ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(mentorProfile)
        .innerJoin(user, eq(mentorProfile.userId, user.id))
        .where(
          and(
            companyId !== undefined
              ? eq(mentorProfile.companyId, companyId)
              : undefined,
            input.active === undefined
              ? undefined
              : eq(mentorProfile.active, input.active),
            input.search
              ? sql`(lower(${user.name}) like ${"%" + input.search.toLowerCase() + "%"} or ${user.id} = ${input.search})`
              : undefined,
          ),
        );
      const total = countRows[0]?.total ?? 0;

      return {
        items: rows.map((r) => ({
          id: r.id,
          mentorId: r.mentorId,
          name: r.name ?? "",
          email: r.email ?? "",
          active: Boolean(r.active),
          studentCount: Number(r.studentCount ?? 0),
        })),
        pagination: {
          total: Number(total),
          limit: input.limit,
          offset: input.offset,
        },
        lastUpdated: new Date().toISOString(),
      };
    }),

  detail: adminOrMentorProcedure
    .meta(docs.detail)
    .use(
      requirePermissions({
        mentorProfile: ["read"],
        placement: ["read"],
        studentProfile: ["read"],
      }),
    )
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, input.userId),
        with: { user: true },
      });
      if (!mp) throw new TRPCError({ code: "NOT_FOUND" });
      const students = await ctx.db
        .select({
          id: studentProfile.id,
          studentId: user.id,
          name: user.name,
          email: user.email,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(eq(placement.mentorId, mp.id))
        .groupBy(studentProfile.id, user.id, user.name, user.email);
      const countRows = await ctx.db
        .select({ count: sql<number>`count(distinct ${placement.studentId})` })
        .from(placement)
        .where(eq(placement.mentorId, mp.id));
      const studentCount = countRows[0]?.count ?? 0;
      const [range] = await ctx.db
        .select({
          start: sql<string>`min(${placement.startDate}::timestamp)::date`,
          end: sql<string>`max(${placement.endDate}::timestamp)::date`,
        })
        .from(placement)
        .where(eq(placement.mentorId, mp.id));
      return {
        profile: {
          id: mp.id,
          userId: mp.userId,
          name: mp.user?.name ?? "",
          email: mp.user?.email ?? "",
          active: mp.active,
          companyId: mp.companyId ?? null,
        },
        students,
        stats: {
          studentCount: Number(studentCount ?? 0),
          startDate: range?.start ?? null,
          endDate: range?.end ?? null,
        },
        lastUpdated: new Date().toISOString(),
      };
    }),

  create: adminOrMentorProcedure
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
      const existing = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
      });
      if (existing) throw new TRPCError({ code: "CONFLICT" });

      const code = await generateUserCode("mentor");

      await auth.api.createUser({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
          role: "mentor",
          code: code,
        },
        headers: ctx.headers,
      });
      const u = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
      });
      if (!u) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const inserted = await ctx.db
        .insert(mentorProfile)
        .values({
          userId: u.id,
          companyId: input.companyId ?? null,
          phone: input.phone ?? null,
        })
        .returning({ id: mentorProfile.id });
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.id, inserted[0]?.id ?? -1),
        with: { user: true },
      });
      return mp ?? null;
    }),

  update: adminOrMentorProcedure
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
        currentUpdatedAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, input.userId),
      });
      if (!mp) throw new TRPCError({ code: "NOT_FOUND" });
      const updatedRows = await ctx.db
        .update(mentorProfile)
        .set({
          phone: input.phone ?? null,
          companyId: input.companyId ?? null,
          active: input.active ?? undefined,
        })
        .where(
          and(
            eq(mentorProfile.id, mp.id),
            input.currentUpdatedAt
              ? eq(mentorProfile.updatedAt, input.currentUpdatedAt)
              : undefined,
          ),
        )
        .returning({ id: mentorProfile.id });
      if (input.currentUpdatedAt && updatedRows.length === 0) {
        throw new TRPCError({ code: "CONFLICT" });
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
      const refreshed = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.id, mp.id),
        with: { user: true },
      });
      return refreshed ?? null;
    }),

  delete: adminOrMentorProcedure
    .meta(docs.delete)
    .use(requirePermissions({ mentorProfile: ["update"] }))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const mp = await ctx.db.query.mentorProfile.findFirst({
        where: eq(mentorProfile.userId, input.userId),
      });
      if (!mp) return { ok: false };
      await ctx.db
        .update(mentorProfile)
        .set({ active: false })
        .where(eq(mentorProfile.id, mp.id));
      return { ok: true };
    }),
});
