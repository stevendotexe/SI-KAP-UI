"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import BackButton from "@/components/students/BackButton";
import { api } from "@/trpc/react";

// Map API status to display labels
function getStatusLabel(
  status: string,
): "Hadir" | "Tidak Hadir" | "Izin" | "Terlambat" {
  switch (status) {
    case "present":
      return "Hadir";
    case "absent":
      return "Tidak Hadir";
    case "excused":
      return "Izin";
    case "late":
      return "Terlambat";
    default:
      return "Tidak Hadir";
  }
}

// Map UI filter to API status enum
function mapStatusFilterToApi(
  status: string,
): "present" | "absent" | "excused" | "late" | undefined {
  switch (status) {
    case "Hadir":
      return "present";
    case "Tidak Hadir":
      return "absent";
    case "Izin":
      return "excused";
    case "Terlambat":
      return "late";
    default:
      return undefined;
  }
}

export default function AttendanceDetailClient({ date }: { date: string }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("Semua Status");

  // Parse date string to Date object for API
  const dateObj = React.useMemo(() => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [date]);

  const isValidDate = !isNaN(dateObj.getTime());

  const { data, isLoading, isError, refetch } = api.attendances.detail.useQuery(
    {
      date: dateObj,
      status: mapStatusFilterToApi(status),
      search: q || undefined,
      limit: 200,
      offset: 0,
    },
    {
      enabled: isValidDate,
    },
  );

  const verifyMutation = api.attendances.verify.useMutation({
    onSuccess: async () => {
      await refetch();
    },
    onError: (err) => {
      alert("Gagal memverifikasi: " + err.message);
    },
  });

  const deleteMutation = api.attendances.delete.useMutation({
    onSuccess: async () => {
      await refetch();
    },
    onError: (err) => {
      alert("Gagal menghapus: " + err.message);
    },
  });

  const handleVerify = (id: number) => {
    verifyMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data kehadiran ini?")) {
      deleteMutation.mutate({ id });
    }
  };

  const list = data?.items ?? [];

  return (
    <div>
      <BackButton hrefFallback="/mentor/kehadiran" />
      <h2 className="mt-2 text-2xl font-semibold">Detail Kehadiran</h2>
      <p className="text-muted-foreground text-sm">
        {new Date(date).toLocaleDateString("id-ID", { weekday: "long" })} •{" "}
        {date}
      </p>

      <div className="mt-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari Berdasarkan Nama atau Kode"
          className="h-10"
        />
      </div>

      <div className="mt-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full min-w-60 sm:w-fit">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Status">Semua Status</SelectItem>
            <SelectItem value="Hadir">Hadir</SelectItem>
            <SelectItem value="Tidak Hadir">Tidak Hadir</SelectItem>
            <SelectItem value="Izin">Izin</SelectItem>
            <SelectItem value="Terlambat">Terlambat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card mt-4 rounded-xl border p-4 shadow-sm">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner /> Memuat data kehadiran...
          </div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2">
            <div className="text-destructive text-sm">
              Gagal memuat data kehadiran.
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            Tidak ada data kehadiran.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2 px-2">
              <div className="text-sm font-medium">Kode</div>
              <div className="col-span-2 text-sm font-medium">Nama</div>
              <div className="text-sm font-medium">Presensi</div>
              <div className="pr-2 text-right text-sm font-medium">Aksi</div>
            </div>
            <div className="mt-2 space-y-2">
              {list.map((e) => {
                const statusLabel = getStatusLabel(e.status);
                const statusClass =
                  e.status === "present"
                    ? "bg-green-100 text-green-800"
                    : e.status === "late"
                      ? "bg-yellow-100 text-yellow-800"
                      : e.status === "excused"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800";

                return (
                  <div
                    key={e.id}
                    className="hover:bg-accent/50 grid grid-cols-5 items-center gap-2 rounded-md px-2 py-2 transition-colors"
                  >
                    <div className="text-sm">{e.student.code}</div>
                    <div className="col-span-2 text-sm font-medium">
                      {e.student.name}
                    </div>
                    <div className="text-sm">
                      <span
                        className={`inline-flex items-center justify-center rounded-sm px-2 py-0.5 text-xs ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pr-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            Detail
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detail Kehadiran Siswa</DialogTitle>
                            <DialogDescription>
                              Menampilkan rincian presensi untuk{" "}
                              {e.student.name} pada tanggal {e.date}.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6 p-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xl font-bold">
                                  {e.student.name}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  {e.student.school}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center justify-center rounded-sm px-3 py-1 text-xs font-semibold ${statusClass}`}
                              >
                                {statusLabel}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                  Kode Siswa
                                </p>
                                <p className="text-sm font-semibold">
                                  {e.student.code}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                  Tanggal
                                </p>
                                <p className="text-sm font-semibold">
                                  {e.date}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                  Waktu Masuk
                                </p>
                                <p className="text-sm font-semibold">
                                  {e.checkInAt
                                    ? new Date(e.checkInAt).toLocaleTimeString(
                                        "id-ID",
                                      )
                                    : "-"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                  Waktu Keluar
                                </p>
                                <p className="text-sm font-semibold">
                                  {e.checkOutAt
                                    ? new Date(e.checkOutAt).toLocaleTimeString(
                                        "id-ID",
                                      )
                                    : "-"}
                                </p>
                              </div>
                              {e.mentor && (
                                <div className="space-y-1">
                                  <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                    Mentor
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {e.mentor.name ?? "-"}
                                  </p>
                                </div>
                              )}
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                  Status Verifikasi
                                </p>
                                <div className="text-sm font-semibold">
                                  {e.verifiedAt ? (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="lucide lucide-check-circle"
                                      >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                      </svg>
                                      Terverifikasi pd{" "}
                                      {new Date(
                                        e.verifiedAt,
                                      ).toLocaleDateString("id-ID")}
                                    </span>
                                  ) : (
                                    <span className="text-yellow-600">
                                      Belum Diverifikasi
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between pt-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(e.id)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending
                                  ? "Menghapus..."
                                  : "Hapus Kehadiran"}
                              </Button>

                              {!e.verifiedAt && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 text-white hover:bg-green-700"
                                  onClick={() => handleVerify(e.id)}
                                  disabled={verifyMutation.isPending}
                                >
                                  {verifyMutation.isPending
                                    ? "Memverifikasi..."
                                    : "Verifikasi Sekarang"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
