"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";

const statusConfig: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-700",
  excused: "bg-blue-100 text-blue-700",
  late: "bg-amber-100 text-amber-700",
};

const statusLabel: Record<string, string> = {
  present: "Hadir",
  absent: "Tidak Hadir",
  excused: "Izin",
  late: "Terlambat",
};

export default function AdminKehadiranPage() {
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // TODO: Add company selector UI - hardcoded to company 1 for now
  const companyId = 1;

  const { data, isLoading, isError } = api.attendances.detail.useQuery({
    companyId,
    date: new Date(selectedDate),
    search: search || undefined,
    limit: 200,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const summary = {
    hadir: data?.items.filter((a) => a.status === "present").length ?? 0,
    tidakHadir: data?.items.filter((a) => a.status === "absent").length ?? 0,
    izin: data?.items.filter((a) => a.status === "excused").length ?? 0,

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-destructive">
                Gagal memuat data kehadiran. Silakan coba lagi.
              </div>
            ) : !data?.items.length ? (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada data kehadiran untuk tanggal ini.
              </div>
            ) : (
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

                  </tr>
                </thead>
                <tbody>
                  {data.items.map((attendance, index) => (
                    <tr key={attendance.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{attendance.student.name}</td>
                      <td className="px-4 py-3 text-sm">{attendance.student.school || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[attendance.status] ?? "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {statusLabel[attendance.status] ?? attendance.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{formatTime(attendance.checkInAt)}</td>
                      <td className="px-4 py-3 text-sm font-mono">{formatTime(attendance.checkOutAt)}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-emerald-700">
                        {attendance.counters.hadir}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-red-700">
                        {attendance.counters.tidakHadir}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-blue-700">
                        {attendance.counters.izin}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        {!isLoading && !isError && (
          <div className="text-sm text-muted-foreground text-center">
            Total: {data?.items.length ?? 0} siswa
          </div>
        )}
      </div>
    </main>
  );
}

