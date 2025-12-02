"use client"

import React from "react"
import StudentFilterTabs from "@/components/students/StudentFilterTabs"
import StudentStats from "@/components/students/StudentStats"
import StudentReportTable, { type Report } from "@/components/students/StudentReportTable"
import StudentInfo from "@/components/students/StudentInfo"

type SeriesPoint = { period: string; count: number }
type Info = { email: string; sekolah: string; jurusan?: string; mulai: string; selesai: string; mesh: string; alamat: string }

export default function ClientSection({ scoreSeries, attendanceSeries, reports, info }: { scoreSeries: SeriesPoint[]; attendanceSeries: SeriesPoint[]; reports: Report[]; info: Info }) {
  const [mode, setMode] = React.useState<"laporan" | "informasi">("laporan")
  const [reviewed, setReviewed] = React.useState<"belum" | "sudah">("sudah")

  return (
    <div className="space-y-6">
      <StudentStats scores={scoreSeries} attendanceSeries={attendanceSeries} />

      <div className="flex justify-start">
        <StudentFilterTabs mode={mode} onModeChange={setMode} />
      </div>

      {mode === "laporan" ? (
        <StudentReportTable reports={reports} reviewed={reviewed} onReviewedChange={setReviewed} />
      ) : (
        <StudentInfo info={info} />
      )}
    </div>
  )
}
