"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Calendar,
  User,
  Clock,
  Award,
  Users,
  UserCheck,
  CheckSquare,
  LogOut,
  ChevronDown,
  Settings,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/better-auth/client";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export type SidebarProps = {
  role: "siswa" | "mentor" | "admin";
  userName?: string;
  userRole?: string;
  userId?: string;
};

// Navigation items per role
const navItems: Record<SidebarProps["role"], NavItem[]> = {
  siswa: [
    {
      label: "Dashboard",
      href: "/siswa/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: "Daftar Tugas",
      href: "/siswa/tugas",
      icon: <ClipboardList size={20} />,
    },
    { label: "Laporan", href: "/siswa/laporan", icon: <FileText size={20} /> },
    {
      label: "Kalender",
      href: "/siswa/kalender",
      icon: <Calendar size={20} />,
    },
    {
      label: "Log Absensi",
      href: "/siswa/log-absensi",
      icon: <Clock size={20} />,
    },
    { label: "Biodata", href: "/siswa/biodata", icon: <User size={20} /> },
    {
      label: "Aktivitas",
      href: "/siswa/aktivitas",
      icon: <Sparkles size={20} />,
    },
    {
      label: "Rapor Akhir",
      href: "/siswa/rapor-akhir",
      icon: <Award size={20} />,
    },
  ],
  mentor: [
    {
      label: "Dashboard",
      href: "/mentor/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { label: "Siswa", href: "/mentor/siswa", icon: <Users size={20} /> },
    {
      label: "Rubrik",
      href: "/mentor/rubrik",
      icon: <ClipboardList size={20} />,
    },
    { label: "Tugas", href: "/mentor/tugas", icon: <CheckSquare size={20} /> },
    { label: "Laporan", href: "/mentor/laporan", icon: <FileText size={20} /> },
    {
      label: "Kehadiran",
      href: "/mentor/kehadiran",
      icon: <UserCheck size={20} />,
    },
    {
      label: "Kalender",
      href: "/mentor/kalender",
      icon: <Calendar size={20} />,
    },
    {
      label: "Aktivitas",
      href: "/mentor/aktivitas",
      icon: <Sparkles size={20} />,
    },
    {
      label: "Rapor Akhir",
      href: "/mentor/rapor-akhir",
      icon: <Award size={20} />,
    },
  ],
  admin: [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { label: "Siswa", href: "/admin/siswa", icon: <Users size={20} /> },
    { label: "Mentor", href: "/admin/mentor", icon: <UserCheck size={20} /> },
    { label: "Laporan", href: "/admin/laporan", icon: <FileText size={20} /> },
    {
      label: "Kehadiran",
      href: "/admin/kehadiran",
      icon: <CheckSquare size={20} />,
    },
    {
      label: "Kalender",
      href: "/admin/kalender",
      icon: <Calendar size={20} />,
    },
    {
      label: "Aktivitas",
      href: "/admin/aktivitas",
      icon: <Sparkles size={20} />,
    },
    {
      label: "Rapor Akhir",
      href: "/admin/rapor-akhir",
      icon: <Award size={20} />,
    },
  ],
};

const roleBadgeLabels: Record<SidebarProps["role"], string> = {
  siswa: "Student Panel",
  mentor: "Mentor Panel",
  admin: "Admin Panel",
};

export default function Sidebar({
  role,
  userName = "Person Name",
  userRole,
}: SidebarProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const items = navItems[role];
  const displayRole = userRole ?? role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <aside className="fixed top-0 left-0 z-40 flex h-screen w-[220px] flex-col border-r border-gray-100 bg-white shadow-sm">
      {/* Logo */}
      <div className="px-5 pt-5 pb-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.svg"
            alt="SI-KAP Logo"
            width={50}
            height={50}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Role Badge - Full Width */}
      <div className="px-3 pb-4">
        <div className="flex w-full items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600">
          <Settings size={14} />
          <span>{roleBadgeLabels[role]}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
        >
          {/* Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-500">
            {userName.charAt(0).toUpperCase()}
          </div>
          {/* Name & Role */}
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-medium text-gray-900">
              {userName}
            </div>
            <div className="text-xs text-gray-500">{displayRole}</div>
          </div>
          {/* Dropdown Arrow */}
          <ChevronDown
            size={16}
            className={cn(
              "text-gray-400 transition-transform duration-200",
              userMenuOpen && "rotate-180",
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div className="mt-1 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <User size={16} />
              <span>Profil Saya</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Settings size={16} />
              <span>Pengaturan</span>
            </Link>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/sign-in";
                    },
                  },
                });
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
