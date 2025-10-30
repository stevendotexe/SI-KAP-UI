"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Search } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StudentsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAngkatan, setFilterAngkatan] = useState("semua")
  const [filterSekolah, setFilterSekolah] = useState("semua")
  const [filterStatus, setFilterStatus] = useState("semua")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  // Mock students data
  const allStudents = [
    {
      id: 1,
      name: "Ahmad Rizki",
      studentId: "STU-001",
      email: "ahmad@example.com",
      status: "active",
      reportsSubmitted: 3,
      averageScore: 8.5,
      department: "Information Technology",
      sekolahAsal: "SMA Negeri 1 Jakarta",
      angkatan: "2024",
    },
    {
      id: 2,
      name: "Siti Nurhaliza",
      studentId: "STU-002",
      email: "siti@example.com",
      status: "active",
      reportsSubmitted: 4,
      averageScore: 9.0,
      department: "Information Technology",
      sekolahAsal: "SMA Negeri 2 Bandung",
      angkatan: "2024",
    },
    {
      id: 3,
      name: "Budi Santoso",
      studentId: "STU-003",
      email: "budi@example.com",
      status: "inactive",
      reportsSubmitted: 2,
      averageScore: 7.8,
      department: "Information Technology",
      sekolahAsal: "SMA Negeri 3 Surabaya",
      angkatan: "2023",
    },
  ]

  const filteredStudents = allStudents.filter((student) => {
    const matchSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchAngkatan = filterAngkatan === "semua" || student.angkatan === filterAngkatan
    const matchSekolah = filterSekolah === "semua" || student.sekolahAsal === filterSekolah
    const matchStatus = filterStatus === "semua" || student.status === filterStatus

    return matchSearch && matchAngkatan && matchSekolah && matchStatus
  })

  const uniqueSekolah = [...new Set(allStudents.map((s) => s.sekolahAsal))]
  const uniqueAngkatan = [...new Set(allStudents.map((s) => s.angkatan))]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Siswa</h1>
        <p className="text-muted-foreground mt-2">
          {user.role === "mentor" ? "Siswa yang dibimbing" : "Semua siswa dalam sistem"}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan nama, ID, atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={filterAngkatan} onValueChange={setFilterAngkatan}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter Angkatan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Angkatan</SelectItem>
            {uniqueAngkatan.map((angkatan) => (
              <SelectItem key={angkatan} value={angkatan}>
                Angkatan {angkatan}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSekolah} onValueChange={setFilterSekolah}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter Sekolah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Sekolah</SelectItem>
            {uniqueSekolah.map((sekolah) => (
              <SelectItem key={sekolah} value={sekolah}>
                {sekolah}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{student.name}</CardTitle>
                    <CardDescription>{student.studentId}</CardDescription>
                  </div>
                  <Badge variant="outline">{student.status === "active" ? "Aktif" : "Tidak Aktif"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Email:</span> {student.email}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Asal Sekolah:</span> {student.sekolahAsal}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Angkatan:</span> {student.angkatan}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Laporan:</span> {student.reportsSubmitted} dikirim
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Rata-rata Skor:</span> {student.averageScore}/10
                  </p>
                </div>
                <Link href={`/students/${student.id}`}>
                  <Button className="w-full">Lihat Detail</Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Tidak ada siswa yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
