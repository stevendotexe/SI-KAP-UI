"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export default function LaporanSiswaPage() {
  const [q, setQ] = useState("")
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<"Terkumpul" | "Direview" | "Belum Direview" | null>(null)

  // gunakan Array.from agar lebih jelas dan bebas lint
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

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

      {/* Pencarian */}
      <div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari judul laporan atau nama siswa"
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

      {/* List kartu laporan */}
      <section className="space-y-4">
        {/* Kartu 1 */}
        <article className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-gray-900 font-semibold">Rafif Zharif</p>
              <p className="text-gray-900 font-semibold">Minggu 1, Senin</p>
              <p className="text-gray-600">Penyiapan Awal &amp; Orientasi</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                Terkumpul
              </span>
              <Button className="bg-red-500 hover:bg-red-600 text-white h-9 px-3 rounded-md" asChild>
                <Link href="/siswa/laporan/detail-laporan">Lihat Detail</Link>
              </Button>
            </div>
          </div>
        </article>

        {/* Kartu 2 */}
        <article className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-gray-900 font-semibold">Rafif Zharif</p>
              <p className="text-gray-900 font-semibold">Minggu 2, selasa</p>
              <p className="text-gray-600">Perancangan &amp; Implementasi Basis Data</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium">
                Direview
              </span>
              <Button className="bg-red-500 hover:bg-red-600 text-white h-9 px-3 rounded-md" asChild>
                <Link href="/siswa/laporan/detail-laporan">Lihat Detail</Link>
              </Button>
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}