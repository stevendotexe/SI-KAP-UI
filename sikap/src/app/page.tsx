import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0d4a2d] to-[#0a1a1a] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Welcome to SI-KAP
        </h1>

        <div className="flex flex-col items-center gap-4">
          <a
            href="/sign-in"
            className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          >
            Sign in
          </a>
        </div>
      </div>
    </main>
  );
}
