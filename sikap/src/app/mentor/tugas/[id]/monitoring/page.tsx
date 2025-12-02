"use client"

import React from "react"
import { getReports, onReportsChange, type ReportItem } from "@/lib/reports-data"
import PieChart from "@/components/dashboard/PieChart"
// hapus import yang tidak dipakai
import BackButton from "@/components/students/BackButton"

export default function Page({ params }: { params: { id: string } }) {
  const [reports, setReports] = React.useState<ReportItem[]>(getReports())

  React.useEffect(() => {
    const unsub = onReportsChange((items: ReportItem[]) => setReports(items))
    return () => unsub()
  }, [])

  const taskReports = React.useMemo(() => {
    const filtered = reports.filter((r) => r.taskId === params.id)
    const uniqueMap = new Map<string, ReportItem>()
    for (const r of filtered) {
      if (!uniqueMap.has(r.id)) uniqueMap.set(r.id, r)
    }
    return Array.from(uniqueMap.values()).sort((a, b) => a.id.localeCompare(b.id))
  }, [reports, params.id])

  const stats = (() => {
    const all = taskReports
    const belumDikerjakan = all.filter((r) => r.status === "belum_dikerjakan").length
    const belumDireview = all.filter((r) => r.status === "belum_direview").length
    const sudahDireview = all.filter((r) => r.status === "sudah_direview").length
    const total = all.length || 1
    return {
      belumDikerjakan,
      belumDireview,
      sudahDireview,
      pBelumDikerjakan: Math.round((belumDikerjakan / total) * 100),
      pBelumDireview: Math.round((belumDireview / total) * 100),
      pSudahDireview: Math.round((sudahDireview / total) * 100),
    }
  })()

  const pie = [
    { name: "belum_dikerjakan", value: stats.belumDikerjakan },
    { name: "belum_direview", value: stats.belumDireview },
    { name: "sudah_direview", value: stats.sudahDireview },
  ]

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-4 py-4 md:px-6 md:py-8">
        <BackButton hrefFallback="/mentor/tugas" />
        <h1 className="text-2xl font-semibold mt-2">Monitoring Tugas</h1>
        <p className="text-sm text-muted-foreground">Ringkasan penyelesaian laporan oleh siswa</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="bg-card border rounded-xl shadow-sm p-4">
            <div className="text-sm font-medium mb-3">Ringkasan</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Belum Dikerjakan</span><span>{stats.belumDikerjakan} ({stats.pBelumDikerjakan}%)</span></div>
              <div className="flex justify-between"><span>Belum Direview</span><span>{stats.belumDireview} ({stats.pBelumDireview}%)</span></div>
              <div className="flex justify-between"><span>Sudah Direview</span><span>{stats.sudahDireview} ({stats.pSudahDireview}%)</span></div>
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm p-4">
            <div className="text-sm font-medium mb-3">Grafik Ringkasan</div>
            <div className="w-full h-48"><PieChart data={pie} /></div>
          </div>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-4 mt-6">
          <div className="grid grid-cols-3 gap-2 px-2">
            <div className="text-sm font-medium">Kode</div>
            <div className="text-sm font-medium">Nama</div>
            <div className="text-sm font-medium">Status</div>
          </div>
          <div className="mt-2 space-y-2">
            {taskReports.map((r, i) => (
              <div key={i} className="grid grid-cols-3 items-center gap-2 px-2 py-2 rounded-md">
                <div className="text-sm">{r.id}</div>
                <div className="text-sm">{r.student}</div>
                <div className="text-sm">{r.status === "sudah_direview" ? "Selesai" : r.status === "belum_direview" ? "Dalam Proses" : "Belum Mulai"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
