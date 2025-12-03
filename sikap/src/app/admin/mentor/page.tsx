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
import { Search, Plus } from "lucide-react";
import { api } from "@/trpc/react";

export default function AdminMentorPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Query mentors from backend (companyId is optional for admin users)
  const {
    data: mentorsData,
    isLoading,
    isError,
    refetch,
  } = api.mentors.list.useQuery({
    // companyId is optional - admin users will see all mentors
    search: search || undefined,
    active: filterStatus === "all" ? undefined : filterStatus === "Aktif",
    limit: 200,
    offset: 0,
  });

  const mentors = mentorsData?.items ?? [];

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Mentor</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar Mentor
            </p>
          </div>
          <Link href="/admin/mentor/tambah">
            <Button className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Mentor
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Berdasarkan Nama atau ID"
              className="pl-11 rounded-full bg-background border-border"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] rounded-full bg-background">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Aktif">Aktif</SelectItem>
              <SelectItem value="Nonaktif">Nonaktif</SelectItem>
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
                    Email
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Jumlah Siswa
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-sm text-destructive">
                          Gagal memuat data mentor.
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                        >
                          Coba Lagi
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : mentors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Tidak ada data mentor ditemukan
                    </td>
                  </tr>
                ) : (
                  mentors.map((mentor, index) => (
                    <tr
                      key={mentor.id}
                      className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                    >
                      <td className="px-4 py-3 text-sm">{mentor.name}</td>
                      <td className="px-4 py-3 text-sm">{mentor.mentorId}</td>
                      <td className="px-4 py-3 text-sm">{mentor.email}</td>
                      <td className="px-4 py-3 text-sm">
                        {mentor.studentCount}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {mentor.active ? "Aktif" : "Nonaktif"}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/mentor/${mentor.mentorId}`}>
                          <Button
                            size="sm"
                            className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors"
                          >
                            Detail
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
