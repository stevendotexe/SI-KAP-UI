import React from "react"
export const revalidate = 0
import StudentDetailHeader from "@/components/students/StudentDetailHeader"
import ClientSection from "@/components/students/ClientSection"
import { type Report, type StudentTask } from "@/components/students/StudentReportTable"
import { createTRPCContext } from "@/server/api/trpc"
import { createCaller } from "@/server/api/root"
import Link from "next/link"
import { headers } from "next/headers"

type SeriesPoint = { period: string; count: number }

// Map backend status to UI labels
function mapBackendStatusToUI(status: string | null | undefined): string {
  if (status === "active") return "Aktif"
  if (status === "completed") return "Lulus"
  if (status === "canceled") return "Non-Aktif"
  return "Aktif"
}

// Format date to YYYY-MM-DD
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toISOString().slice(0, 10)
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let studentData: Awaited<ReturnType<ReturnType<typeof createCaller>["students"]["detail"]>> | null = null
  let errorMessage: string | null = null

  try {
    const ctx = await createTRPCContext({ headers: await headers() })
    const caller = createCaller(ctx)
    studentData = await caller.students.detail({ userId: id })
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data siswa"
  }

  // Error state
  if (errorMessage || !studentData) {
    return (
      <main className="min-h-screen bg-muted text-foreground">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="bg-card border rounded-xl shadow-sm p-6 text-center">
            <div className="text-destructive font-medium mb-2">Gagal memuat data siswa</div>
            <div className="text-sm text-muted-foreground mb-4">{errorMessage ?? "Siswa tidak ditemukan"}</div>
            <Link
              href="/mentor/siswa"
              className="inline-block px-4 py-2 bg-destructive text-white rounded-lg text-sm hover:bg-destructive/90"
            >
              Kembali ke Daftar Siswa
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { profile, stats, attendance, reports: backendReports, tasks: backendTasks } = studentData

  // Map data for components
  const name = profile.name
  const code = profile.userId
  const status = mapBackendStatusToUI(profile.active ? "active" : "canceled")
  const mentor = profile.mentorName ?? "Belum ditugaskan"
  const totalReports = backendReports.length
  const avgScore = Math.round(stats.averageScore)

  // Map reports for StudentReportTable
  const reports: Report[] = backendReports.map((r, index) => ({
    id: r.id,
    week: index + 1,
    title: r.title ?? "Laporan",
    description: "",
    date: formatDate(r.submittedAt),
    score: Number(r.score ?? 0),
    reviewed: r.reviewStatus === "approved" || r.reviewStatus === "rejected",
  }))

  const tasks: StudentTask[] = (backendTasks ?? []).map((t) => ({
    id: t.id,
    title: t.title ?? "Tugas",
    date: formatDate(t.dueDate),
    status: t.status as any,
  }))

  // Create score series from backend scoreHistory (daily task scores)
  const scoreSeries: SeriesPoint[] = studentData.scoreHistory.length > 0
    ? studentData.scoreHistory
    : []

  // Create attendance series from backend attendanceHistory (daily percentage)
  const attendanceSeries: SeriesPoint[] = studentData.attendanceHistory.length > 0
    ? studentData.attendanceHistory
    : []

  // Map info object
  const info = {
    userId: profile.userId,
    name: name,
    email: profile.email,
    sekolah: profile.school ?? "-",
    jurusan: profile.major ?? profile.cohort ?? "-",
    mulai: formatDate(profile.startDate),
    selesai: formatDate(profile.endDate),
    mesh: attendance.percent >= 80 ? "Masuk" : "Kurang",
    alamat: profile.address ?? "-",
    nis: profile.nis ?? "-",
    tmplahir: profile.birthPlace ?? "-",
    tgl: formatDate(profile.birthDate),
    gender: profile.gender ?? "-",
    semester: profile.semester ? String(profile.semester) : "-",
    kelas: profile.cohort ?? "-",
    phone: profile.phone ?? "-",
  }

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <StudentDetailHeader name={name} code={code} status={status} totalReports={totalReports} avgScore={avgScore} mentor={mentor} />

        <ClientSection scoreSeries={scoreSeries} attendanceSeries={attendanceSeries} reports={reports} tasks={tasks} info={info} />
      </div>
    </main>
  )
}
