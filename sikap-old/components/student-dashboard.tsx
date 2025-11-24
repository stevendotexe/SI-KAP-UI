"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export function StudentDashboard() {
  const { user } = useAuth()

  // Mock data for student reports
  const reports = [
    {
      id: 1,
      week: "Week 1",
      date: "2024-01-08",
      status: "submitted",
      title: "Initial Setup & Orientation",
    },
    {
      id: 2,
      week: "Week 2",
      date: "2024-01-15",
      status: "submitted",
      title: "Database Design & Implementation",
    },
    {
      id: 3,
      week: "Week 3",
      date: "2024-01-22",
      status: "pending",
      title: "API Development",
    },
    {
      id: 4,
      week: "Week 4",
      date: "2024-01-29",
      status: "draft",
      title: "Testing & Debugging",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "draft":
        return <FileText className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-100 text-green-800">Submitted</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground mt-2">Student ID: {user?.studentId}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reports Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">out of 4 weeks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">awaiting mentor feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5</div>
            <p className="text-xs text-muted-foreground">out of 10</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Reports</CardTitle>
              <CardDescription>Your submitted and draft reports</CardDescription>
            </div>
            <Link href="/reports/new">
              <Button>New Report</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(report.status)}
                  <div className="flex-1">
                    <p className="font-medium">{report.week}</p>
                    <p className="text-sm text-muted-foreground">{report.title}</p>
                  </div>
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/reports/new">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <FileText className="mr-2 h-4 w-4" />
                Submit New Report
              </Button>
            </Link>
            <Link href="/evaluations">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <AlertCircle className="mr-2 h-4 w-4" />
                View Evaluations
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
