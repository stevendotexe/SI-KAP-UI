"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/trpc/react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

type ReportType = "daily" | "weekly" | "monthly" | null
type ReviewStatus = "approved" | "pending" | "rejected" | null

export default function LaporanSiswaPage() {
  const [q, setQ] = useState("")
  const [selectedType, setSelectedType] = useState<ReportType>(null)
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>(null)

  // Fetch reports with tRPC
  const { data, isLoading, error } = api.reports.listMine.useQuery({
    search: q || undefined,
    status: selectedStatus ?? undefined,
    type: selectedType ?? undefined,
    limit: 50,
    offset: 0,
  })

  // Helper functions for display mapping
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "daily":
        return "Harian"
      case "weekly":
        return "Mingguan"
      case "monthly":
        return "Bulanan"
      default:
        return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          label: "Disetujui",
        }
      case "pending":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          label: "Menunggu Review",
        }
      case "rejected":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          label: "Ditolak",
        }
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          label: status,
        }
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return ""
    const d = new Date(date)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <main className="w-full max-w-none p-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-5">
      {/* Header judul + aksi */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Laporan</h1>
          <p className="text-muted-foreground">Daftar laporan Anda</p>
        </div>
      </div>

      {/* Pencarian */}
      <div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari judul laporan"
          className="w-full rounded-full bg-white border text-gray-700 placeholder:text-gray-400 h-10 px-4"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Report Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-9 bg-white border text-gray-700 hover:bg-gray-50 px-3 rounded-md">
              {selectedType ? `Tipe: ${getTypeLabel(selectedType)}` : "Semua Tipe"}{" "}
              <span className="ml-2">▾</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 rounded-xl border bg-card shadow-sm p-0">
            <div className="max-h-64 overflow-auto py-1">
              <DropdownMenuItem
                onClick={() => setSelectedType("daily")}
                className={`w-full px-3 py-2 text-left text-sm justify-start ${selectedType === "daily"
                    ? "bg-accent/50"
                    : "hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                Harian
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedType("weekly")}
                className={`w-full px-3 py-2 text-left text-sm justify-start ${selectedType === "weekly"
                    ? "bg-accent/50"
                    : "hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                Mingguan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedType("monthly")}
                className={`w-full px-3 py-2 text-left text-sm justify-start ${selectedType === "monthly"
                    ? "bg-accent/50"
                    : "hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                Bulanan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedType(null)}
                className="w-full px-3 py-2 text-left text-sm justify-start text-gray-600 hover:bg-accent hover:text-accent-foreground"
              >
                Semua Tipe
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-9 bg-white border text-gray-700 hover:bg-gray-50 px-3 rounded-md">
              {selectedStatus
                ? `Status: ${getStatusBadge(selectedStatus).label}`
                : "Semua Status"}{" "}
              <span className="ml-2">▾</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 rounded-xl border bg-card shadow-sm p-0">
            <div className="max-h-64 overflow-auto py-1">
              <DropdownMenuItem
                onClick={() => setSelectedStatus("approved")}
                className={`w-full px-3 py-2 text-left text-sm justify-start ${selectedStatus === "approved"
                    ? "bg-accent/50"
                    : "hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                Disetujui
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedStatus("pending")}
                className={`w-full px-3 py-2 text-left text-sm justify-start ${selectedStatus === "pending"
                    ? "bg-accent/50"
                    : "hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                Menunggu Review
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedStatus("rejected")}
                className={`w-full px-3 py-2 text-left text-sm justify-start ${selectedStatus === "rejected"
                    ? "bg-accent/50"
                    : "hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                Ditolak
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedStatus(null)}
                className="w-full px-3 py-2 text-left text-sm justify-start text-gray-600 hover:bg-accent hover:text-accent-foreground"
              >
                Semua Status
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List kartu laporan */}
      <section className="space-y-4">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner />
            <p className="mt-4 text-muted-foreground">Memuat laporan...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <article className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
            <p className="text-red-600 text-center">
              Gagal memuat laporan. Silakan coba lagi.
            </p>
          </article>
        )}

        {/* Empty state */}
        {!isLoading && !error && data?.items.length === 0 && (
          <article className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
            <p className="text-muted-foreground text-center">Belum ada laporan</p>
          </article>
        )}

        {/* Report cards */}
        {!isLoading &&
          !error &&
          data?.items.map((report) => {
            const badge = getStatusBadge(report.reviewStatus)
            return (
              <article
                key={report.id}
                className="rounded-2xl border bg-white shadow-sm p-4 md:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-gray-900 font-semibold">
                      {report.title ?? "Tanpa Judul"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
                        {getTypeLabel(report.type)}
                      </span>
                      {report.score !== null && (
                        <span className="text-sm text-gray-600">
                          Skor: {report.score}/100
                        </span>
                      )}
                    </div>
                    {(report.periodStart || report.periodEnd) && (
                      <p className="text-gray-600 text-sm">
                        Periode: {formatDate(report.periodStart)} -{" "}
                        {formatDate(report.periodEnd)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full ${badge.bg} ${badge.text} px-3 py-1 text-xs font-medium`}
                    >
                      {badge.label}
                    </span>
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white h-9 px-3 rounded-md"
                      asChild
                    >
                      <Link href={`/siswa/laporan/${report.id}`}>Lihat Detail</Link>
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
      </section>
    </main>
  )
}