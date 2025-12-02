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

  // Optional: Check if user is actually a mentor
  // if (session.user.role !== "mentor") {
  //   redirect("/unauthorized");
  // }

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

