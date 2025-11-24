"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ReportDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const reportId = params.id

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  // Mock report data
  const report = {
    id: reportId,
    week: "Week 1",
    date: "2024-01-08",
    status: "submitted",
    title: "Initial Setup & Orientation",
    activities:
      "This week I completed the onboarding process, set up my development environment, and attended orientation sessions. I familiarized myself with the company's tech stack and project structure.",
    challenges: "Initially had some issues with environment setup, but the IT team helped resolve them quickly.",
    nextWeek: "Next week I plan to start working on the database schema design and begin the first sprint tasks.",
    feedback: "Great start! Your setup is complete and you're ready to begin development work.",
  }

  return (
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

      {/* Status */}
      <div className="flex items-center gap-3">
        <Badge className="bg-green-100 text-green-800">Submitted</Badge>
        <span className="text-sm text-muted-foreground">Submitted on {report.date}</span>
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activities */}
          <div>
            <h3 className="font-semibold mb-2">Activities This Week</h3>
            <p className="text-muted-foreground">{report.activities}</p>
          </div>

          {/* Challenges */}
          <div>
            <h3 className="font-semibold mb-2">Challenges & Solutions</h3>
            <p className="text-muted-foreground">{report.challenges}</p>
          </div>

          {/* Next Week */}
          <div>
            <h3 className="font-semibold mb-2">Plans for Next Week</h3>
            <p className="text-muted-foreground">{report.nextWeek}</p>
          </div>
        </CardContent>
      </Card>

      {/* Mentor Feedback */}
      {report.feedback && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Mentor Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">{report.feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/reports">
          <Button variant="outline">Back to Reports</Button>
        </Link>
      </div>
    </div>
  )
}
