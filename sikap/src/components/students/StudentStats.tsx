import React from "react"
import AttendanceLine from "@/components/students/AttendanceLine"

type Point = { period: string; count: number }

export default function StudentStats({ scores, attendanceSeries }: { scores: Point[]; attendanceSeries: Point[] }) {
  const avgScore = Math.round(scores.reduce((s, p) => s + p.count, 0) / Math.max(1, scores.length))
  const minScore = Math.min(...scores.map((p) => p.count))
  const maxScore = Math.max(...scores.map((p) => p.count))

  const totalAttend = attendanceSeries.reduce((s, a) => s + a.count, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card border rounded-xl shadow-sm p-6">
        <div className="text-sm font-medium">Perkembangan Skor Siswa</div>
        <div className="text-xs text-muted-foreground">Rata-rata {avgScore}</div>
        <div className="mt-2">
          <AttendanceLine data={scores} />
        </div>
        <div className="text-xs text-muted-foreground mt-2">Tertinggi {maxScore} • Terendah {minScore}</div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-6">
        <div className="text-sm font-medium">Perkembangan Kehadiran Siswa</div>
        <div className="mt-2">
          <AttendanceLine data={attendanceSeries} />
        </div>
        <div className="text-xs text-muted-foreground mt-2">Total per periode: {totalAttend}</div>
      </div>
    </div>
  )
}
