"use client";

import Sidebar, { type SidebarProps } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

type AppLayoutProps = {
  children: React.ReactNode;
  role: SidebarProps["role"];
  userName?: string;
  userId?: string;
};

export default function AppLayout({ children, role, userName, userId }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse state (optional enhancement)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar role={role} userName={userName} userId={userId} />
      
      {/* Main content - offset by sidebar width */}
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarCollapsed ? "ml-[72px]" : "ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
}

