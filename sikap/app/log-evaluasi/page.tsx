"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Star, Search } from "lucide-react"

export default function LogEvaluasiPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDate, setFilterDate] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  const allEvaluations = [
    {
      id: 1,
      studentName: "Ahmad Rizki",
      studentId: "STU-001",
      taskName: "Setup Database",
      date: "2024-01-15",
      score: 8.5,
      feedback: "Progres yang bagus pada desain database. Teruskan kerja keras Anda!",
    },
    {
      id: 2,
      studentName: "Siti Nurhaliza",
      studentId: "STU-002",
      taskName: "Development API",
      date: "2024-01-16",
      score: 9.0,
      feedback: "Pekerjaan yang sangat bagus pada implementasi API.",
    },
    {
      id: 3,
      studentName: "Budi Santoso",
      studentId: "STU-003",
      taskName: "Testing",
      date: "2024-01-17",
      score: 7.8,
      feedback: "Perlu ditingkatkan pada dokumentasi.",
    },
    {
      id: 4,
      studentName: "Ahmad Rizki",
      studentId: "STU-001",
      taskName: "Development API",
      date: "2024-01-18",
      score: 8.7,
      feedback: "Implementasi REST endpoints yang sangat bagus.",
    },
  ]

  const filteredEvaluations = allEvaluations.filter((evaluation) => {
    const matchSearch =
      evaluation.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.studentId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchDate = !filterDate || evaluation.date === filterDate

    return matchSearch && matchDate
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Log Evaluasi</h1>
        <p className="text-muted-foreground mt-2">Riwayat feedback dan skor tugas siswa</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama atau ID siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-40" />
          {filterDate && (
            <Button variant="outline" onClick={() => setFilterDate("")}>
              Hapus Filter
            </Button>
          )}
        </div>
      </div>

      {/* Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Evaluasi</CardTitle>
          <CardDescription>Kolom: Nama Siswa, Nama Tugas, Skor, Feedback, Tanggal Penilaian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Nama Siswa</th>
                  <th className="text-left py-3 px-4 font-medium">ID Siswa</th>
                  <th className="text-left py-3 px-4 font-medium">Nama Tugas</th>
                  <th className="text-left py-3 px-4 font-medium">Skor</th>
                  <th className="text-left py-3 px-4 font-medium">Feedback</th>
                  <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvaluations.length > 0 ? (
                  filteredEvaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{evaluation.studentName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{evaluation.studentId}</td>
                      <td className="py-3 px-4">{evaluation.taskName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{evaluation.score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">
                        {evaluation.feedback}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{evaluation.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada evaluasi yang ditemukan
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
