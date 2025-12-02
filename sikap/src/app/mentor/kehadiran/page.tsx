"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { STUDENTS } from "@/lib/reports-data"

type DaySummary = { date: string; total: number; present: number; absent: number }

export default function Page() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [month, setMonth] = React.useState("Semua Tanggal")

  const days: DaySummary[] = [
    { date: "2025-06-20", total: 5, present: 4, absent: 1 },
    { date: "2025-06-27", total: 5, present: 3, absent: 2 },
    { date: "2025-07-04", total: 5, present: 5, absent: 0 },
    { date: "2025-07-11", total: 5, present: 4, absent: 1 },
  ]

  React.useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false)
      setError(null)
    }, 400)
    return () => clearTimeout(t)
  }, [])

  const filtered = days.filter((d) => (month === "Semua Tanggal" ? true : d.date.startsWith(month)))
  const today = filtered[filtered.length - 1] ?? days[0]

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
            <div className="text-4xl font-semibold mt-2">{today.present}</div>
            <div className="text-sm text-muted-foreground mt-2">Siswa hadir dari total {today.total}</div>
            <div className="text-sm text-muted-foreground">{today.absent} tidak hadir</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Tanggal</div>
            <div className="text-sm font-medium">{today.date}</div>
            <div className="text-xs text-muted-foreground mt-1">Kehadiran: {Math.round((today.present / today.total) * 100)}%</div>
          </div>
        </div>

        <div className="mt-4">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="min-w-[240px] w-full sm:w-fit" aria-label="Filter Tanggal">
              <SelectValue placeholder="Semua Tanggal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua Tanggal">Semua Tanggal</SelectItem>
              <SelectItem value="2025-06">Juni 2025</SelectItem>
              <SelectItem value="2025-07">Juli 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 bg-card border rounded-xl shadow-sm p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Memuat data kehadiran...</div>
          ) : error ? (
            <div className="text-sm text-destructive">Gagal memuat data: {error}</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 px-2">
                <div className="text-sm font-medium">Tanggal</div>
                <div className="text-sm font-medium">Kehadiran</div>
                <div className="text-sm font-medium">Detail</div>
              </div>
              {filtered.map((d, i) => (
                <div key={i} className="grid grid-cols-3 items-center gap-2 px-2 py-2 rounded-md">
                  <div className="text-sm">{d.date}</div>
                  <div className="text-sm">{Math.round((d.present / d.total) * 100)}%</div>
                  <div className="text-sm">
                    <Link href={`/mentor/kehadiran/${d.date}`}>
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
  const dummy = React.useMemo(() => {
    return STUDENTS.slice(0, 20).map((s, i) => ({
      no: i + 1,
      name: s.student,
      present: (i % 4) + 1,
      excused: (i % 2),
      absent: (i % 3),
    }))
  }, [])

  const [page, setPage] = React.useState(1)
  const [q, setQ] = React.useState("")
  const perPage = 10
  const filtered = React.useMemo(() => dummy.filter((r) => (q ? r.name.toLowerCase().includes(q.toLowerCase()) : true)), [dummy, q])
  const totalPages = Math.ceil(filtered.length / perPage)
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
          {dummy.map((r, i) => (
            <option key={i} value={r.name} />
          ))}
        </datalist>
      </div>
      <div className="overflow-x-auto">
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
            {rows.map((r, idx) => (
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
