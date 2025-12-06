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
  const [filterCohort, setFilterCohort] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data, isLoading, error, refetch } = api.finalReports.list.useQuery({
    cohort: filterCohort === 'all' ? undefined : filterCohort,
    status: filterStatus === 'all' ? undefined : filterStatus as 'active' | 'completed' | 'canceled',
    search: search || undefined,
    limit: 50,
    offset: 0
  });

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Rapor Akhir</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola nilai rapor akhir siswa PKL
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama atau kode siswa"
              className="pl-11 rounded-full bg-background border-border"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={filterCohort} onValueChange={setFilterCohort}>
            <SelectTrigger className="w-[180px] rounded-full bg-background">
              <SelectValue placeholder="Semua Angkatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Angkatan</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] rounded-full bg-background">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="canceled">Non-Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-destructive text-white">
                <tr>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Nama
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Kode
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Asal Sekolah
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Angkatan
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Total Nilai
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Rata-rata
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <Spinner />
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-red-500">
                      Terjadi kesalahan: {error.message}
                      <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
                        Coba Lagi
                      </Button>
                    </td>
                  </tr>
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Tidak ada data siswa.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((student, index) => (
                    <tr
                      key={student.id}
                      className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {student.studentName}
                      </td>
                      <td className="px-4 py-3 text-sm">{student.studentCode}</td>
                      <td className="px-4 py-3 text-sm">{student.school}</td>
                      <td className="px-4 py-3 text-sm">{student.cohort}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : student.status === "active"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {student.status === "completed"
                            ? "Selesai"
                            : student.status === "active"
                              ? "Aktif"
                              : "Non-Aktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {student.totalScore}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {student.averageScore}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/mentor/rapor-akhir/${student.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-muted cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
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
      </div>
    </main>
  );
}
