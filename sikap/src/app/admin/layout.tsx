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

  // Optional: Check if user is actually an admin
  // if (session.user.role !== "admin") {
  //   redirect("/unauthorized");
  // }

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

