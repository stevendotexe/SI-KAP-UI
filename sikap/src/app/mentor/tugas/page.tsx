"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AddTaskDialog, { type TaskItem } from "@/components/tasks/AddTaskDialog"
import TaskCard from "@/components/tasks/TaskCard"
import { distributeTaskToStudents } from "@/lib/reports-data"

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
  const [tasks, setTasks] = React.useState<TaskItem[]>([
    { id: "seed-impl", titleMain: "Implementasi API", titleSub: "Endpoint Auth", description: "Bangun endpoint login dan refresh token", date: "2025-06-21" },
    { id: "seed-db", titleMain: "Perancangan Basis Data", titleSub: "Skema Siswa", description: "Rancang tabel siswa dan relasi", date: "2025-06-25" },
    { id: "seed-fe", titleMain: "Integrasi Frontend", titleSub: "Form Laporan", description: "Integrasikan form laporan dengan API", date: "2025-07-02" },
  ])

  const filtered = tasks
    .filter((t) => (date === "Semua Tanggal" ? true : t.date.startsWith(date)))
    .filter((t) => (q ? (t.titleMain + t.titleSub + t.description).toLowerCase().includes(q.toLowerCase()) : true))

  function onAdd(t: TaskItem) {
    setTasks((prev) => [...prev, t])
    distributeTaskToStudents(t.id, t.titleMain, t.date)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tugas</h1>
          <p className="text-sm text-muted-foreground">Kelola tugas untuk siswa</p>
        </div>
        <AddTaskDialog onAdd={onAdd} />
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
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">Tidak ada tugas.</div>
        ) : (
          filtered.map((t) => <TaskCard key={t.id} t={t} />)
        )}
      </div>
    </div>
  )
}
