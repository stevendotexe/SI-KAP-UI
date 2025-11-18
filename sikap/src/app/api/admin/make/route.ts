import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ ok: true });
}