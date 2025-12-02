"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import { cn } from "@/lib/utils";

export type AppShellProps = {
  children: React.ReactNode;
  role: "siswa" | "mentor" | "admin";
  userName?: string;
  userRole?: string;
  showHeader?: boolean;
  showFooter?: boolean;
};

export default function AppShell({
  children,
  role,
  userName,
  userRole,
  showHeader = true,
  showFooter = true,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar role={role} userName={userName} userRole={userRole} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 lg:hidden">
            <Sidebar role={role} userName={userName} userRole={userRole} />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="lg:ml-[220px] min-h-screen flex flex-col">
        {/* Header */}
        {showHeader && (
          <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        )}

        {/* Page Content */}
        <main className="flex-1 pt-6">{children}</main>

        {/* Footer */}
        {showFooter && <Footer />}
      </div>
    </div>
  );
}

