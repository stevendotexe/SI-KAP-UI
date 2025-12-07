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
  const [selectedType, setSelectedType] = useState<ReportType | "task">(null)
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>(null)

  // Fetch reports with tRPC
  const { data: reportsData, isLoading: isLoadingReports, error: errorReports } = api.reports.listMine.useQuery({
    search: q || undefined,
    status: selectedStatus ?? undefined,
    type: selectedType === "task" ? undefined : (selectedType as any ?? undefined),
    limit: 50,
    offset: 0,
  })

  // Fetch submitted/approved tasks
  const { data: tasksData, isLoading: isLoadingTasks, error: errorTasks } = api.tasks.listAssigned.useQuery({
    search: q || undefined,
    statuses: ["submitted", "approved"],
    limit: 50,
    offset: 0,
  }, {
    enabled: !selectedType || selectedType === "task",
  })

  const isLoading = isLoadingReports || isLoadingTasks
  const error = errorReports || errorTasks

  // Merge and sort data
  const mergedItems = [
    ...(reportsData?.items.map(r => ({ ...r, itemType: "report" as const })) ?? []),
    ...(tasksData?.items.filter(t => t.status === "submitted" || t.status === "approved").map(t => ({
      id: t.id,
      title: t.title,
      type: "task",
      score: null,
      periodStart: null,
      periodEnd: null,
      reviewStatus: t.status === "submitted" ? "pending" : t.status, // Map task status to report review status
      itemType: "task" as const,
      submittedAt: t.submittedAt,
      originalStatus: t.status
    })) ?? [])
  ].sort((a, b) => {
    // Sort logic could be improved based on dates if available
    return 0
  })

  // Filter merged items based on client-side filters if needed (e.g. if API filters don't cover everything perfectly)
  const filteredItems = mergedItems.filter(item => {
    if (selectedType && selectedType !== item.type && !(selectedType === "task" && item.itemType === "task")) return false
    if (selectedStatus) {
      if (item.reviewStatus !== selectedStatus) return false
    }
    return true
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
      case "task":
        return "Tugas"
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
      case "submitted":
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

  const formatSubmissionDate = (date: Date | string | null) => {
    if (!date) return ""
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const hours = d.getHours().toString().padStart(2, '0')
    const mins = d.getMinutes().toString().padStart(2, '0')
    return `${day}/${month} ${hours}:${mins}`
  }

  return (
    <main className="w-full max-w-none p-5 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-5">
      {/* Header judul + aksi */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Laporan & Tugas</h1>
          <p className="text-muted-foreground">Daftar laporan dan tugas yang diserahkan</p>
        </div>
      </div>

      {/* Pencarian */}
      <div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari judul laporan atau tugas"
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
                onClick={() => setSelectedType("task")}
                className={`w-full px-3 py-2 text-left text-sm justify-start ${selectedType === "task"
                  ? "bg-accent/50"
                  : "hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                Tugas
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
            <p className="mt-4 text-muted-foreground">Memuat data...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <article className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
            <p className="text-red-600 text-center">
              Gagal memuat data. Silakan coba lagi.
            </p>
          </article>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredItems.length === 0 && (
          <article className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
            <p className="text-muted-foreground text-center">Belum ada laporan atau tugas</p>
          </article>
        )}

        {/* Report/Task cards */}
        {!isLoading &&
          !error &&
          filteredItems.map((item) => {
            const badge = getStatusBadge(item.reviewStatus ?? "")
            const isTask = item.itemType === "task"
            const detailLink = isTask ? `/siswa/tugas/${item.id}` : `/siswa/laporan/${item.id}`

            return (
              <article
                key={`${item.itemType}-${item.id}`}
                className="rounded-2xl border bg-white shadow-sm p-4 md:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-gray-900 font-semibold">
                      {item.title ?? "Tanpa Judul"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isTask ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}>
                        {isTask
                          ? ((item as any).submittedAt
                            ? `Diserahkan ${formatSubmissionDate((item as any).submittedAt)}`
                            : "Diserahkan")
                          : getTypeLabel(item.type)}
                      </span>
                      {item.score !== null && (
                        <span className="text-sm text-gray-600">
                          Skor: {item.score}/100
                        </span>
                      )}
                    </div>
                    {(item.periodStart || item.periodEnd) && (
                      <p className="text-gray-600 text-sm">
                        Periode: {formatDate(item.periodStart)} -{" "}
                        {formatDate(item.periodEnd)}
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
                      <Link href={detailLink}>Lihat Detail</Link>
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
      </section >
    </main >
  )
}