"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams } from "next/navigation"

type Report = {
  id: number
  week: number
  title: string
  description: string
  date: string
  score: number
  reviewed: boolean
}

type StudentTask = {
  id: number
  title: string
  date: string
  status: "todo" | "in_progress" | "submitted" | "approved" | "rejected"
}

export default function StudentReportTable({ reports, tasks = [], reviewed, onReviewedChange }: { reports: Report[]; tasks?: StudentTask[]; reviewed: "belum" | "sudah" | "belum_dikerjakan"; onReviewedChange: (r: "belum" | "sudah" | "belum_dikerjakan") => void }) {
  const list = React.useMemo(() => {
    if (reviewed === "belum_dikerjakan") {
      return tasks
        .filter((t) => t.status === "todo" || t.status === "in_progress")
        .map((t) => ({ type: "task" as const, id: t.id, title: t.title, date: t.date, status: t.status }))
    }
    const reportItems = (reviewed === "sudah" ? reports.filter((r) => r.reviewed) : reports.filter((r) => !r.reviewed))
      .map((r) => ({ type: "report" as const, id: r.id, title: r.title, date: r.date, score: r.score }))
    const taskItems = (reviewed === "sudah"
      ? tasks.filter((t) => t.status === "approved" || t.status === "rejected")
      : tasks.filter((t) => t.status === "submitted"))
      .map((t) => ({ type: "task" as const, id: t.id, title: t.title, date: t.date, status: t.status }))
    return [...reportItems, ...taskItems]
  }, [reports, tasks, reviewed])
  const params = useParams<{ id?: string }>()
  return (
    <div className="bg-card border rounded-xl shadow-sm p-4">
      <div className="mb-3">
        <div className="text-sm font-medium mb-2">Laporan dan Tugas</div>
        <div className="inline-flex rounded-(--radius-md) bg-secondary p-1 shadow-xs">
          <button
            className={`rounded-(--radius-md) px-3 py-1.5 text-sm ${reviewed === "belum" ? "bg-destructive text-white" : "hover:bg-accent"}`}
            aria-pressed={reviewed === "belum"}
            onClick={() => onReviewedChange("belum")}
          >
            Belum Direview
          </button>
          <button
            className={`rounded-(--radius-md) px-3 py-1.5 text-sm ${reviewed === "sudah" ? "bg-destructive text-white" : "hover:bg-accent"}`}
            aria-pressed={reviewed === "sudah"}
            onClick={() => onReviewedChange("sudah")}
          >
            Sudah Direview
          </button>
          <button
            className={`rounded-(--radius-md) px-3 py-1.5 text-sm ${reviewed === "belum_dikerjakan" ? "bg-destructive text-white" : "hover:bg-accent"}`}
            aria-pressed={reviewed === "belum_dikerjakan"}
            onClick={() => onReviewedChange("belum_dikerjakan")}
          >
            Belum Dikerjakan
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {list.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border p-4 shadow-xs flex items-center gap-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-sm"
          >
            <div className="flex-1">
              <div className="text-base font-semibold">{item.title}</div>
              <div className="text-sm text-muted-foreground">{item.type === "task" ? "Tugas" : "Laporan"}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.date}</div>
            </div>
            {item.type === "report" ? (
              <div className="text-2xl font-semibold">{item.score ?? 0}</div>
            ) : (
              <span className={`px-2 py-1 rounded-(--radius-md) text-xs ${
                item.status === "submitted" ? "bg-yellow-100 text-yellow-800" :
                item.status === "approved" ? "bg-green-100 text-green-800" :
                item.status === "rejected" ? "bg-red-100 text-red-800" : "bg-muted text-muted-foreground"
              }`}>
                {item.status === "submitted" ? "Menunggu Review" : item.status === "approved" ? "Disetujui" : item.status === "rejected" ? "Ditolak" : "Belum Dikerjakan"}
              </span>
            )}
            {item.type === "report" ? (
              <Link href={`/mentor/siswa/${params?.id ?? "STD-001"}/laporan/${item.id}`}>
                <Button variant="destructive" size="sm" className="rounded-full px-4">Lihat Detail</Button>
              </Link>
            ) : (
              <Link href={`/mentor/tugas/${item.id}/monitoring`}>
                <Button variant="destructive" size="sm" className="rounded-full px-4">Monitoring</Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export type { Report, StudentTask }
