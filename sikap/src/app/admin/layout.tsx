import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Redirect non-admins to their own dashboard
  if (session.user.role !== "admin") {
    if (session.user.role === "mentor") {
      redirect("/mentor/dashboard");
    } else {
      redirect("/siswa/dashboard");
    }
  }

  return (
    <AppShell
      role="admin"
      userName={session.user.name ?? "Admin"}
      userRole="Admin"
    >
      {children}
    </AppShell>
  );
}

