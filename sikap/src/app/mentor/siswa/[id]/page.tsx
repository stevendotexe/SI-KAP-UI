import React from "react"
import StudentDetailHeader from "@/components/students/StudentDetailHeader"
import ClientSection from "@/components/students/ClientSection"
import { type Report } from "@/components/students/StudentReportTable"
import { STUDENTS } from "@/lib/reports-data"

type SeriesPoint = { period: string; count: number }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const code = id?.toUpperCase() || "STD-001"
  const found = STUDENTS.find((s) => s.id.toUpperCase() === code)
  const name = found?.student ?? "Siswa"
  const status = found?.state ?? "Aktif"
  const sekolah = found?.school ?? "-"
  const mentor = "Ahsan"

  const reports: Report[] = [
    { week: 1, title: "Penyiapan Awal & Orientasi", description: "", date: "2025-06-20", score: 82, reviewed: true },
    { week: 2, title: "Perancangan & Implementasi Basis Data", description: "", date: "2025-06-27", score: 85, reviewed: false },
    { week: 3, title: "Pengembangan API", description: "", date: "2025-07-04", score: 84, reviewed: true },
    { week: 4, title: "Integrasi Frontend", description: "", date: "2025-07-11", score: 86, reviewed: false },
  ]

  const totalReports = reports.length
  const avgScore = Math.round(reports.reduce((s, r) => s + r.score, 0) / Math.max(1, reports.length))

  const scoreSeries: SeriesPoint[] = [
    { period: "M1", count: reports[0].score },
    { period: "M2", count: reports[1].score },
    { period: "M3", count: reports[2].score },
    { period: "M4", count: reports[3].score },
  ]

  const attendanceSeries = [
    { period: "M1", count: 20 },
    { period: "M2", count: 18 },
    { period: "M3", count: 22 },
    { period: "M4", count: 21 },
  ]

  const info = {
    email: "-",
    sekolah,
    jurusan: found?.major ?? "-",
    mulai: "15-06-2025",
    selesai: "15-12-2025",
    mesh: status,
    alamat: "-",
  }

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <StudentDetailHeader name={name} code={code} status={status} totalReports={totalReports} avgScore={avgScore} mentor={mentor} />

        <ClientSection scoreSeries={scoreSeries} attendanceSeries={attendanceSeries} reports={reports} info={info} />
      </div>
    </main>
  )
}

// no client code in this file
