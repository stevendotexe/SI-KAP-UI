"use client";

import { useState } from "react";
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
import { Search, Pencil } from "lucide-react";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";

export default function RaporAkhirPage() {
  const [search, setSearch] = useState("");
  const [filterCohort, setFilterCohort] = useState<string | undefined>(
    undefined,
  );
  const [filterStatus, setFilterStatus] = useState<
    "active" | "completed" | "canceled" | undefined
  >(undefined);

  const { data, isLoading, error } = api.finalReports.list.useQuery({
    cohort: filterCohort,
    status: filterStatus,
    search: search || undefined,
    limit: 100,
    offset: 0,
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Selesai";
      case "active":
        return "Aktif";
      case "canceled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "active":
        return "bg-blue-100 text-blue-700";
      case "canceled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
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
        <div className="mb-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama atau kode siswa"
              className="bg-background border-border rounded-full pl-11"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <Select
            value={filterCohort || "all"}
            onValueChange={(val) =>
              setFilterCohort(val === "all" ? undefined : val)
            }
          >
            <SelectTrigger className="bg-background w-[180px] rounded-full">
              <SelectValue placeholder="Semua Angkatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Angkatan</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterStatus || "all"}
            onValueChange={(val) =>
              setFilterStatus(val === "all" ? undefined : (val as any))
            }
          >
            <SelectTrigger className="bg-background w-[180px] rounded-full">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="canceled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-card rounded-xl border p-8 text-center shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-red-600">
              Terjadi Kesalahan
            </h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && data && (
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
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Total Nilai
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
                  {data.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-muted-foreground px-4 py-8 text-center"
                      >
                        Tidak ada data rapor akhir
                      </td>
                    </tr>
                  ) : (
                    data.items.map((report, index) => (
                      <tr
                        key={report.id}
                        className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {report.studentName}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {report.studentNis ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {report.schoolName || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(report.status)}`}
                          >
                            {getStatusLabel(report.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {report.totalScore}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {report.averageScore}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/rapor-akhir/${report.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-muted cursor-pointer"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
