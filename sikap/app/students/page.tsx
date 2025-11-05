"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function StudentsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [sortBy, setSortBy] = useState<"name" | "reports" | "avgScore">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

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
      department: "Teknologi Informasi",
    },
    {
      id: 2,
      name: "Siti Nurhaliza",
      studentId: "STU-002",
      email: "siti@example.com",
      status: "active",
      reportsSubmitted: 4,
      averageScore: 9.0,
      department: "Teknologi Informasi",
    },
    {
      id: 3,
      name: "Budi Santoso",
      studentId: "STU-003",
      email: "budi@example.com",
      status: "active",
      reportsSubmitted: 2,
      averageScore: 7.8,
      department: "Teknologi Informasi",
    },
  ]

  const filteredStudents = allStudents
    .filter((student) => {
      const q = searchTerm.toLowerCase()
      const matchesQuery =
        student.name.toLowerCase().includes(q) ||
        student.studentId.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" ? true : student.status === statusFilter
      return matchesQuery && matchesStatus
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name)
      } else if (sortBy === "reports") {
        cmp = a.reportsSubmitted - b.reportsSubmitted
      } else if (sortBy === "avgScore") {
        cmp = a.averageScore - b.averageScore
      }
      return sortDir === "asc" ? cmp : -cmp
    })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground mt-2">
          {user.role === "mentor" ? "Your assigned students" : "All students in the system"}
        </p>
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">Active</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="inactive">Inactive</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <ArrowUpDown className="mr-2 h-4 w-4" /> Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="reports">Reports Submitted</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="avgScore">Average Score</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Direction</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
                <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                  <Badge variant="outline">{student.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Email:</span> {student.email}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Departemen:</span> {student.department}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Laporan:</span> {student.reportsSubmitted} diserahkan
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Skor Rata-rata:</span> {student.averageScore}/10
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
            <p className="text-muted-foreground">Siswa tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
