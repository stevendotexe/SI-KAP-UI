"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Star, Edit } from "lucide-react"
import Link from "next/link"
import { EditBiodataModal } from "@/components/forms/edit-biodata-modal"

export default function StudentDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const studentId = params.id
  const [showEditBiodata, setShowEditBiodata] = useState(false)
  const [reviewData, setReviewData] = useState<any[]>([])
  const [currentReview, setCurrentReview] = useState({ reportId: "", score: 5, feedback: "" })
  const [studentBiodata, setStudentBiodata] = useState({
    name: "Ahmad Rizki",
    email: "ahmad@example.com",
    phone: "+62812345678",
    school: "SMA Negeri 1 Jakarta",
    bio: "Siswa berprestasi di bidang teknologi",
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  // Mock student data
  const student = {
    id: studentId,
    name: studentBiodata.name,
    studentId: "STU-001",
    email: studentBiodata.email,
    status: "active",
    department: "Information Technology",
    sekolahAsal: studentBiodata.school,
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    averageScore: 8.5,
    reportsSubmitted: 3,
    totalReports: 4,
  }

  const reports = [
    {
      id: 1,
      week: "Minggu 1",
      date: "2024-01-08",
      status: "reviewed",
      title: "Setup Awal & Orientasi",
      activities: "Menyelesaikan proses onboarding, setup environment development, dan menghadiri sesi orientasi.",
      challenges: "Awalnya ada masalah dengan setup environment, tapi tim IT membantu menyelesaikannya dengan cepat.",
      nextWeek: "Minggu depan saya akan mulai mengerjakan desain database schema.",
      score: 8.5,
      feedback: "Awal yang bagus! Setup Anda sudah lengkap dan siap untuk mulai development.",
    },
    {
      id: 2,
      week: "Minggu 2",
      date: "2024-01-15",
      status: "reviewed",
      title: "Desain & Implementasi Database",
      activities: "Merancang database schema dan mengimplementasikan tabel-tabel awal.",
      challenges: "Harus mengoptimalkan beberapa query untuk performa yang lebih baik.",
      nextWeek: "Mulai development API.",
      score: 8.7,
      feedback: "Desain database yang sangat bagus! Teruskan kerja keras Anda.",
    },
    {
      id: 3,
      week: "Minggu 3",
      date: "2024-01-22",
      status: "pending",
      title: "Development API",
      activities: "Mengembangkan REST API endpoints untuk fitur-fitur utama.",
      challenges: "Implementasi authentication memakan waktu lebih lama dari yang diperkirakan.",
      nextWeek: "Menyelesaikan testing API dan dokumentasi.",
      score: null,
      feedback: null,
    },
  ]

  const handleSubmitReview = () => {
    if (currentReview.reportId && currentReview.feedback) {
      const newReview = {
        id: Date.now().toString(),
        reportId: currentReview.reportId,
        score: currentReview.score,
        feedback: currentReview.feedback,
        date: new Date().toISOString().split("T")[0],
      }
      setReviewData([...reviewData, newReview])
      setCurrentReview({ reportId: "", score: 5, feedback: "" })
    }
  }

  const handleSaveBiodata = (data: any) => {
    setStudentBiodata(data)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground mt-2">{student.studentId}</p>
        </div>
        <Button onClick={() => setShowEditBiodata(true)} variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Biodata
        </Button>
      </div>

      <EditBiodataModal
        open={showEditBiodata}
        onOpenChange={setShowEditBiodata}
        type="student"
        data={studentBiodata}
        onSave={handleSaveBiodata}
      />

      {/* Student Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{student.status === "active" ? "Aktif" : "Tidak Aktif"}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {student.reportsSubmitted}/{student.totalReports}
            </div>
            <p className="text-xs text-muted-foreground">dikirim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rata-rata Skor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.averageScore}</div>
            <p className="text-xs text-muted-foreground">dari 10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Asal Sekolah</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{student.sekolahAsal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">Laporan Siswa</TabsTrigger>
          <TabsTrigger value="review">Review Laporan</TabsTrigger>
          <TabsTrigger value="info">Informasi</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan yang Dikirim</CardTitle>
              <CardDescription>Laporan mingguan siswa yang telah dikirimkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{report.week}</p>
                          <Badge variant={report.status === "reviewed" ? "default" : "secondary"}>
                            {report.status === "reviewed" ? "Sudah Direview" : "Menunggu Review"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">{report.title}</p>
                      </div>
                      {report.score && (
                        <div className="flex items-center gap-1 ml-4">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{report.score}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Aktivitas:</span> {report.activities}
                      </p>
                      <p>
                        <span className="font-medium">Tantangan:</span> {report.challenges}
                      </p>
                      <p>
                        <span className="font-medium">Rencana Minggu Depan:</span> {report.nextWeek}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Laporan Siswa</CardTitle>
              <CardDescription>Pilih laporan untuk direview dan berikan skor serta feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Pilih Laporan</label>
                  <select
                    value={currentReview.reportId}
                    onChange={(e) => setCurrentReview({ ...currentReview, reportId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">-- Pilih Laporan --</option>
                    {reports
                      .filter((r) => r.status === "pending")
                      .map((report) => (
                        <option key={report.id} value={report.id}>
                          {report.week} - {report.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Skor (1-10)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={currentReview.score}
                    onChange={(e) => setCurrentReview({ ...currentReview, score: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Feedback & Penilaian</label>
                  <Textarea
                    placeholder="Berikan feedback dan penilaian untuk laporan siswa ini"
                    value={currentReview.feedback}
                    onChange={(e) => setCurrentReview({ ...currentReview, feedback: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button onClick={handleSubmitReview} className="w-full">
                  Simpan Review & Feedback
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Review History */}
          {reviewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviewData.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">Laporan {review.reportId}</p>
                          <p className="text-sm text-muted-foreground">{review.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{review.score}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.feedback}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Siswa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{student.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departemen</p>
                  <p className="font-medium">{student.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                  <p className="font-medium">{student.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                  <p className="font-medium">{student.endDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asal Sekolah</p>
                  <p className="font-medium">{student.sekolahAsal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Telepon</p>
                  <p className="font-medium">{studentBiodata.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
