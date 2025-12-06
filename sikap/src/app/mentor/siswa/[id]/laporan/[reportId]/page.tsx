import React from "react"
import BackButton from "@/components/students/BackButton"
import ReportDetailClient from "@/components/students/ReportDetailClient"
import { createTRPCContext } from "@/server/api/trpc"
import { createCaller } from "@/server/api/root"
import Link from "next/link"
import { headers } from "next/headers"

// Parse content field which may be JSON or plain text
function parseContent(content: string | null | undefined): { activities: string; challenges: string; plans: string } {
  if (!content) {
    return {
      activities: "Tidak ada aktivitas",
      challenges: "Tidak ada tantangan",
      plans: "Tidak ada rencana",
    }
  }

  try {
    const parsed = JSON.parse(content) as { activities?: string; challenges?: string; plans?: string }
    return {
      activities: parsed.activities ?? "Tidak ada aktivitas",
      challenges: parsed.challenges ?? "Tidak ada tantangan",
      plans: parsed.plans ?? "Tidak ada rencana",
    }
  } catch {
    // If not valid JSON, treat as plain text activities
    return {
      activities: content,
      challenges: "Tidak ada tantangan",
      plans: "Tidak ada rencana",
    }
  }
}

// Format date to YYYY-MM-DD
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toISOString().slice(0, 10)
}

export default async function Page({ params }: { params: Promise<{ id: string; reportId: string }> }) {
  const { id, reportId } = await params
  const reportIdNum = Number(reportId)

  // Validate reportId
  if (isNaN(reportIdNum)) {
    return (
      <main className="min-h-screen bg-muted text-foreground">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="bg-card border rounded-xl shadow-sm p-6 text-center">
            <div className="text-destructive font-medium mb-2">ID Laporan Tidak Valid</div>
            <div className="text-sm text-muted-foreground mb-4">Format ID laporan tidak sesuai</div>
            <Link
              href={`/mentor/siswa/${id}`}
              className="inline-block px-4 py-2 bg-destructive text-white rounded-lg text-sm hover:bg-destructive/90"
            >
              Kembali ke Detail Siswa
            </Link>
          </div>
        </div>
      </main>
    )
  }

  let reportData: Awaited<ReturnType<ReturnType<typeof createCaller>["students"]["reportDetail"]>> | null = null
  let studentName = "Siswa"
  let errorMessage: string | null = null

  try {
    const ctx = await createTRPCContext({ headers: await headers() })
    const caller = createCaller(ctx)

    // Fetch report detail
    reportData = await caller.students.reportDetail({ reportId: reportIdNum })

    // Try to fetch student name from student detail
    try {
      const studentData = await caller.students.detail({ userId: id })
      studentName = studentData.profile.name
    } catch {
      // Fallback to ID if student fetch fails
      studentName = id
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat laporan"
  }

  // Error state
  if (errorMessage || !reportData) {
    return (
      <main className="min-h-screen bg-muted text-foreground">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="bg-card border rounded-xl shadow-sm p-6 text-center">
            <div className="text-destructive font-medium mb-2">Gagal memuat laporan</div>
            <div className="text-sm text-muted-foreground mb-4">{errorMessage ?? "Laporan tidak ditemukan"}</div>
            <Link
              href={`/mentor/siswa/${id}`}
              className="inline-block px-4 py-2 bg-destructive text-white rounded-lg text-sm hover:bg-destructive/90"
            >
              Kembali ke Detail Siswa
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Map report data
  const title = reportData.title ?? "Laporan"
  const date = formatDate(reportData.submittedAt ?? reportData.periodEnd)
  const mentorName = reportData.mentor.name ?? "Mentor"
  const reviewed = reportData.reviewStatus === "approved" || reportData.reviewStatus === "rejected"
  const score = reportData.score ?? undefined
  const { activities, challenges, plans } = parseContent(reportData.content)

  // Calculate week number from period dates (fallback to 1)
  const week = reportData.periodStart
    ? Math.ceil((new Date(reportData.periodStart).getTime() - new Date("2025-01-01").getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    : 1

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="bg-card border rounded-xl shadow-sm p-6">
          <div className="mb-4"><BackButton hrefFallback={`/mentor/siswa/${id}`} /></div>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xl font-semibold">{title}</div>
              <div className="text-sm text-muted-foreground">Minggu {week} • {date}</div>
              <div className="mt-4">
                <div className="text-sm">Mentor</div>
                <div className="text-lg font-semibold">{mentorName}</div>
                <div className="mt-2 inline-flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-(--radius-md) text-xs ${reviewed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {reviewed ? "Direview" : "Diserahkan"}
                  </span>
                  <span className="text-xs text-muted-foreground">Diserahkan pada {date}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">Siswa</div>
              <div className="text-lg font-semibold">{studentName}</div>
              {reviewed && score != null && (
                <div className="mt-2 text-right"><span className="text-2xl font-semibold">{score}</span><span className="text-sm text-muted-foreground">/100</span></div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-secondary rounded-xl p-4 border">
            <div className="text-sm font-medium mb-2">Detail Laporan</div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Aktivitas Minggu Ini</div>
                <div className="text-muted-foreground">{activities}</div>
              </div>
              <div>
                <div className="font-medium">Tantangan & Solusi</div>
                <div className="text-muted-foreground">{challenges}</div>
              </div>
              <div>
                <div className="font-medium">Rencana Minggu Depan</div>
                <div className="text-muted-foreground">{plans}</div>
              </div>
            </div>
          </div>

          {reviewed && (
            <div className="mt-6 bg-secondary rounded-xl p-4 border">
              <div className="text-sm font-medium mb-2">Umpan Balik Mentor</div>
              <div className="text-muted-foreground text-sm">
                {reportData.reviewStatus === "approved"
                  ? "Laporan telah disetujui oleh mentor."
                  : reportData.reviewStatus === "rejected"
                    ? "Laporan memerlukan revisi."
                    : "Menunggu review dari mentor."}
              </div>
            </div>
          )}

          <ReportDetailClient id={id} reportId={reportIdNum} reviewed={reviewed} />
        </div>
      </div>
    </main>
  )
}





