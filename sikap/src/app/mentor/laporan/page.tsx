"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/trpc/react"

export default function Page() {
  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold">Laporan</h1>
        <p className="text-sm text-muted-foreground">Daftar Seluruh laporan</p>
        <ClientList />
      </div>
    </main>
  )
}

// Map UI status filter values to backend reviewStatus enum
function mapStatusToBackend(status: string): "pending" | "approved" | "rejected" | undefined {
  switch (status) {
    case "Sudah Direview":
      return "approved"
    case "Belum Direview":
      return "pending"
    case "Ditolak":
      return "rejected"
    default:
      return undefined
  }
}

// Convert date filter to date range
function getDateRange(dateFilter: string): { from?: Date; to?: Date } {
  if (dateFilter === "Semua Tanggal") {
    return {}
  }
  // Format: "2025-06" -> from: 2025-06-01, to: 2025-06-30
  const [year, month] = dateFilter.split("-").map(Number)
  if (!year || !month) return {}
  
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0) // Last day of the month
  to.setHours(23, 59, 59, 999)
  
  return { from, to }
}

// Format date to Indonesian locale
function formatDate(date: Date | string | null): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

function ClientList() {
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("Semua Status")
  const [date, setDate] = React.useState("Semua Tanggal")

  // Get date range from filter
  const dateRange = React.useMemo(() => getDateRange(date), [date])

  // Get mentor's profile to retrieve companyId
  const { data: mentorProfile, isLoading: isMentorLoading } = api.mentors.me.useQuery()
  const companyId = mentorProfile?.companyId

  // Query reports from backend - only when companyId is known
  const { data, isLoading: isReportsLoading, isError, refetch } = api.reports.list.useQuery({
    companyId: companyId!,
    search: q || undefined,
    status: mapStatusToBackend(status),
    from: dateRange.from,
    to: dateRange.to,
    limit: 200,
    offset: 0,
  }, {
    enabled: !!companyId,
  })

  const isLoading = isMentorLoading || isReportsLoading
  const list = data?.items ?? []

  return (
    <div className="mt-6 space-y-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari Berdasarkan Judul Laporan atau Nama Siswa" className="h-10" />
      <div className="flex flex-wrap gap-3">
        <Select value={date} onValueChange={setDate}>
          <SelectTrigger className="min-w-[240px] w-full sm:w-fit" aria-label="Filter Tanggal">
            <SelectValue placeholder="Semua Tanggal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Tanggal">Semua Tanggal</SelectItem>
            <SelectItem value="2025-06">Juni 2025</SelectItem>
            <SelectItem value="2025-07">Juli 2025</SelectItem>
            <SelectItem value="2025-08">Agustus 2025</SelectItem>
            <SelectItem value="2025-09">September 2025</SelectItem>
            <SelectItem value="2025-10">Oktober 2025</SelectItem>
            <SelectItem value="2025-11">November 2025</SelectItem>
            <SelectItem value="2025-12">Desember 2025</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="min-w-[240px] w-full sm:w-fit">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Status">Semua Status</SelectItem>
            <SelectItem value="Sudah Direview">Sudah Direview</SelectItem>
            <SelectItem value="Belum Direview">Belum Direview</SelectItem>
            <SelectItem value="Ditolak">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Memuat laporan...</div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-2">
          <div className="text-sm text-destructive">Gagal memuat laporan.</div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Coba Lagi</Button>
        </div>
      ) : list.length === 0 ? (
        <div className="text-sm text-muted-foreground">Tidak ada laporan.</div>
      ) : (
        <div className="space-y-4">
          {list.map((r) => (
            <div key={r.id} className="bg-card border rounded-xl shadow-sm p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium">{r.student.name}</div>
                <div className="text-base font-semibold">{r.title ?? "Laporan Tanpa Judul"}</div>
                <div className="text-sm text-muted-foreground">{formatDate(r.submittedAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-(--radius-md) text-xs ${
                  r.reviewStatus === "approved" 
                    ? "bg-green-100 text-green-800" 
                    : r.reviewStatus === "pending" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-red-100 text-red-800"
                }`}>
                  {r.reviewStatus === "approved" ? "Direview" : r.reviewStatus === "pending" ? "Belum Direview" : "Ditolak"}
                </span>
                <Link href={`/mentor/laporan/${r.id}`}>
                  <Button variant="destructive" size="sm" className="rounded-full">
                    {r.reviewStatus === "pending" ? "Review" : "Lihat Detail"}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
