"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"

export default function StudentDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const studentId = params.id

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  // Mock student data
  const student = {
    id: studentId,
    name: "Ahmad Rizki",
    studentId: "STU-001",
    email: "ahmad@example.com",
    status: "active",
    department: "Information Technology",
    mentor: "Dr. Budi Santoso",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    averageScore: 8.5,
    reportsSubmitted: 3,
    totalReports: 4,
  }

  const reports = [
    {
      id: 1,
      week: "Week 1",
      date: "2024-01-08",
      status: "submitted",
      title: "Initial Setup & Orientation",
      score: 8.5,
    },
    {
      id: 2,
      week: "Week 2",
      date: "2024-01-15",
      status: "submitted",
      title: "Database Design & Implementation",
      score: 8.7,
    },
    {
      id: 3,
      week: "Week 3",
      date: "2024-01-22",
      status: "submitted",
      title: "API Development",
      score: 8.3,
    },
  ]

  const evaluations = [
    {
      id: 1,
      date: "2024-01-15",
      type: "Mid-week Check-in",
      score: 8.5,
      feedback: "Good progress on database design. Keep up the good work!",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground mt-2">{student.studentId}</p>
        </div>
      </div>

      {/* Student Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{student.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {student.reportsSubmitted}/{student.totalReports}
            </div>
            <p className="text-xs text-muted-foreground">submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.averageScore}</div>
            <p className="text-xs text-muted-foreground">out of 10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{student.mentor}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Reports</CardTitle>
              <CardDescription>Weekly progress reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{report.week}</p>
                      <p className="text-sm text-muted-foreground">{report.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{report.score}</span>
                      </div>
                      <Link href={`/reports/${report.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-4">
          <div className="flex justify-end">
            <Link href={`/evaluations/new?studentId=${studentId}`}>
              <Button>Add Evaluation</Button>
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Evaluations</CardTitle>
              <CardDescription>Performance evaluations and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluations.length > 0 ? (
                  evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{evaluation.type}</p>
                          <p className="text-sm text-muted-foreground">{evaluation.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{evaluation.score}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No evaluations yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{student.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{student.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{student.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{student.endDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
