"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Search } from "lucide-react"
import Link from "next/link"
import { useReports } from "@/hooks/use-reports"
import { useStudents } from "@/hooks/use-students"
import { useMentors } from "@/hooks/use-mentors"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

export default function ReportsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all")
  const [selectedMentorId, setSelectedMentorId] = useState<string>("all")
  const { reports } = useReports()
  const { students } = useStudents()
  const { mentors } = useMentors()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Keep hooks order stable; defer gating to the returned JSX

  const mentorIdToStudentIds = useMemo(() => {
    const map = new Map<string, string[]>()
    students.forEach((s) => {
      if (!map.has(s.mentorId)) map.set(s.mentorId, [])
      map.get(s.mentorId)!.push(s.id)
    })
    return map
  }, [students])

  const reportsWithStudent = useMemo(() => {
    const studentById = new Map(students.map((s) => [s.id, s]))
    return reports.map((r) => ({
      ...r,
      author: studentById.get(r.studentId)?.name,
      week: r.week,
    }))
  }, [reports, students])

  const filteredReports = useMemo(() => {
    const q = searchTerm.toLowerCase()
    const selectedMentor = selectedMentorId !== "all" ? selectedMentorId : null
    const selectedStudent = selectedStudentId !== "all" ? selectedStudentId : null

    return reportsWithStudent.filter((report) => {
      const matchesQuery =
        report.title.toLowerCase().includes(q) || report.week.toLowerCase().includes(q)

      const matchesStudent = selectedStudent ? report.studentId === selectedStudent : true

      const matchesMentor = selectedMentor
        ? (mentorIdToStudentIds.get(selectedMentor) || []).includes(report.studentId)
        : true

      return matchesQuery && matchesStudent && matchesMentor
    })
  }, [reportsWithStudent, searchTerm, selectedMentorId, selectedStudentId, mentorIdToStudentIds])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-100 text-green-800">Submitted</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return null
    }
  }

  return isLoading || !user ? null : (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground mt-2">
            {user.role === "student" ? "Your weekly reports" : "Semua laporan  yang disubmit"}
          </p>
        </div>
        {user.role === "student" && (
          <Link href="/reports/new">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </Link>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {user.role === "admin" && (
          <div className="flex gap-2 md:justify-end">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="bg-black text-white border-black hover:bg-black/90 shadow-sm [&_svg]:text-white">
                <SelectValue placeholder="Pilih Siswa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Siswa</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
              <SelectTrigger className="bg-black text-white border-black hover:bg-black/90 shadow-sm [&_svg]:text-white">
                <SelectValue placeholder="Pilih Mentor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mentor</SelectItem>
                {mentors.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Reports List */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{report.week}</p>
                    <p className="text-sm text-muted-foreground">{report.title}</p>
                    {user.role === "admin" && report.author && (
                      <p className="text-xs text-muted-foreground mt-1">Siswa: {report.author}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{report.date}</span>
                    {getStatusBadge(report.status)}
                    <Link href={`/reports/${report.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Tidak ada laporan yang ditemukan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
