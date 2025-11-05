"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Search } from "lucide-react"
import { useAttendance } from "@/hooks/use-attendance"
import { useStudents } from "@/hooks/use-students"
import Link from "next/link"

export default function AttendancePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { records } = useAttendance()
  const { students } = useStudents()

  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Keep hooks order stable
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Fixed totals per request
  const TOTAL_STUDENTS = 156
  const PRESENT_TODAY = 152
  const ABSENT_TODAY = TOTAL_STUDENTS - PRESENT_TODAY // 4
  const PERCENT_TODAY_DISPLAY = 92

  // Group history by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, { present: number }>()
    records.forEach((r) => {
      const prev = map.get(r.date) || { present: 0 }
      if (r.status === "present") prev.present += 1
      map.set(r.date, prev)
    })
    // Convert to array sorted desc by date
    return Array.from(map.entries())
      .map(([date, { present }]) => ({ date, present, absent: Math.max(TOTAL_STUDENTS - present, 0) }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [records, TOTAL_STUDENTS])

  const studentByName = useMemo(() => new Map(students.map((s) => [s.name, s])), [students])

  const filteredHistory = useMemo(() => {
    const q = searchTerm.trim()
    if (!q) return groupedByDate
    return groupedByDate.filter((row) => row.date.includes(q))
  }, [groupedByDate, searchTerm])

  return isLoading || !user ? null : (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kehadiran</h1>
          <p className="text-muted-foreground mt-2">Ringkasan kehadiran dan riwayat</p>
        </div>
      </div>

      {/* Today Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Ringkasan Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold">{PRESENT_TODAY}</div>
              <p className="text-xs text-muted-foreground">siswa hadir dari total {TOTAL_STUDENTS}</p>
              <p className="text-xs text-muted-foreground">{ABSENT_TODAY} tidak hadir</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Tanggal</p>
              <p className="text-sm font-medium">{today}</p>
              <p className="text-xs text-muted-foreground">Kehadiran: {PERCENT_TODAY_DISPLAY}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Absent Students Today */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Siswa Tidak Hadir ({ABSENT_TODAY})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            {[
              "Andi Saputra",
              "Budi Santoso",
              "Citra Lestari",
              "Dedi Pratama",
            ].map((name) => {
              const match = studentByName.get(name)
              const href = match ? `/students/${match.id}` : `/students?search=${encodeURIComponent(name)}`
              return (
                <li key={name} className="text-sm">
                  <Link href={href} className="text-primary hover:underline">
                    {name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* History Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan tanggal (YYYY-MM-DD)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* History Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium">Hadir</th>
                  <th className="text-left py-3 px-4 font-medium">Tidak Hadir</th>
                  <th className="text-left py-3 px-4 font-medium">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((row) => {
                    const pct = TOTAL_STUDENTS > 0 ? Math.round((row.present / TOTAL_STUDENTS) * 100) : 0
                    return (
                      <tr key={row.date} className="border-b">
                        <td className="py-3 px-4">{row.date}</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-green-100 text-green-800">{row.present} hadir</Badge>
                        </td>
                        <td className="py-3 px-4">{row.absent}</td>
                        <td className="py-3 px-4">{pct}%</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      Tidak ada riwayat
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


