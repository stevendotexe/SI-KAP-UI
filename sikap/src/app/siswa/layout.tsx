import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default async function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }


  // Check if user is actually a student
  if (session.user.role !== "student") {
    redirect("/unauthorized");
  }


  return (
    <AppShell
      role="siswa"
      userName={session.user.name ?? "Siswa"}
      userRole="Siswa"
    >
      {children}
    </AppShell>
  );
}

