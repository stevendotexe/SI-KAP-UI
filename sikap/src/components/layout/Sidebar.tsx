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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export type SidebarProps = {
  role: "siswa" | "mentor" | "admin";
  userName?: string;
  userRole?: string;
};

// Navigation items per role
const navItems: Record<SidebarProps["role"], NavItem[]> = {
  siswa: [
    { label: "Dashboard", href: "/siswa/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Daftar Tugas", href: "/siswa/tugas", icon: <ClipboardList size={20} /> },
    { label: "Laporan", href: "/siswa/laporan", icon: <FileText size={20} /> },
    { label: "Kalender", href: "/siswa/kalender", icon: <Calendar size={20} /> },
    { label: "Log Absensi", href: "/siswa/log-absensi", icon: <Clock size={20} /> },
    { label: "Biodata", href: "/siswa/biodata", icon: <User size={20} /> },
    { label: "Rapor Akhir", href: "/siswa/rapor-akhir", icon: <Award size={20} /> },
  ],
  mentor: [
    { label: "Dashboard", href: "/mentor/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Siswa", href: "/mentor/siswa", icon: <Users size={20} /> },
    { label: "Tugas", href: "/mentor/tugas", icon: <ClipboardList size={20} /> },
    { label: "Laporan", href: "/mentor/laporan", icon: <FileText size={20} /> },
    { label: "Kehadiran", href: "/mentor/kehadiran", icon: <CheckSquare size={20} /> },
    { label: "Kalender", href: "/mentor/kalender", icon: <Calendar size={20} /> },
    { label: "Rapor Akhir", href: "/mentor/rapor-akhir", icon: <Award size={20} /> },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Siswa", href: "/admin/siswa", icon: <Users size={20} /> },
    { label: "Mentor", href: "/admin/mentor", icon: <UserCheck size={20} /> },
    { label: "Laporan", href: "/admin/laporan", icon: <FileText size={20} /> },
    { label: "Kehadiran", href: "/admin/kehadiran", icon: <CheckSquare size={20} /> },
    { label: "Kalender", href: "/admin/kalender", icon: <Calendar size={20} /> },
  ],
};

const roleBadgeLabels: Record<SidebarProps["role"], string> = {
  siswa: "Student Panel",
  mentor: "Mentor Panel",
  admin: "Admin Panel",
};

export default function Sidebar({ role, userName = "Person Name", userRole }: SidebarProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const items = navItems[role];
  const displayRole = userRole ?? (role.charAt(0).toUpperCase() + role.slice(1));

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-white border-r border-gray-100 flex flex-col shadow-sm">
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
        <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-600 text-sm font-medium">
          <Settings size={14} />
          <span>{roleBadgeLabels[role]}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          {/* Name & Role */}
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{userName}</div>
            <div className="text-xs text-gray-500">{displayRole}</div>
          </div>
          {/* Dropdown Arrow */}
          <ChevronDown
            size={16}
            className={cn(
              "text-gray-400 transition-transform duration-200",
              userMenuOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div className="mt-1 py-1 bg-white rounded-lg border border-gray-100 shadow-lg">
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
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
