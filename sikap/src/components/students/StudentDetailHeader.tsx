import React from "react"
import BackButton from "@/components/students/BackButton"

type Props = {
  name: string
  code: string
  status: string
  totalReports: number
  avgScore: number
  mentor: string
}

export default function StudentDetailHeader({ name, code, status, totalReports, avgScore, mentor }: Props) {
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <BackButton hrefFallback="/mentor/siswa" />
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{code}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl shadow-sm p-4">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="text-2xl font-semibold">{status}</div>
        </div>
        <div className="bg-card border rounded-xl shadow-sm p-4">
          <div className="text-xs text-muted-foreground">Laporan</div>
          <div className="text-2xl font-semibold">{totalReports}</div>
        </div>
        <div className="bg-card border rounded-xl shadow-sm p-4">
          <div className="text-xs text-muted-foreground">Skor Rata-Rata</div>
          <div className="text-2xl font-semibold">{avgScore}</div>
        </div>
        <div className="bg-card border rounded-xl shadow-sm p-4">
          <div className="text-xs text-muted-foreground">Mentor</div>
          <div className="text-2xl font-semibold">{mentor}</div>
        </div>
      </div>
    </header>
  )
}
