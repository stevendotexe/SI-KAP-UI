"use client"

/**
 * TODO: Backend Integration Required
 * 
 * This page requires the following mentor/admin procedures in the tasks router:
 * 
 * 1. api.tasks.list (adminOrMentorProcedure)
 *    - Parameters: { companyId: number, search?: string, status?: taskStatus, from?: Date, to?: Date, limit?: number, offset?: number }
 *    - Returns: { items: Array<{ id, title, description, dueDate, status, targetMajor, createdAt, assignedCount, submittedCount }>, pagination, lastUpdated }
 *    - Purpose: List all tasks for the mentor's company with filters
 * 
 * 2. api.tasks.create (adminOrMentorProcedure)
 *    - Parameters: { title: string, description: string, dueDate: Date, targetMajor?: string, placementIds: number[], attachments?: Array<{ url, filename }> }
 *    - Returns: { id: number }
 *    - Purpose: Create new task and assign to multiple students
 * 
 * 3. api.tasks.update (adminOrMentorProcedure)
 *    - Parameters: { taskId: number, title?: string, description?: string, dueDate?: Date, targetMajor?: string }
 *    - Returns: { ok: true }
 *    - Purpose: Update task details
 * 
 * 4. api.tasks.delete (adminOrMentorProcedure)
 *    - Parameters: { taskId: number }
 *    - Returns: { ok: true }
 *    - Purpose: Delete task
 * 
 * Current State: Using local state with seed data as fallback until backend is ready.
 */

import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/trpc/react"
import AddTaskDialog, { type TaskItem } from "@/components/tasks/AddTaskDialog"
import TaskCard from "@/components/tasks/TaskCard"

export default function Page() {
  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-4 py-4 md:px-6 md:py-8">
        <TaskClient />
      </div>
    </main>
  )
}

function TaskClient() {
  const [q, setQ] = React.useState("")
  const [date, setDate] = React.useState("Semua Tanggal")

  const range = React.useMemo(() => {
    if (date === "Semua Tanggal") return {}
    const [year, month] = date.split("-").map(Number)
    if (!year || !month) return {}
    const from = new Date(year, month - 1, 1)
    const to = new Date(year, month, 0)
    to.setHours(23,59,59,999)
    return { from, to }
  }, [date])

  const { data: tasksData, isLoading, isError, error, refetch } = api.tasks.list.useQuery({
    search: q || undefined,
    from: range.from,
    to: range.to,
    limit: 100,
  })

  const tasks: TaskItem[] = tasksData?.items.map((t) => ({
    id: t.id.toString(),
    titleMain: t.title,
    titleSub: t.targetMajor ?? "Umum",
    description: t.description,
    date: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "",
    assignedCount: t.assignedCount,
    submittedCount: t.submittedCount,
  })) ?? []

  const filtered = tasks
    .filter((t) => (date === "Semua Tanggal" ? true : t.date.startsWith(date)))

  function onAdd() {
    refetch()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tugas</h1>
          <p className="text-sm text-muted-foreground">Kelola tugas untuk siswa</p>
        </div>
        {/* Pastikan tombol selalu terlihat */}
        <div className="shrink-0 z-10">
          <AddTaskDialog onAdd={onAdd} />
        </div>
      </div>

      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari Judul/Deskripsi Tugas" className="h-10" />

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

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Memuat tugas...</div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2">
            <div className="text-sm text-destructive">Gagal memuat tugas.</div>
            <button className="px-3 py-1 rounded-(--radius-sm) border" onClick={() => refetch()}>Coba Lagi</button>
            <div className="text-xs text-muted-foreground">{error?.message}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">Tidak ada tugas.</div>
        ) : (
          filtered.map((t) => <TaskCard key={t.id} t={t} />)
        )}
      </div>
    </div>
  )
}
