import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default async function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Redirect non-mentors to their own dashboard
  if (session.user.role !== "mentor") {
    if (session.user.role === "admin") {
      redirect("/admin/dashboard");
    } else {
      redirect("/siswa/dashboard");
    }
  }

  return (
    <AppShell
      role="mentor"
      userName={session.user.name ?? "Mentor"}
      userRole="Mentor"
    >
      {children}
    </AppShell>
  );
}

