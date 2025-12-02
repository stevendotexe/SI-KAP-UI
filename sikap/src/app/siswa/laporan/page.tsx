"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { api } from "@/trpc/react"

type UiReport = {
  id: number
  studentName: string
  weekDay: string
  title: string
  status: "Terkumpul" | "Direview" | "Belum Direview"
  dueDate?: string
}

export default function LaporanSiswaPage() {
  const [q, setQ] = useState("")
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<"Terkumpul" | "Direview" | "Belum Direview" | null>(null)
  const [skipQuery, setSkipQuery] = useState(true) // mulai: jangan query di initial render
  const [manualRetryToken, setManualRetryToken] = useState(0)

  // gunakan Array.from agar lebih jelas dan bebas lint
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  // Fetch dari database: daftar tugas milik siswa login
  const { data, isLoading, isError } = api.tasks.listAssigned.useQuery(
    { limit: 100, offset: manualRetryToken },
    {
      retry: 0,
      enabled: !skipQuery,
    }
  )

  // Hentikan query otomatis setelah error pertama
  useEffect(() => {
    if (isError && !skipQuery) {
      setSkipQuery(true)
    }
  }, [isError, skipQuery])

  // Transform ke UI tanpa operator nullish-coalescing
  const reports: UiReport[] = useMemo(() => {
    if (!data || !Array.isArray(data.items)) return []
    return data.items.map((t) => {
      // Safely parse due date without instanceof
      let dd: Date | undefined
      if (t.dueDate) {
        const parsed = new Date(t.dueDate as unknown as string)
        if (!isNaN(parsed.getTime())) dd = parsed
      }

      // Map status DB ke label UI sederhana
      const s: UiReport["status"] =
        t.status === "submitted" ? "Terkumpul" :
        t.status === "approved" ? "Direview" :
        "Belum Direview"

      return {
        id: t.id,
        studentName: "Anda",
        weekDay: dd ? new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(dd) : "—",
        title: typeof t.title === "string" && t.title.length ? t.title : "Tanpa Judul",
        status: s,
        dueDate: dd ? dd.toISOString().slice(0, 10) : undefined,
      }
    })
  }, [data])

  // Fallback bawaan saat data belum dimuat dari DB
  const defaultReports: UiReport[] = [
    { id: 1, studentName: "Anda", weekDay: "Senin", title: "Penyiapan Awal & Orientasi", status: "Terkumpul", dueDate: "2025-09-08" },
    { id: 2, studentName: "Anda", weekDay: "Selasa", title: "Perancangan & Implementasi Basis Data", status: "Direview", dueDate: "2025-09-15" },
  ]

  // Filter lokal: search + date + status
  const source = skipQuery ? defaultReports : reports
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return source.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(s) ||
        r.studentName.toLowerCase().includes(s)
      const matchDate = selectedDate == null
        ? true
        : (r.dueDate ? Number(r.dueDate.slice(8, 10)) === selectedDate : false)
      const matchStatus = selectedStatus == null ? true : r.status === selectedStatus
      return matchSearch && matchDate && matchStatus
    })
  }, [source, q, selectedDate, selectedStatus])

  return (
    <main className="w-full max-w-none p-5 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-5">
      {/* Header judul + aksi */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Laporan</h1>
          <p className="text-muted-foreground">Daftar laporan Anda</p>
        </div>

        {/* tombol buat laporan dipindahkan ke halaman daftar tugas siswa */}
        {/* <Button className="bg-red-500 hover:bg-red-600 text-white h-9 px-4 rounded-md" asChild>
          <Link href="/siswa/laporan/buat-laporan">
            <span className="mr-2 text-lg leading-none">＋</span>
            buat laporan
          </Link>
        </Button> */}
      </div>

      {/* Banner mitigasi error DB */}
      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm px-3 py-2">
          Gagal memuat laporan dari database (dihentikan). Anda tetap dapat memakai filter lokal.
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => {
              setSkipQuery(false)
              setManualRetryToken((n) => n + 1)
            }}
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Pencarian */}
      <div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={isLoading ? "Memuat..." : "Cari judul laporan atau nama siswa"}
          className="w-full rounded-full bg-white border text-gray-700 placeholder:text-gray-400 h-10 px-4"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Semua Tanggal dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-9 bg-white border text-gray-700 hover:bg-gray-50 px-3 rounded-md">
              {selectedDate ? `Tanggal: ${selectedDate}` : "Semua Tanggal"} <span className="ml-2">▾</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 rounded-xl border bg-card shadow-sm p-0">
            <div className="max-h-64 overflow-auto py-1">
              {days.map((day) => {
                const active = selectedDate === day
                return (
                  <DropdownMenuItem
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`w-full px-3 py-2 text-left text-sm justify-start ${
                      active ? "bg-accent/50" : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {day}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuItem
                onClick={() => setSelectedDate(null)}
                className="w-full px-3 py-2 text-left text-sm justify-start text-gray-600 hover:bg-accent hover:text-accent-foreground"
              >
                Bersihkan tanggal
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Semua Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-9 bg-white border text-gray-700 hover:bg-gray-50 px-3 rounded-md">
              {selectedStatus ? `Status: ${selectedStatus}` : "Semua Status"} <span className="ml-2">▾</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 rounded-xl border bg-card shadow-sm p-0">
            <div className="max-h-64 overflow-auto py-1">
              {(["Terkumpul", "Direview", "Belum Direview"] as const).map((st) => {
                const active = selectedStatus === st
                return (
                  <DropdownMenuItem
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`w-full px-3 py-2 text-left text-sm justify-start ${
                      active ? "bg-accent/50" : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {st}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuItem
                onClick={() => setSelectedStatus(null)}
                className="w-full px-3 py-2 text-left text-sm justify-start text-gray-600 hover:bg-accent hover:text-accent-foreground"
              >
                Semua status
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List kartu laporan (dinamis) */}
      <section className="space-y-4">
        {(!skipQuery && isLoading) && (
          <article className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
            <p className="text-sm text-gray-600">Memuat laporan...</p>
          </article>
        )}

        {/* Render sumber sesuai kondisi: defaultReports saat skipQuery, DB saat tidak */}
        {filtered.map((r) => (
          <article key={r.id} className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-gray-900 font-semibold">{r.studentName}</p>
                <p className="text-gray-900 font-semibold">{r.weekDay}</p>
                <p className="text-gray-600">{r.title}</p>
              </div>

              <div className="flex items-center gap-2">
                {r.status === "Terkumpul" && (
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                    Terkumpul
                  </span>
                )}
                {r.status === "Direview" && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium">
                    Direview
                  </span>
                )}
                {r.status === "Belum Direview" && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-medium">
                    Belum Direview
                  </span>
                )}
                <Button className="bg-red-500 hover:bg-red-600 text-white h-9 px-3 rounded-md" asChild>
                  <Link href={`/siswa/laporan/detail-laporan?title=${encodeURIComponent(r.title)}&date=${encodeURIComponent(r.weekDay)}&siswa=${encodeURIComponent(r.studentName)}&status=${encodeURIComponent(r.status)}`}>
                    Lihat Detail
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}

        {/* No results */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada laporan yang ditemukan</p>
          </div>
        )}
      </section>
    </main>
  )
}