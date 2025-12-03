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

export default function StudentReportTable({ reports, reviewed, onReviewedChange }: { reports: Report[]; reviewed: "belum" | "sudah" | "belum_dikerjakan"; onReviewedChange: (r: "belum" | "sudah" | "belum_dikerjakan") => void }) {
  const list = reviewed === "belum_dikerjakan" ? [] : reports.filter((r) => (reviewed === "sudah" ? r.reviewed : !r.reviewed))
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
        {list.map((r, i) => (
          <div
            key={i}
            className="rounded-xl border p-4 shadow-xs flex items-center gap-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-sm"
          >
            <div className="flex-1">
              <div className="text-base font-semibold">{r.title}</div>
              <div className="text-sm text-muted-foreground">Tugas/Laporan</div>
              <div className="text-xs text-muted-foreground mt-1">{r.date}</div>
            </div>
            <div className="text-2xl font-semibold">{r.score}</div>
            <Link href={`/mentor/siswa/${params?.id ?? "STD-001"}/laporan/${r.id}`}>
              <Button variant="destructive" size="sm" className="rounded-full px-4">Lihat Detail</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { Report }
