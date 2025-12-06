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
        <p className="text-sm text-muted-foreground">Daftar seluruh tugas siswa</p>
        <ClientList />
      </div>
    </main>
  )
}

// Map UI status filter to backend enum
function mapStatusToBackend(status: string): "belum_dikerjakan" | "belum_direview" | "sudah_direview" | undefined {
  switch (status) {
    case "Belum Dikerjakan":
      return "belum_dikerjakan"
    case "Belum Direview":
      return "belum_direview"
    case "Sudah Direview":
      return "sudah_direview"
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

// Status badge colors and labels
function getStatusDisplay(status: string) {
  switch (status) {
    case "belum_dikerjakan":
      return { label: "Belum Dikerjakan", className: "bg-gray-100 text-gray-800" }
    case "belum_direview":
      return { label: "Belum Direview", className: "bg-yellow-100 text-yellow-800" }
    case "sudah_direview":
      return { label: "Sudah Direview", className: "bg-green-100 text-green-800" }
    default:
      return { label: status, className: "bg-gray-100 text-gray-800" }
  }
}

function ClientList() {
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("Semua Status")
  const [date, setDate] = React.useState("Semua Tanggal")

  // Get date range from filter
  const dateRange = React.useMemo(() => getDateRange(date), [date])

  // Query tasks from backend
  const { data, isLoading, isError, refetch } = api.tasks.listForMentor.useQuery({
    search: q || undefined,
    status: mapStatusToBackend(status),
    from: dateRange.from,
    to: dateRange.to,
    limit: 200,
    offset: 0,
  })

  const list = data?.items ?? []

  return (
    <div className="mt-6 space-y-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari Berdasarkan Judul Tugas atau Nama Siswa" className="h-10" />
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
            <SelectItem value="Belum Dikerjakan">Belum Dikerjakan</SelectItem>
            <SelectItem value="Belum Direview">Belum Direview</SelectItem>
            <SelectItem value="Sudah Direview">Sudah Direview</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Memuat tugas...</div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-2">
          <div className="text-sm text-destructive">Gagal memuat tugas.</div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Coba Lagi</Button>
        </div>
      ) : list.length === 0 ? (
        <div className="text-sm text-muted-foreground">Tidak ada tugas.</div>
      ) : (
        <div className="space-y-4">
          {list.map((r) => {
            const statusDisplay = getStatusDisplay(r.status)
            return (
              <div key={r.id} className="bg-card border rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.student.name}</div>
                  <div className="text-base font-semibold">{r.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {r.dueDate ? `Deadline: ${formatDate(r.dueDate)}` : "Tanpa deadline"}
                    {r.submittedAt && ` • Disubmit: ${formatDate(r.submittedAt)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-(--radius-md) text-xs ${statusDisplay.className}`}>
                    {statusDisplay.label}
                  </span>
                  <Link href={`/mentor/laporan/${r.id}`}>
                    <Button variant="destructive" size="sm" className="rounded-full">
                      {r.status === "belum_direview" ? "Review" : "Lihat Detail"}
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
