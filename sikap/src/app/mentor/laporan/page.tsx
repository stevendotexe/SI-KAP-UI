"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { Search, ArrowLeft, CheckCircle, XCircle, Printer, ArrowUpDown, Clock, AlertCircle } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import StudentJournalCard from "@/components/mentor/StudentJournalCard";
import { toast } from "sonner";

export default function MentorLaporanPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedJournals, setSelectedJournals] = useState<number[]>([]);

  const utils = api.useUtils();

  // Debounce search to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // 300ms delay for client-side filtering

    return () => clearTimeout(timer);
  }, [search]);

  // Memoize date range to prevent infinite re-renders
  const dateRange = useMemo(() => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: firstOfMonth, to: now };
  }, []); // Empty deps = computed once on mount

  // Fetch mentee journal summaries
  const { data: summariesData, isLoading: isLoadingSummaries } = api.reports.listMenteeJournals.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  // Fetch details for selected student
  const { data: detailsData, isLoading: isLoadingDetails } = api.reports.getMenteeJournalDetails.useQuery(
    {
      studentId: selectedStudentId!,
      from: dateRange.from,
      to: dateRange.to,
    },
    { enabled: selectedStudentId !== null }
  );

  // Fetch ALL journals for selected student (for printing)
  const { data: allJournalsData } = api.reports.getAllMenteeJournals.useQuery(
    { studentId: selectedStudentId! },
    { enabled: selectedStudentId !== null }
  );

  // Verify mutation
  const verifyMutation = api.reports.verifyJournal.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} laporan berhasil diverifikasi`);
      setSelectedJournals([]);
      void utils.reports.getMenteeJournalDetails.invalidate();
      void utils.reports.listMenteeJournals.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memverifikasi laporan");
    },
  });

  const summaries = summariesData?.items ?? [];
  const journalDetails = detailsData?.items ?? [];
  const studentInfo = detailsData?.student;

  // State for filtering and sorting journal details
  const [detailStatusFilter, setDetailStatusFilter] = useState<"approved" | "pending" | "rejected" | "all">("all");
  const [detailSortOrder, setDetailSortOrder] = useState<"newest" | "oldest">("newest");

  // Filter summaries by search
  const filteredSummaries = useMemo(() => {
    if (!debouncedSearch) return summaries;
    const q = debouncedSearch.toLowerCase();
    return summaries.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.studentSchool?.toLowerCase().includes(q)
    );
  }, [summaries, debouncedSearch]);
  // Calculate stats for Dashboard
  const stats = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        total: acc.total + s.totalSubmitted,
        pending: acc.pending + s.pending,
        approved: acc.approved + s.approved,
        rejected: acc.rejected + s.rejected,
      }),
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [summaries]);

  // Filter and sort journal details
  const filteredJournals = useMemo(() => {
    let result = [...journalDetails];

    // Apply status filter
    if (detailStatusFilter !== "all") {
      result = result.filter(j => j.reviewStatus === detailStatusFilter);
    }

    // Apply sorting by activityDate
    result.sort((a, b) => {
      const dateA = a.activityDate ?? "";
      const dateB = b.activityDate ?? "";
      return detailSortOrder === "newest"
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });

    return result;
  }, [journalDetails, detailStatusFilter, detailSortOrder]);

  const detailStats = useMemo(() => {
    return journalDetails.reduce((acc, j) => ({
      total: acc.total + 1,
      pending: acc.pending + (j.reviewStatus === 'pending' ? 1 : 0),
      approved: acc.approved + (j.reviewStatus === 'approved' ? 1 : 0),
      rejected: acc.rejected + (j.reviewStatus === 'rejected' ? 1 : 0),
    }), { total: 0, pending: 0, approved: 0, rejected: 0 });
  }, [journalDetails]);

  // Toggle journal selection
  function toggleJournalSelection(id: number) {
    setSelectedJournals((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Toggle select all pending / deselect all
  function toggleSelectAllPending() {
    const pendingIds = journalDetails
      .filter((j) => j.reviewStatus === "pending")
      .map((j) => j.id);

    // If all pending are selected, deselect all; otherwise select all
    const allSelected = pendingIds.every(id => selectedJournals.includes(id));
    if (allSelected && selectedJournals.length > 0) {
      setSelectedJournals([]);
    } else {
      setSelectedJournals(pendingIds);
    }
  }

  // Check if all pending are selected
  const allPendingSelected = (() => {
    const pendingIds = journalDetails
      .filter((j) => j.reviewStatus === "pending")
      .map((j) => j.id);
    return pendingIds.length > 0 && pendingIds.every(id => selectedJournals.includes(id));
  })();

  // Format duration
  function formatDuration(minutes: number | null): string {
    if (!minutes) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} menit`;
    if (m === 0) return `${h} jam`;
    return `${h} jam ${m} menit`;
  }

  // Handle bulk approve
  function handleBulkApprove() {
    if (selectedJournals.length === 0) {
      toast.error("Pilih laporan yang ingin disetujui");
      return;
    }
    verifyMutation.mutate({
      reportIds: selectedJournals,
      status: "approved",
    });
  }

  // Handle bulk reject
  function handleBulkReject() {
    if (selectedJournals.length === 0) {
      toast.error("Pilih laporan yang ingin ditolak");
      return;
    }
    verifyMutation.mutate({
      reportIds: selectedJournals,
      status: "rejected",
      notes: "Ditolak oleh mentor",
    });
  }

  // Handle print - prints ALL journals, not just filtered ones
  function handlePrint() {
    const allJournals = allJournalsData?.items ?? [];
    const info = allJournalsData?.student ?? studentInfo;
    if (!info || allJournals.length === 0) return;

    // Create printable content with ALL entries
    const printContent = `
      <html>
        <head>
          <title>Laporan Harian PKL - ${info.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; }
            .status-approved { color: green; }
            .status-pending { color: orange; }
            .status-rejected { color: red; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Laporan Harian PKL</h1>
          <h2>${info.name} - ${info.school || 'N/A'} (${allJournals.length} Laporan)</h2>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Durasi</th>
                <th>Kegiatan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${allJournals.map(j => `
                <tr>
                  <td>${j.activityDate ? new Date(j.activityDate).toLocaleDateString('id-ID') : '-'}</td>
                  <td>${formatDuration(j.durationMinutes)}</td>
                  <td>${j.content || '-'}</td>
                  <td class="status-${j.reviewStatus}">${j.reviewStatus === 'approved' ? 'Disetujui' :
        j.reviewStatus === 'pending' ? 'Menunggu' : 'Ditolak'
      }</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Dicetak pada: ${new Date().toLocaleString('id-ID')}
          </p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  // Back to list view
  if (selectedStudentId === null) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Verifikasi Laporan PKL</h1>
            <p className="text-sm text-gray-600 mt-1">
              Verifikasi laporan harian siswa bimbingan Anda
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama siswa atau sekolah..."
                className="pl-10"
              />
            </div>
          </div>


          {/* Stats Cards */}
          <StatsCards stats={stats} isLoading={isLoadingSummaries} />

          {/* Student Cards Grid */}
          {isLoadingSummaries ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner />
              <span>Memuat data siswa...</span>
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
              <p className="text-muted-foreground">
                {search ? "Tidak ada siswa yang cocok dengan pencarian" : "Tidak ada siswa yang ditemukan"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSummaries.map((s) => (
                <StudentJournalCard
                  key={s.studentId}
                  studentId={s.studentId}
                  studentName={s.studentName}
                  studentSchool={s.studentSchool}
                  totalSubmitted={s.totalSubmitted}
                  expectedDays={s.expectedDays}
                  pending={s.pending}
                  approved={s.approved}
                  rejected={s.rejected}
                  onClick={() => setSelectedStudentId(s.studentId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Detail view for selected student
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedStudentId(null);
                setSelectedJournals([]);
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {studentInfo?.name || "Loading..."}
              </h1>
              <p className="text-sm text-gray-600">{studentInfo?.school || ""}</p>
            </div>
          </div>

          <Button variant="outline" onClick={handlePrint} disabled={journalDetails.length === 0}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak Laporan
          </Button>
        </div>

        {/* Detail Stats Cards */}
        <StatsCards stats={detailStats} isLoading={isLoadingDetails} />

        {/* Action Bar */}
        {journalDetails.some((j) => j.reviewStatus === "pending") && (
          <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-between">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {selectedJournals.length} dipilih
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleSelectAllPending} className="text-xs sm:text-sm">
                  {allPendingSelected ? "Batal Pilih" : "Pilih Semua"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={selectedJournals.length === 0 || verifyMutation.isPending}
                  className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                >
                  <XCircle className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Tolak</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={selectedJournals.length === 0 || verifyMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                >
                  {verifyMutation.isPending ? (
                    <Spinner className="sm:mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 sm:mr-1" />
                  )}
                  <span className="hidden sm:inline">Setujui</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Sort Controls */}
        {!isLoadingDetails && journalDetails.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Select value={detailStatusFilter} onValueChange={(v) => setDetailStatusFilter(v as typeof detailStatusFilter)}>
              <SelectTrigger className="w-[140px] bg-white rounded-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <Select value={detailSortOrder} onValueChange={(v) => setDetailSortOrder(v as typeof detailSortOrder)}>
              <SelectTrigger className="w-[130px] bg-white rounded-full">
                <ArrowUpDown className="w-4 h-4 mr-1" />
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Journal List */}
        {isLoadingDetails ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Spinner />
            <span>Memuat laporan...</span>
          </div>
        ) : filteredJournals.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <p className="text-muted-foreground">
              {detailStatusFilter !== "all" ? "Tidak ada laporan dengan filter tersebut" : "Belum ada laporan yang disubmit"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJournals.map((journal) => {
              const isSelected = selectedJournals.includes(journal.id);
              const isPending = journal.reviewStatus === "pending";

              return (
                <div
                  key={journal.id}
                  className={`bg-white rounded-xl border shadow-sm p-4 ${isSelected ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox for pending items */}
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleJournalSelection(journal.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {journal.activityDate
                              ? new Date(journal.activityDate).toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                              : "-"}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${journal.reviewStatus === "approved"
                              ? "bg-green-100 text-green-700"
                              : journal.reviewStatus === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                              }`}
                          >
                            {journal.reviewStatus === "approved"
                              ? "Disetujui"
                              : journal.reviewStatus === "pending"
                                ? "Menunggu"
                                : "Ditolak"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Durasi PKL: {formatDuration(journal.durationMinutes)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {journal.content}
                      </p>
                    </div>

                    {/* Quick actions for individual item */}
                    {isPending && !isSelected && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            verifyMutation.mutate({
                              reportIds: [journal.id],
                              status: "approved",
                            })
                          }
                          disabled={verifyMutation.isPending}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            verifyMutation.mutate({
                              reportIds: [journal.id],
                              status: "rejected",
                            })
                          }
                          disabled={verifyMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main >
  );
}
