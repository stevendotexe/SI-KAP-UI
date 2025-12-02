"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dummy data
const reports = [
  { id: 1, studentId: 1, student: "Ahmad Fauzi", title: "Laporan Minggu 1", type: "Mingguan", date: "2024-11-25", status: "Disetujui", mentor: "Budi Santoso", score: 85 },
  { id: 2, studentId: 2, student: "Siti Aisyah", title: "Laporan Minggu 2", type: "Mingguan", date: "2024-11-24", status: "Menunggu", mentor: "Dewi Lestari", score: null },
  { id: 3, studentId: 3, student: "Rudi Hermawan", title: "Laporan Minggu 1", type: "Mingguan", date: "2024-11-23", status: "Belum Diserahkan", mentor: "Budi Santoso", score: null },
  { id: 4, studentId: 4, student: "Maya Putri", title: "Laporan Akhir", type: "Akhir", date: "2024-11-22", status: "Disetujui", mentor: "Andi Wijaya", score: 92 },
  { id: 5, studentId: 5, student: "Dian Prasetyo", title: "Laporan Minggu 3", type: "Mingguan", date: "2024-11-21", status: "Menunggu", mentor: "Dewi Lestari", score: null },
];

const statusConfig = {
  Disetujui: { icon: <CheckCircle className="w-4 h-4" />, class: "bg-emerald-100 text-emerald-700" },
  Menunggu: { icon: <Clock className="w-4 h-4" />, class: "bg-amber-100 text-amber-700" },
  "Belum Diserahkan": { icon: <XCircle className="w-4 h-4" />, class: "bg-gray-100 text-gray-700" },
};

export default function AdminLaporanPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.student.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Laporan Siswa</h1>
            <p className="text-muted-foreground mt-1">Kelola semua laporan siswa PKL/Prakerin</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Ekspor Data
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{reports.filter((r) => r.status === "Disetujui").length}</div>
                <div className="text-sm text-muted-foreground">Disetujui</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{reports.filter((r) => r.status === "Menunggu").length}</div>
                <div className="text-sm text-muted-foreground">Menunggu Review</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{reports.filter((r) => r.status === "Belum Diserahkan").length}</div>
                <div className="text-sm text-muted-foreground">Belum Diserahkan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa atau judul laporan..."
              className="pl-10 rounded-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {statusFilter ?? "Semua Status"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>Semua Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Disetujui")}>Disetujui</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Menunggu")}>Menunggu</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Belum Diserahkan")}>Belum Diserahkan</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Siswa</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Judul</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Tipe</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Tanggal</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Mentor</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Skor</th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((report) => {
                  const status = statusConfig[report.status as keyof typeof statusConfig];
                  return (
                    <tr key={report.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{report.student}</td>
                      <td className="px-4 py-3 text-sm">{report.title}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted">
                          {report.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{report.date}</td>
                      <td className="px-4 py-3 text-sm">{report.mentor}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                          {status.icon}
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {report.score !== null ? report.score : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/siswa/${report.studentId}/laporan/${report.id}`}>
                          <Button
                            size="sm"
                            className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors"
                          >
                            Detail
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

