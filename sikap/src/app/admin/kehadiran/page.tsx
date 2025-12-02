"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

// Dummy data
const attendanceData = [
  {
    id: 1,
    name: "Ahmad Fauzi",
    school: "SMK Negeri 1",
    status: "Hadir",
    checkIn: "07:45",
    checkOut: "16:00",
    counters: { hadir: 45, tidakHadir: 2, izin: 1, terlambat: 3 }
  },
  {
    id: 2,
    name: "Siti Aisyah",
    school: "SMK Negeri 2",
    status: "Hadir",
    checkIn: "07:30",
    checkOut: "16:15",
    counters: { hadir: 48, tidakHadir: 1, izin: 0, terlambat: 2 }
  },
  {
    id: 3,
    name: "Rudi Hermawan",
    school: "SMK Negeri 1",
    status: "Izin",
    checkIn: "-",
    checkOut: "-",
    counters: { hadir: 42, tidakHadir: 3, izin: 4, terlambat: 2 }
  },
  {
    id: 4,
    name: "Maya Putri",
    school: "SMK Negeri 3",
    status: "Hadir",
    checkIn: "08:00",
    checkOut: "16:00",
    counters: { hadir: 50, tidakHadir: 0, izin: 1, terlambat: 0 }
  },
  {
    id: 5,
    name: "Dian Prasetyo",
    school: "SMK Negeri 2",
    status: "Tidak Hadir",
    checkIn: "-",
    checkOut: "-",
    counters: { hadir: 38, tidakHadir: 8, izin: 2, terlambat: 3 }
  },
  {
    id: 6,
    name: "Eko Prasetyo",
    school: "SMK Negeri 1",
    status: "Hadir",
    checkIn: "07:55",
    checkOut: "16:10",
    counters: { hadir: 47, tidakHadir: 1, izin: 1, terlambat: 2 }
  },
  {
    id: 7,
    name: "Fitri Handayani",
    school: "SMK Negeri 3",
    status: "Terlambat",
    checkIn: "08:30",
    checkOut: "16:00",
    counters: { hadir: 40, tidakHadir: 2, izin: 3, terlambat: 6 }
  },
];

const statusConfig: Record<string, string> = {
  Hadir: "bg-emerald-100 text-emerald-700",
  "Tidak Hadir": "bg-red-100 text-red-700",
  Izin: "bg-blue-100 text-blue-700",
  Terlambat: "bg-amber-100 text-amber-700",
};

export default function AdminKehadiranPage() {
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const filtered = attendanceData.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.school.toLowerCase().includes(search.toLowerCase())
  );

  const summary = {
    hadir: attendanceData.filter((a) => a.status === "Hadir").length,
    tidakHadir: attendanceData.filter((a) => a.status === "Tidak Hadir").length,
    izin: attendanceData.filter((a) => a.status === "Izin").length,
    terlambat: attendanceData.filter((a) => a.status === "Terlambat").length,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Kehadiran Siswa</h1>
            <p className="text-muted-foreground mt-1">Rekap kehadiran harian siswa PKL/Prakerin</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Ekspor Data
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().slice(0, 10));
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().slice(0, 10));
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm text-center">
            <div className="text-3xl font-semibold text-emerald-600">{summary.hadir}</div>
            <div className="text-sm text-muted-foreground mt-1">Hadir</div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm text-center">
            <div className="text-3xl font-semibold text-red-600">{summary.tidakHadir}</div>
            <div className="text-sm text-muted-foreground mt-1">Tidak Hadir</div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm text-center">
            <div className="text-3xl font-semibold text-blue-600">{summary.izin}</div>
            <div className="text-sm text-muted-foreground mt-1">Izin</div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm text-center">
            <div className="text-3xl font-semibold text-amber-600">{summary.terlambat}</div>
            <div className="text-sm text-muted-foreground mt-1">Terlambat</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa atau sekolah..."
            className="pl-10 rounded-full"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">No</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Nama Siswa</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Sekolah</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Status Hari Ini</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Jam Masuk</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Jam Keluar</th>
                  <th className="text-center text-sm font-medium text-emerald-700 px-4 py-3 bg-emerald-50">H</th>
                  <th className="text-center text-sm font-medium text-red-700 px-4 py-3 bg-red-50">TH</th>
                  <th className="text-center text-sm font-medium text-blue-700 px-4 py-3 bg-blue-50">I</th>
                  <th className="text-center text-sm font-medium text-amber-700 px-4 py-3 bg-amber-50">T</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((attendance, index) => (
                  <tr key={attendance.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{attendance.name}</td>
                    <td className="px-4 py-3 text-sm">{attendance.school}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[attendance.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {attendance.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{attendance.checkIn}</td>
                    <td className="px-4 py-3 text-sm font-mono">{attendance.checkOut}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-emerald-700">{attendance.counters.hadir}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-red-700">{attendance.counters.tidakHadir}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-blue-700">{attendance.counters.izin}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-amber-700">{attendance.counters.terlambat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-muted-foreground text-center">
          Total: {attendanceData.length} siswa
        </div>
      </div>
    </main>
  );
}

