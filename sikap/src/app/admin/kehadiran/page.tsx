"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { api } from "@/trpc/react"

export default function Page() {
  const [month, setMonth] = React.useState("Semua Tanggal")

  // Get date range from month filter
  const dateRange = React.useMemo(() => {
    if (month === "Semua Tanggal") {
      return {}
    }
    const [year, monthNum] = month.split("-").map(Number)
    if (!year || !monthNum) return {}

    const from = new Date(year, monthNum - 1, 1)
    const to = new Date(year, monthNum, 0) // Last day of the month
    to.setHours(23, 59, 59, 999)

    return { from, to }
  }, [month])

  // For admin, we don't filter by company to show all data
  const { data, isLoading, isError, refetch } = api.attendances.list.useQuery({
    from: dateRange.from,
    to: dateRange.to,
    limit: 100,
    offset: 0,
  })

  const items = data?.items ?? []
  const summary = data?.summary ?? { date: new Date().toISOString().slice(0, 10), presentCount: 0, absentCount: 0, total: 0, attendancePercent: 0 }

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-4 py-4 md:px-6 md:py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Kehadiran</h1>
          <p className="text-sm text-muted-foreground">Akumulasi Kehadiran Siswa PKL</p>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-4 md:p-6 flex items-start justify-between">
          <div>
            <div className="text-sm font-medium">Ringkasan Hari Ini</div>
            <div className="text-4xl font-semibold mt-2">{summary.presentCount}</div>
            <div className="text-sm text-muted-foreground mt-2">Siswa hadir dari total {summary.total}</div>
            <div className="text-sm text-muted-foreground">{summary.absentCount} tidak hadir</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Tanggal</div>
            <div className="text-sm font-medium">{summary.date}</div>
            <div className="text-xs text-muted-foreground mt-1">Kehadiran: {summary.attendancePercent}%</div>
          </div>
        </div>

        <div className="mt-4">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="min-w-[240px] w-full sm:w-fit" aria-label="Filter Tanggal">
              <SelectValue placeholder="Semua Tanggal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua Tanggal">Semua Tanggal</SelectItem>
              <SelectItem value="2025-01">Januari 2025</SelectItem>
              <SelectItem value="2025-02">Februari 2025</SelectItem>
              <SelectItem value="2025-03">Maret 2025</SelectItem>
              <SelectItem value="2025-04">April 2025</SelectItem>
              <SelectItem value="2025-05">Mei 2025</SelectItem>
              <SelectItem value="2025-06">Juni 2025</SelectItem>
              <SelectItem value="2025-07">Juli 2025</SelectItem>
              <SelectItem value="2025-08">Agustus 2025</SelectItem>
              <SelectItem value="2025-09">September 2025</SelectItem>
              <SelectItem value="2025-10">Oktober 2025</SelectItem>
              <SelectItem value="2025-11">November 2025</SelectItem>
              <SelectItem value="2025-12">Desember 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 bg-card border rounded-xl shadow-sm p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Memuat data kehadiran...</div>
          ) : isError ? (
            <div className="flex flex-col items-start gap-2">
              <div className="text-sm text-destructive">Gagal memuat data kehadiran.</div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Coba Lagi</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Tidak ada data kehadiran.</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 px-2">
                <div className="text-sm font-medium">Tanggal</div>
                <div className="text-sm font-medium">Kehadiran</div>
                <div className="text-sm font-medium">Detail</div>
              </div>
              {items.map((d, i) => (
                <div key={i} className="grid grid-cols-3 items-center gap-2 px-2 py-2 rounded-md">
                  <div className="text-sm">{d.date}</div>
                  <div className="text-sm">{d.attendancePercent}%</div>
                  <div className="text-sm">
                    <Link href={`/admin/kehadiran/${d.date}`}>
                      <Button variant="destructive" size="sm" className="rounded-full">Detail</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AccumulationTable />
      </div>
    </main>
  )
}

function AccumulationTable() {
  // For admin, we don't filter by company to show all data
  const { data, isLoading, isError, refetch } = api.attendances.listStudentAccumulation.useQuery({
    limit: 200,
    offset: 0,
  })

  const [page, setPage] = React.useState(1)
  const [q, setQ] = React.useState("")
  const perPage = 10

  const studentSummary = data?.items ?? []

  const filtered = React.useMemo(() => studentSummary.filter((r) => (q ? r.name.toLowerCase().includes(q.toLowerCase()) : true)), [studentSummary, q])
  const totalPages = Math.ceil(filtered.length / perPage) || 1
  const start = (page - 1) * perPage
  const rows = filtered.slice(start, start + perPage)

  return (
    <div className="mt-6 bg-card border rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-medium mb-4">Tabel Akumulasi Kehadiran Siswa Satu Periode</h3>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          list="accNames"
          className="border rounded-(--radius-sm) px-3 py-2 text-sm w-full sm:w-64"
          placeholder="Cari Nama Siswa"
          value={q}
          onChange={(e) => {
            setPage(1)
            setQ(e.target.value)
          }}
        />
        <datalist id="accNames">
          {studentSummary.map((r: { name: string }, i: number) => (
            <option key={i} value={r.name} />
          ))}
        </datalist>
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Spinner /> Memuat data...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">Tidak ada data akumulasi kehadiran siswa.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs">
                <th className="text-left py-2 px-2">No</th>
                <th className="text-left py-2 px-2">Nama Siswa</th>
                <th className="text-left py-2 px-2">Hadir</th>
                <th className="text-left py-2 px-2">Izin</th>
                <th className="text-left py-2 px-2">Tidak Hadir</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: { no: number; name: string; present: number; excused: number; absent: number }, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"}>
                  <td className="py-2 px-2">{r.no}</td>
                  <td className="py-2 px-2">{r.name}</td>
                  <td className="py-2 px-2">
                    <span className="inline-flex items-center justify-center rounded-(--radius-sm) px-2 py-0.5 text-xs bg-green-100 text-green-800">{r.present}</span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="inline-flex items-center justify-center rounded-(--radius-sm) px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800">{r.excused}</span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="inline-flex items-center justify-center rounded-(--radius-sm) px-2 py-0.5 text-xs bg-red-100 text-red-800">{r.absent}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded-(--radius-sm) border disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</button>
          <button className="px-3 py-1 rounded-(--radius-sm) border disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</button>
        </div>
      </div>
    </div>
  )
}
