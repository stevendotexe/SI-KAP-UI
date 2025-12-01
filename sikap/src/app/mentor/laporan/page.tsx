"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"
import { getReports, type ReportItem } from "@/lib/reports-data"

// menggunakan tipe ReportItem dari lib agar konsisten

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

function ClientList() {
  const [loading, setLoading] = React.useState(true)
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("Semua Status")
  const [date, setDate] = React.useState("Semua Tanggal")
  const [student, setStudent] = React.useState("Semua Siswa")

  const data: ReportItem[] = getReports()

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const list = data
    .filter((r) => {
      if (status === "Semua Status") return true
      if (status === "Sudah Direview") return r.status === "sudah_direview"
      if (status === "Belum Direview") return r.status === "belum_direview"
      if (status === "Belum Dikerjakan") return r.status === "belum_dikerjakan"
      return true
    })
    .filter((r) => (student === "Semua Siswa" ? true : r.student === student))
    .filter((r) => (date === "Semua Tanggal" ? true : r.date.startsWith(date)))
    .filter((r) => (q ? (r.title + r.student).toLowerCase().includes(q.toLowerCase()) : true))

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
          </SelectContent>
        </Select>

        <Select value={student} onValueChange={setStudent}>
          <SelectTrigger className="min-w-[240px] w-full sm:w-fit" aria-label="Filter Siswa">
            <SelectValue placeholder="Semua Siswa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Siswa">Semua Siswa</SelectItem>
            <SelectItem value="Alya Putri">Alya Putri</SelectItem>
            <SelectItem value="Bagus Pratama">Bagus Pratama</SelectItem>
            <SelectItem value="Citra Dewi">Citra Dewi</SelectItem>
            <SelectItem value="Dwi Santoso">Dwi Santoso</SelectItem>
            <SelectItem value="Eka Ramadhan">Eka Ramadhan</SelectItem>
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
            <SelectItem value="Belum Dikerjakan">Belum Dikerjakan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Memuat laporan...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-muted-foreground">Tidak ada laporan.</div>
      ) : (
        <div className="space-y-4">
          {list.map((r, i) => (
            <div key={i} className="bg-card border rounded-xl shadow-sm p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium">{r.student}</div>
              <div className="text-base font-semibold">{r.title}</div>
              <div className="text-sm text-muted-foreground">{r.title}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-(--radius-md) text-xs ${r.status === "sudah_direview" ? "bg-green-100 text-green-800" : r.status === "belum_direview" ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-800"}`}>{r.status === "sudah_direview" ? "Direview" : r.status === "belum_direview" ? "Belum Direview" : "Belum Dikerjakan"}</span>
                <Link href={`/mentor/siswa/${r.id}/laporan/1`}>
                  <Button variant="destructive" size="sm" className="rounded-full">{r.status === "belum_direview" ? "Review" : "Lihat Detail"}</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
