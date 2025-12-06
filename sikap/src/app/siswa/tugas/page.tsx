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
import { getTaskStatusBadgeConfig } from "@/components/tasks/task-status-badge"

type TaskStatus = "todo" | "in_progress" | "submitted" | "approved" | "rejected" | null

export default function DaftarTugasSiswaPage() {
  const [q, setQ] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(null)

  // Fetch tasks with tRPC
  const { data, isLoading, error } = api.tasks.listAssigned.useQuery({
    search: q || undefined,
    status: selectedStatus ?? undefined,
    excludeStatuses: ["submitted", "approved"],
    limit: 50,
    offset: 0,
  })

  // Helper function to format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Tidak ditentukan"
    const d = new Date(date)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 m-0">
        <main className="space-y-6 p-5 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-semibold">Daftar Tugas</h1>
              <p className="text-muted-foreground">
                Tugas yang diberikan Mentor kepada Anda
              </p>
            </div>
          </div>

          {/* Search */}
          <div>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari judul atau deskripsi tugas"
              className="w-full rounded-full bg-white border text-gray-700 placeholder:text-gray-400 h-10 px-4"
            />
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-9 bg-white border text-gray-700 hover:bg-gray-50 px-3 rounded-md">
                  {selectedStatus
                    ? `Status: ${getTaskStatusBadgeConfig(selectedStatus).label}`
                    : "Semua Status"}{" "}
                  <span className="ml-2">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl border bg-card shadow-sm p-0">
                <div className="max-h-64 overflow-auto py-1">
                  <DropdownMenuItem
                    onClick={() => setSelectedStatus("todo")}
                    className={`w-full px-3 py-2 text-left text-sm justify-start ${selectedStatus === "todo"
                        ? "bg-accent/50"
                        : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                  >
                    Belum Dikerjakan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedStatus("in_progress")}
                    className={`w-full px-3 py-2 text-left text-sm justify-start ${selectedStatus === "in_progress"
                        ? "bg-accent/50"
                        : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                  >
                    Sedang Dikerjakan
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

          {/* Cards */}
          <section className="space-y-6">
            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner />
                <p className="mt-4 text-muted-foreground">Memuat daftar tugas...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <article className="rounded-2xl border bg-card shadow-sm p-4 md:p-6">
                <p className="text-red-600 text-center">
                  Gagal memuat daftar tugas. Silakan coba lagi.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => history.back()}
                    className="h-9 px-4"
                  >
                    Kembali
                  </Button>
                </div>
              </article>
            )}

            {/* Empty state */}
            {!isLoading && !error && data?.items.length === 0 && (
              <article className="rounded-2xl border bg-card shadow-sm p-4 md:p-6">
                <p className="text-muted-foreground text-center">Belum ada tugas</p>
              </article>
            )}

            {/* Task cards */}
            {!isLoading &&
              !error &&
              data?.items.map((task) => {
                const badge = getTaskStatusBadgeConfig(task.status)
                return (
                  <article
                    key={task.id}
                    className="rounded-2xl border bg-card shadow-sm p-5 md:p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{task.title}</p>
                          <span
                            className={`inline-flex items-center rounded-full ${badge.bg} ${badge.text} px-2 py-0.5 text-xs font-medium`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-muted-foreground">{task.description}</p>
                        )}
                        <p className="text-destructive font-semibold">
                          Tenggat waktu : {formatDate(task.dueDate)}
                        </p>
                      </div>

                      <div className="flex items-center">
                        <Button variant="destructive" className="h-9 px-4" asChild>
                          <Link href={`/siswa/tugas/${task.id}`}>Lihat Detail</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
          </section>
        </main>
      </div>
    </div>
  )
}
