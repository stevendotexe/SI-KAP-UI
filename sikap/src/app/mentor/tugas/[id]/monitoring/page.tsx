"use client"

import React from "react"
import { api } from "@/trpc/react"
import PieChart from "@/components/dashboard/PieChart"
import BackButton from "@/components/students/BackButton"
import { Loader2 } from "lucide-react"

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const taskId = Number(id)
  const { data, isLoading, isError, error } = api.tasks.getSubmissions.useQuery({ taskId })
  const { data: taskDetail } = api.tasks.detailForMentor.useQuery({ taskId })

  if (isLoading) {
    return (
      <main className="min-h-screen bg-muted text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className="min-h-screen bg-muted text-foreground p-8">
        <div className="text-destructive">Error: {error?.message ?? "Gagal memuat data"}</div>
        <BackButton hrefFallback="/mentor/tugas" />
      </main>
    )
  }

  const { task, submissions, stats } = data

  const pie = [
    { name: "Belum Dikerjakan", value: stats.todo + stats.inProgress + stats.rejected },
    { name: "Belum Direview", value: stats.submitted },
    { name: "Sudah Direview", value: stats.approved },
  ]

  // Filter out zero values for cleaner chart
  const pieData = pie.filter(p => p.value > 0)

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-4 py-4 md:px-6 md:py-8">
        <BackButton hrefFallback="/mentor/tugas" />
        <div className="mt-2">
          <h1 className="text-2xl font-semibold">Monitoring: {task.title}</h1>
          <p className="text-sm text-muted-foreground">Deadline: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}</p>
        </div>

        {taskDetail?.attachments && taskDetail.attachments.length > 0 && (
          <div className="bg-card border rounded-xl shadow-sm p-4 mt-4">
            <div className="text-sm font-medium mb-3">Lampiran Tugas</div>
            <div className="flex flex-wrap gap-2">
              {taskDetail.attachments.map((f) => (
                <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                  {f.filename ?? "File"}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card border rounded-xl shadow-sm p-4">
            <div className="text-sm font-medium mb-3">Ringkasan Status</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Total Siswa</span><span className="font-medium">{stats.total}</span></div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between"><span>Belum Dikerjakan</span><span>{stats.todo + stats.inProgress + stats.rejected}</span></div>
              <div className="flex justify-between"><span>Belum Direview</span><span>{stats.submitted}</span></div>
              <div className="flex justify-between"><span>Sudah Direview</span><span>{stats.approved}</span></div>
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm p-4">
            <div className="text-sm font-medium mb-3">Grafik Ringkasan</div>
            <div className="w-full h-48">
              {pieData.length > 0 ? <PieChart data={pieData} /> : <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Belum ada data</div>}
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-4 mt-6 overflow-hidden">
          <div className="text-sm font-medium mb-4">Daftar Pengumpulan</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-2 px-2">Kode</th>
                  <th className="text-left font-medium py-2 px-2">Nama Siswa</th>
                  <th className="text-left font-medium py-2 px-2">Status</th>
                  <th className="text-left font-medium py-2 px-2">Waktu Submit</th>
                  <th className="text-left font-medium py-2 px-2">File</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 px-2">{sub.studentCode}</td>
                    <td className="py-2 px-2">{sub.studentName}</td>
                    <td className="py-2 px-2">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-2 px-2">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="py-2 px-2">
                      {sub.files.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {sub.files.map(f => (
                            <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[150px] block">
                              {f.filename ?? "File"}
                            </a>
                          ))}
                        </div>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, cls: string }> = {
    todo: { label: "Belum Dikerjakan", cls: "bg-slate-100 text-slate-700 border-slate-200" },
    in_progress: { label: "Belum Dikerjakan", cls: "bg-slate-100 text-slate-700 border-slate-200" },
    submitted: { label: "Belum Direview", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    approved: { label: "Sudah Direview", cls: "bg-green-100 text-green-700 border-green-200" },
    rejected: { label: "Belum Dikerjakan", cls: "bg-red-100 text-red-700 border-red-200" },
  }
  const s = map[status] ?? { label: status, cls: "bg-gray-100" }
  return <span className={`px-2 py-0.5 rounded-full text-xs border ${s.cls}`}>{s.label}</span>
}

