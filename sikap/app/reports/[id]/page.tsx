"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useReports } from "@/hooks/use-reports"
import { useStudents } from "@/hooks/use-students"
import { useMentors } from "@/hooks/use-mentors"

export default function ReportDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const reportId = String(params.id)
  const { reports } = useReports()
  const { students } = useStudents()
  const { mentors } = useMentors()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Defer gating to final return to keep hooks order stable

  // Resolve report + related entities from mock stores
  const report = reports.find((r) => r.id === reportId)
  const student = report ? students.find((s) => s.id === report.studentId) : undefined
  const mentor = student ? mentors.find((m) => m.id === student.mentorId) : undefined
  const displayScore = report?.status === "submitted" ? (report?.score ?? "-") : "-"

  return isLoading || !user || !report ? null : (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{report.title}</h1>
          <p className="text-muted-foreground mt-2">
            {report.week} - {report.date}
          </p>
        </div>
      </div>

      {/* Subject */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Siswa</p>
          {student ? (
            <Link href={`/students/${student.id}`} className="text-xl font-semibold hover:underline">
              {student.name}
            </Link>
          ) : (
            <span className="text-xl font-semibold">-</span>
          )}
        </div>
        <div className="h-6 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground">Mentor</p>
          {mentor ? (
            <Link href={`/mentors`} className="hover:underline">
              {mentor.name}
            </Link>
          ) : (
            <span>-</span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4 flex-wrap">
        {report.status === "submitted" ? (
          <Badge className="bg-green-100 text-green-800">Diserahkan</Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>
        )}
        <span className="text-sm text-muted-foreground">{report.status === "submitted" ? `Diserahkan pada ${report.date}` : `Jatuh tempo: ${report.date}`}</span>
        <div className="ml-auto flex items-baseline gap-3">
          <span className="text-sm text-muted-foreground">Skor</span>
          {typeof displayScore === "number" ? (
            <span className="flex items-baseline gap-1">
              <span className="text-3xl font-bold leading-none">{displayScore}</span>
              <span className="text-xs text-muted-foreground">/10</span>
            </span>
          ) : (
            <span className="text-2xl font-bold leading-none">-</span>
          )}
        </div>
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Laporan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activities */}
          <div>
            <h3 className="font-semibold mb-2">Aktivitas Minggu Ini</h3>
            <p className="text-muted-foreground">{report.activities}</p>
          </div>

          {/* Challenges */}
          <div>
            <h3 className="font-semibold mb-2">Tantangan & Solusi</h3>
            <p className="text-muted-foreground">{report.challenges}</p>
          </div>

          {/* Next Week */}
          <div>
            <h3 className="font-semibold mb-2">Rencana Minggu Depan</h3>
            <p className="text-muted-foreground">{report.nextWeek}</p>
          </div>
        </CardContent>
      </Card>

      {/* Mentor Feedback */}
      {report.feedback && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Umpan Balik Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">{report.feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/reports">
          <Button variant="outline">Kembali ke Laporan</Button>
        </Link>
      </div>
    </div>
  )
}
