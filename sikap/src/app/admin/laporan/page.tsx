"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, CheckCircle, XCircle, Clock } from "lucide-react";
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
  rejected: { icon: <XCircle className="w-4 h-4" />, class: "bg-gray-100 text-gray-700", label: "Ditolak" },
};

const typeLabels: Record<string, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
};

export default function AdminLaporanPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"approved" | "pending" | "rejected" | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  // Fetch companies
  const { data: companiesData, isLoading: isLoadingCompanies } = api.companies.list.useQuery({
    limit: 100,
  });

  // Auto-select first company if none selected
  const companies = companiesData?.items ?? [];
  const companyId = selectedCompanyId ?? companies[0]?.id ?? null;

  // Fetch reports for selected company
  const { data: reportsData, isLoading: isLoadingReports, isError } = api.reports.list.useQuery(
    {
      companyId: companyId!,
      search: search || undefined,
      status: statusFilter ?? undefined,
      limit: 200,
    },
    {
      enabled: companyId !== null,
    }
  );

  const reports = reportsData?.items ?? [];

  // Filter reports on client side for additional filtering
  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        !search ||
        r.student.name.toLowerCase().includes(search.toLowerCase()) ||
        r.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || r.reviewStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, search, statusFilter]);

  // Calculate stats from filtered reports
  const stats = useMemo(() => {
    const approved = filtered.filter((r) => r.reviewStatus === "approved").length;
    const pending = filtered.filter((r) => r.reviewStatus === "pending").length;
    const rejected = filtered.filter((r) => r.reviewStatus === "rejected").length;
    return { approved, pending, rejected };
  }, [filtered]);

  const isLoading = isLoadingCompanies || isLoadingReports;

  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Laporan Siswa</h1>
            <p className="text-muted-foreground mt-1">Kelola semua laporan siswa PKL/Prakerin</p>
          </div>
          <Button variant="outline" disabled>
            <Download className="w-4 h-4 mr-2" />
            Ekspor Data
          </Button>
        </div>

        {/* Company Selector */}
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
              placeholder="Cari nama siswa atau judul laporan..."
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
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-destructive">
                      Terjadi kesalahan saat memuat data
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Tidak ada laporan ditemukan
                    </td>
                  </tr>
                ) : (
                  filtered.map((report) => {
                    const status = statusConfig[report.reviewStatus];
                    const typeLabel = typeLabels[report.type] ?? report.type;
                    const dateStr = report.submittedAt
                      ? new Date(report.submittedAt).toLocaleDateString("id-ID")
                      : "-";

                    return (
                      <tr key={report.id} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{report.student.name}</td>
                        <td className="px-4 py-3 text-sm">{report.title ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted">
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{dateStr}</td>
                        <td className="px-4 py-3 text-sm">{report.mentor?.name ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {report.score !== null ? report.score : "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/siswa/${report.student.id}/laporan/${report.id}`}>
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

