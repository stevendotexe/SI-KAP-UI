"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useState } from "react"
import { mockPerformanceData, mockAttendanceData } from "@/lib/mock-data"
import { Edit } from "lucide-react"
import { EditBiodataModal } from "@/components/forms/edit-biodata-modal"

export function MentorDashboard() {
  const { user } = useAuth()
  const [showEditBiodata, setShowEditBiodata] = useState(false)
  const [mentorBiodata, setMentorBiodata] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+62812345678",
    department: "Information Technology",
    bio: "Mentor berpengalaman dalam bidang teknologi informasi",
  })

  // Mock data for mentor's students
  const students = [
    { id: 1, name: "Ahmad Rizki", studentId: "STU-001", status: "active", reportsSubmitted: 3 },
    { id: 2, name: "Siti Nurhaliza", studentId: "STU-002", status: "active", reportsSubmitted: 4 },
    { id: 3, name: "Budi Santoso", studentId: "STU-003", status: "active", reportsSubmitted: 2 },
  ]

  const performanceData = mockPerformanceData.filter((p) => students.some((s) => s.id.toString() === p.studentId))

  const attendanceData = mockAttendanceData.filter((a) => students.some((s) => s.id.toString() === a.studentId))

  const totalAttendance = attendanceData.reduce(
    (acc, curr) => ({
      hadir: acc.hadir + curr.attendance.hadir,
      izin: acc.izin + curr.attendance.izin,
      tidakHadir: acc.tidakHadir + curr.attendance.tidakHadir,
    }),
    { hadir: 0, izin: 0, tidakHadir: 0 },
  )

  const attendancePieData = [
    { name: "Hadir", value: totalAttendance.hadir },
    { name: "Izin", value: totalAttendance.izin },
    { name: "Tidak Hadir", value: totalAttendance.tidakHadir },
  ]

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

  const handleSaveBiodata = (data: any) => {
    setMentorBiodata(data)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Selamat Datang, {mentorBiodata.name}!</h1>
          <p className="text-muted-foreground mt-2">ID Mentor: {user?.mentorId}</p>
        </div>
        <Button onClick={() => setShowEditBiodata(true)} variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Biodata
        </Button>
      </div>

      <EditBiodataModal
        open={showEditBiodata}
        onOpenChange={setShowEditBiodata}
        type="mentor"
        data={mentorBiodata}
        onSave={handleSaveBiodata}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Siswa Dibimbing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">siswa aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Laporan Menunggu Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">laporan siswa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Laporan Sudah Direview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">bulan ini</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="performance">Grafik Performa Siswa</TabsTrigger>
          <TabsTrigger value="attendance">Rekap Kehadiran</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performa Skor Siswa</CardTitle>
              <CardDescription>Grafik naik turun skor siswa pada setiap tugas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceData.map((data) => (
                  <div key={data.studentId} className="space-y-2">
                    <h3 className="font-medium text-sm">{data.studentName}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={data.tasks}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="taskName" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip
                          formatter={(value) => [`Skor: ${value}`, "Skor"]}
                          labelFormatter={(label) => `Tugas: ${label}`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" name="Skor" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Diagram Kehadiran</CardTitle>
                <CardDescription>Total kehadiran semua siswa</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendancePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Attendance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Tabel Kehadiran</CardTitle>
                <CardDescription>Detail kehadiran per siswa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceData.map((data) => (
                    <div key={data.studentId} className="p-3 border rounded-lg">
                      <p className="font-medium text-sm mb-2">{data.studentName}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-green-700 font-medium">Hadir</p>
                          <p className="text-green-600">{data.attendance.hadir}</p>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded">
                          <p className="text-yellow-700 font-medium">Izin</p>
                          <p className="text-yellow-600">{data.attendance.izin}</p>
                        </div>
                        <div className="bg-red-50 p-2 rounded">
                          <p className="text-red-700 font-medium">Tidak Hadir</p>
                          <p className="text-red-600">{data.attendance.tidakHadir}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Students List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Siswa Anda</CardTitle>
              <CardDescription>Pantau perkembangan siswa yang dibimbing</CardDescription>
            </div>
            <Link href="/students">
              <Button>Lihat Semua</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.studentId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{student.reportsSubmitted} laporan</Badge>
                  <Link href={`/students/${student.id}`}>
                    <Button variant="outline" size="sm">
                      Tinjau
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
