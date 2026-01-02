"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  ArrowUpDown,
  Printer,
} from "lucide-react";
import JournalFormDialog from "@/components/students/JournalFormDialog";
import JournalCalendarView from "@/components/students/JournalCalendarView";
import { toast } from "sonner";

export default function LaporanSiswaPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "approved" | "pending" | "rejected" | "all"
  >("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const utils = api.useUtils();

  // Fetch journal entries for the selected month
  const { data, isLoading, isError, refetch } =
    api.reports.listJournals.useQuery({
      month: selectedMonth,
      year: selectedYear,
    });

  // Fetch ALL journals for printing and stats
  const { data: allJournalsData, isLoading: isLoadingAllJournals } = api.reports.listAllJournals.useQuery();

  // Delete mutation
  const { mutate: deleteJournal } = api.reports.deleteJournal.useMutation({
    onSuccess: () => {
      toast.success("Laporan berhasil dihapus");
      setSelectedDate(null);
      void utils.reports.listJournals.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus laporan");
    },
  });

  const entries = data?.items ?? [];

  // Calculate all-time stats from ALL journals (not just current month)
  const allTimeStats = useMemo(() => {
    const allItems = allJournalsData?.items ?? [];
    return {
      total: allItems.length,
      pending: allItems.filter((j) => j.reviewStatus === "pending").length,
      approved: allItems.filter((j) => j.reviewStatus === "approved").length,
      rejected: allItems.filter((j) => j.reviewStatus === "rejected").length,
    };
  }, [allJournalsData]);

  // Apply filter and sorting
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((e) => e.reviewStatus === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = a.activityDate ?? "";
      const dateB = b.activityDate ?? "";
      return sortOrder === "newest"
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });

    return result;
  }, [entries, statusFilter, sortOrder]);

  // Handle day click from calendar - just select the date, don't auto-open modal
  function handleDayClick(date: string) {
    setSelectedDate(date);
  }

  // Handle month change from calendar navigation
  function handleMonthChange(year: number, month: number) {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDate(null);
  }

  // Format duration from minutes to readable string
  function formatDuration(minutes: number | null): string {
    if (!minutes) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} menit`;
    if (m === 0) return `${h} jam`;
    return `${h} jam ${m} menit`;
  }

  // Get selected entry if any
  const selectedEntry = selectedDate
    ? entries.find((e) => e.activityDate === selectedDate)
    : null;

  // Handle print - prints ALL journals, not just current month
  function handlePrint() {
    const allEntries = allJournalsData?.items ?? [];
    if (allEntries.length === 0) return;

    // Create printable content with ALL entries
    const printContent = `
      <html>
        <head>
          <title>Laporan Harian PKL</title>
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
          <h2>Total: ${allEntries.length} Laporan</h2>
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
              ${allEntries.map(j => `
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

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 m-0">
        <main className="space-y-6 mx-auto max-w-[1200px] px-6 py-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">
                Laporan Harian PKL
              </h1>
              <p className="text-muted-foreground">
                Catat kegiatan magang Anda setiap hari
              </p>
            </div>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={(allJournalsData?.items.length ?? 0) === 0}
                className="gap-2"
              >
                <Printer className="size-4" />
                <span>Cetak Semua</span>
              </Button>
              <Button
                onClick={() => {
                  setSelectedDate(null);
                  setDialogOpen(true);
                }}
                className="gap-2 bg-red-600 text-white hover:bg-red-700"
              >
                <Plus className="size-4" />
                <span>Tambah</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-100 p-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-semibold">
                    {isLoadingAllJournals ? "-" : allTimeStats.total}
                  </div>
                  <div className="text-muted-foreground text-xs sm:text-sm">
                    Total Laporan
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-semibold">
                    {isLoadingAllJournals ? "-" : allTimeStats.pending}
                  </div>
                  <div className="text-muted-foreground text-xs sm:text-sm">Menunggu</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-semibold">
                    {isLoadingAllJournals ? "-" : allTimeStats.approved}
                  </div>
                  <div className="text-muted-foreground text-xs sm:text-sm">Disetujui</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-semibold">
                    {isLoadingAllJournals ? "-" : allTimeStats.rejected}
                  </div>
                  <div className="text-muted-foreground text-xs sm:text-sm">Ditolak</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar - Takes 2 columns on lg+ */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="flex items-center justify-center rounded-xl border bg-white p-8 shadow-sm">
                  <Spinner />
                  <span className="text-muted-foreground ml-2">
                    Memuat laporan...
                  </span>
                </div>
              ) : isError ? (
                <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
                  <p className="text-destructive mb-4">
                    Gagal memuat data laporan
                  </p>
                  <Button variant="outline" onClick={() => refetch()}>
                    Coba Lagi
                  </Button>
                </div>
              ) : (
                <JournalCalendarView
                  year={selectedYear}
                  month={selectedMonth}
                  entries={entries}
                  selectedDate={selectedDate}
                  onDayClick={handleDayClick}
                  onMonthChange={handleMonthChange}
                />
              )}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">
                  {selectedDate
                    ? `Detail ${new Date(selectedDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Pilih Tanggal"}
                </h3>

                {!selectedDate ? (
                  <p className="text-muted-foreground text-sm">
                    Klik tanggal pada kalender untuk melihat detail atau menambah
                    laporan baru.
                  </p>
                ) : selectedEntry ? (
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${selectedEntry.reviewStatus === "approved"
                          ? "bg-green-100 text-green-700"
                          : selectedEntry.reviewStatus === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                          }`}
                      >
                        {selectedEntry.reviewStatus === "approved"
                          ? "Disetujui"
                          : selectedEntry.reviewStatus === "pending"
                            ? "Menunggu Review"
                            : "Ditolak"}
                      </span>
                    </div>

                    {/* Duration */}
                    <div>
                      <p className="mb-1 text-xs tracking-wide text-gray-500 uppercase">
                        Durasi
                      </p>
                      <p className="text-sm font-medium">
                        {formatDuration(selectedEntry.durationMinutes)}
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="mb-1 text-xs tracking-wide text-gray-500 uppercase">
                        Deskripsi Kegiatan
                      </p>
                      <p className="text-sm whitespace-pre-wrap text-gray-700">
                        {selectedEntry.content}
                      </p>
                    </div>

                    {/* Review Notes (if any) */}
                    {selectedEntry.reviewNotes && (
                      <div>
                        <p className="mb-1 text-xs tracking-wide text-gray-500 uppercase">
                          Catatan Mentor
                        </p>
                        <p className="text-sm text-gray-700 italic">
                          {selectedEntry.reviewNotes}
                        </p>
                      </div>
                    )}

                    {/* Edit and Delete buttons for pending entries */}
                    {selectedEntry.reviewStatus === "pending" && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialogOpen(true)}
                          className="flex-1"
                        >
                          <Pencil className="mr-1 size-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (
                              confirm(
                                "Apakah Anda yakin ingin menghapus laporan ini?",
                              )
                            ) {
                              deleteJournal({ reportId: selectedEntry.id });
                            }
                          }}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}

                    {/* Resubmit button for rejected entries */}
                    {selectedEntry.reviewStatus === "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDialogOpen(true)}
                        className="mt-2 w-full"
                      >
                        <Pencil className="mr-1 size-4" />
                        Perbaiki
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground mb-4 text-sm">
                      Belum ada laporan untuk tanggal ini
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setDialogOpen(true)}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      <Plus className="mr-1 size-4" />
                      Tambah Laporan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Journal List (below calendar) */}
          <div className="mt-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Daftar Laporan Bulan Ini
              </h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                >
                  <SelectTrigger className="w-full sm:w-[140px] rounded-full bg-white text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortOrder}
                  onValueChange={(v) => setSortOrder(v as typeof sortOrder)}
                >
                  <SelectTrigger className="w-full sm:w-[130px] rounded-full bg-white text-sm">
                    <ArrowUpDown className="mr-1 h-4 w-4" />
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="oldest">Terlama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-muted-foreground text-sm">Memuat...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="rounded-xl border bg-white p-6 text-center shadow-sm">
                <p className="text-muted-foreground">
                  {statusFilter !== "all"
                    ? "Tidak ada laporan dengan filter tersebut"
                    : "Belum ada laporan bulan ini"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedDate(entry.activityDate)}
                    className={`cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-colors hover:border-red-200 ${selectedDate === entry.activityDate
                      ? "border-red-500 ring-1 ring-red-500"
                      : ""
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-medium text-gray-900 text-sm sm:text-base">
                            {entry.activityDate
                              ? new Date(entry.activityDate).toLocaleDateString(
                                "id-ID",
                                {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                },
                              )
                              : "-"}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-fit ${entry.reviewStatus === "approved"
                              ? "bg-green-100 text-green-700"
                              : entry.reviewStatus === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                              }`}
                          >
                            {entry.reviewStatus === "approved"
                              ? "Disetujui"
                              : entry.reviewStatus === "pending"
                                ? "Menunggu"
                                : "Ditolak"}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm text-gray-600">
                          {entry.content}
                        </p>
                      </div>
                      <div className="ml-2 sm:ml-4 text-right flex-shrink-0">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                          {formatDuration(entry.durationMinutes)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Dialog */}
          <JournalFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            defaultDate={selectedDate ?? undefined}
            editingEntry={
              selectedEntry?.reviewStatus === "pending" ||
                selectedEntry?.reviewStatus === "rejected"
                ? selectedEntry
                : null
            }
            onSuccess={() => {
              void refetch();
            }}
          />
        </main>
      </div>
    </div>
  );
}
