"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ChevronDown, Loader2, Plus } from "lucide-react";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function RaporAkhirPage() {
  const [search, setSearch] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    studentName: string;
    studentNis: string;
  } | null>(null);
  const [confirmNis, setConfirmNis] = useState("");

  const { data, isLoading, error, refetch } =
    api.finalReports.listStudentsWithReportStatus.useQuery({
      search: search || undefined,
      limit: 50,
      offset: 0,
    });

  const deleteMutation = api.finalReports.delete.useMutation({
    onSuccess: () => {
      toast.success("Rapor akhir berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setConfirmNis("");
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleDeleteClick = (student: {
    id: number;
    studentName: string;
    studentNis: string;
  }) => {
    setDeleteTarget(student);
    setConfirmNis("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (confirmNis !== deleteTarget.studentNis) {
      toast.error("NIS tidak cocok. Silakan coba lagi.");
      return;
    }
    deleteMutation.mutate({
      id: deleteTarget.id,
      confirmCode: confirmNis,
    });
  };

  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Rapor Akhir</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola nilai rapor akhir siswa PKL
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama atau NIS siswa"
              className="bg-background border-border pl-11"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-destructive text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    NIS
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Asal Sekolah
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status Rapor
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Rata-rata
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <Spinner />
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-red-500"
                    >
                      Terjadi kesalahan: {error.message}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        className="ml-2"
                      >
                        Coba Lagi
                      </Button>
                    </td>
                  </tr>
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-muted-foreground px-4 py-8 text-center"
                    >
                      Tidak ada data siswa.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((student, index) => (
                    <tr
                      key={student.placementId}
                      className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {student.studentName}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {student.studentNis ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {student.school ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {student.reportStatus === null ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            Belum Ada
                          </span>
                        ) : student.reportStatus === "draft" ? (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            Diterbitkan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {student.reportId ? student.totalScore : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {student.reportId ? student.averageScore : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {/* No report - show "Buat Rapor" button */}
                        {student.reportStatus === null ? (
                          <Link
                            href={`/mentor/rapor-akhir/buat?student=${student.studentProfileId}`}
                          >
                            <Button size="sm" variant="destructive">
                              <Plus className="mr-1 h-3 w-3" />
                              Buat Rapor
                            </Button>
                          </Link>
                        ) : student.reportStatus === "draft" ? (
                          /* Draft - show dropdown with Lanjutkan/Hapus */
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                              >
                                Aksi
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/mentor/rapor-akhir/buat?edit=${student.reportId}`}
                                  className="cursor-pointer"
                                >
                                  Lanjutkan
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive cursor-pointer"
                                onClick={() =>
                                  handleDeleteClick({
                                    id: student.reportId!,
                                    studentName: student.studentName,
                                    studentNis: student.studentNis,
                                  })
                                }
                              >
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          /* Finalized - show dropdown with Edit/Hapus */
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                              >
                                Aksi
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/mentor/rapor-akhir/buat?edit=${student.reportId}`}
                                  className="cursor-pointer"
                                >
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive cursor-pointer"
                                onClick={() =>
                                  handleDeleteClick({
                                    id: student.reportId!,
                                    studentName: student.studentName,
                                    studentNis: student.studentNis,
                                  })
                                }
                              >
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Rapor Akhir</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus rapor akhir untuk siswa{" "}
              <strong>{deleteTarget?.studentName}</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Ketik NIS siswa{" "}
              <strong className="font-mono">{deleteTarget?.studentNis}</strong>{" "}
              untuk konfirmasi:
            </p>
            <Input
              value={confirmNis}
              onChange={(e) => setConfirmNis(e.target.value)}
              placeholder="Masukkan NIS siswa"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={
                deleteMutation.isPending ||
                confirmNis !== deleteTarget?.studentNis
              }
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
