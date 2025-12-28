"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, CheckCircle, XCircle, Clock, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";

const statusConfig = {
  approved: { icon: <CheckCircle className="w-4 h-4" />, class: "bg-emerald-100 text-emerald-700", label: "Disetujui" },
  pending: { icon: <Clock className="w-4 h-4" />, class: "bg-amber-100 text-amber-700", label: "Menunggu" },
  rejected: { icon: <XCircle className="w-4 h-4" />, class: "bg-red-100 text-red-700", label: "Ditolak" },
};

export default function AdminLaporanPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"approved" | "pending" | "rejected" | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Debounce search to prevent API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch companies
  const { data: companiesData, isLoading: isLoadingCompanies } = api.companies.list.useQuery({
    limit: 100,
  });

  // Auto-select first company if none selected
  const companies = companiesData?.items ?? [];
  const companyId = selectedCompanyId ?? companies[0]?.id ?? null;

  // Memoize date range to prevent infinite re-renders
  const dateRange = useMemo(() => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: firstOfMonth, to: now };
  }, []); // Computed once on mount

  // Memoize query input to prevent reference changes
  const queryInput = useMemo(() => ({
    companyId: companyId!,
    search: debouncedSearch || undefined,
    status: statusFilter ?? undefined,
    from: dateRange.from,
    to: dateRange.to,
    limit: 200,
  }), [companyId, debouncedSearch, statusFilter, dateRange]);

  // Fetch reports for selected company (now focused on daily journals)
  const { data: reportsData, isLoading: isLoadingReports, isError } = api.reports.list.useQuery(
    queryInput,
    {
      enabled: companyId !== null,
    }
  );

  const reports = useMemo(() => reportsData?.items ?? [], [reportsData]);

  // Filter to show only daily reports (journals)
  const filtered = useMemo(() => {
    const result = reports.filter((r) => {
      const matchSearch =
        !search ||
        r.student.name.toLowerCase().includes(search.toLowerCase()) ||
        r.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || r.reviewStatus === statusFilter;
      const isDaily = r.type === "daily"; // Only show daily journals
      return matchSearch && matchStatus && isDaily;
    });

    // Apply sorting
    result.sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return sortOrder === "newest"
        ? dateB - dateA
        : dateA - dateB;
    });

    return result;
  }, [reports, search, statusFilter, sortOrder]);

  // Calculate stats from filtered reports
  const stats = useMemo(() => {
    const approved = filtered.filter((r) => r.reviewStatus === "approved").length;
    const pending = filtered.filter((r) => r.reviewStatus === "pending").length;
    const rejected = filtered.filter((r) => r.reviewStatus === "rejected").length;
    return { approved, pending, rejected };
  }, [filtered]);

  const isLoading = isLoadingCompanies || isLoadingReports;

  // Format duration from minutes
  function formatDuration(minutes: number | null): string {
    if (!minutes) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}j`;
    return `${h}j ${m}m`;
  }

  // Export to CSV
  function handleExport() {
    if (filtered.length === 0) return;

    const headers = ["Siswa", "Tanggal", "Durasi", "Deskripsi", "Status", "Mentor"];
    const rows = filtered.map((r) => [
      r.student.name,
      r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("id-ID") : "-",
      r.summary?.includes("menit") ? r.summary.split(" ")[0] : "-",
      r.title || r.summary?.slice(0, 50) || "-",
      r.reviewStatus === "approved" ? "Disetujui" : r.reviewStatus === "pending" ? "Menunggu" : "Ditolak",
      r.mentor?.name || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-pkl-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Laporan Harian Siswa</h1>
            <p className="text-muted-foreground mt-1">Lihat semua laporan harian siswa PKL</p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Ekspor CSV
          </Button>
        </div>

        {/* Company Selector */}
        {companies.length > 1 && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-medium">Perusahaan:</label>
            <Select
              value={companyId?.toString() ?? ""}
              onValueChange={(value) => setSelectedCompanyId(Number(value))}
              disabled={isLoadingCompanies}
            >
              <SelectTrigger className="w-[300px] rounded-full bg-background">
                <SelectValue placeholder={isLoadingCompanies ? "Memuat..." : "Pilih Perusahaan"} />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{isLoading ? "-" : stats.approved}</div>
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
                <div className="text-2xl font-semibold">{isLoading ? "-" : stats.pending}</div>
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
                <div className="text-2xl font-semibold">{isLoading ? "-" : stats.rejected}</div>
                <div className="text-sm text-muted-foreground">Ditolak</div>
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
              placeholder="Cari nama siswa..."
              className="pl-10 rounded-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {statusFilter ? statusConfig[statusFilter].label : "Semua Status"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>Semua Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("approved")}>Disetujui</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Menunggu</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>Ditolak</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ArrowUpDown className="w-4 h-4 mr-1" />
                {sortOrder === "newest" ? "Terbaru" : "Terlama"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortOrder("newest")}>Terbaru</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("oldest")}>Terlama</DropdownMenuItem>
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
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Tanggal</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Kegiatan</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Mentor</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                      Terjadi kesalahan saat memuat data
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Tidak ada laporan ditemukan
                    </td>
                  </tr>
                ) : (
                  filtered.map((report) => {
                    const status = statusConfig[report.reviewStatus];
                    const dateStr = report.submittedAt
                      ? new Date(report.submittedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                      : "-";

                    return (
                      <tr key={report.id} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{report.student.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{dateStr}</td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">
                          {report.summary || report.title || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">{report.mentor?.name ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
