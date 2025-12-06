import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

export const examplesRouter = createTRPCRouter({
  hello: publicProcedure
    .input(
      z
        .object({ name: z.string().min(1).optional() })
        .optional(),
    )
    .query(({ input }) => {
      const n = input?.name?.trim() || "Pengguna";
      return { message: `Halo, ${n}!`, serverTime: new Date().toISOString() };
    }),

  echo: protectedProcedure
    .input(z.object({ message: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      const by = ctx.session.user.name ?? String(ctx.session.user.id);
      return {
        ok: true,
        from: by,
        echo: input.message.toUpperCase(),
        length: input.message.length,
      };
    }),
});

