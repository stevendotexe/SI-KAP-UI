"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ReportsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  // Mock reports data
  const allReports = [
    {
      id: 1,
      week: "Week 1",
      date: "2024-01-08",
      status: "submitted",
      title: "Initial Setup & Orientation",
      author: user.role === "admin" ? "Ahmad Rizki" : undefined,
    },
    {
      id: 2,
      week: "Week 2",
      date: "2024-01-15",
      status: "submitted",
      title: "Database Design & Implementation",
      author: user.role === "admin" ? "Ahmad Rizki" : undefined,
    },
    {
      id: 3,
      week: "Week 3",
      date: "2024-01-22",
      status: "pending",
      title: "API Developm",
      author: user.role === "admin" ? "Siti Nurhaliza" : undefined,
    },
  ]

  const filteredReports = allReports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.week.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-2">
            {user.role === "student" ? "Your weekly reports" : "All submitted reports"}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
                    {report.author && <p className="text-xs text-muted-foreground mt-1">By: {report.author}</p>}
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
                <p className="text-muted-foreground">No reports found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
