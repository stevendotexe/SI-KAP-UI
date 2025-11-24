"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Star, Search } from "lucide-react"
import Link from "next/link"

export default function EvaluationsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  // Mock evaluations data
  const allEvaluations = [
    {
      id: 1,
      studentName: "Ahmad Rizki",
      studentId: "STU-001",
      date: "2024-01-15",
      type: "Mid-week Check-in",
      score: 8.5,
      feedback: "Good progress on database design.",
    },
    {
      id: 2,
      studentName: "Siti Nurhaliza",
      studentId: "STU-002",
      date: "2024-01-16",
      type: "Weekly Review",
      score: 9.0,
      feedback: "Excellent work on API implementation.",
    },
    {
      id: 3,
      studentName: "Budi Santoso",
      studentId: "STU-003",
      date: "2024-01-17",
      type: "Progress Check",
      score: 7.8,
      feedback: "Needs improvement on documentation.",
    },
  ]

  const filteredEvaluations = allEvaluations.filter(
    (evaluation) =>
      evaluation.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.studentId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evaluations</h1>
          <p className="text-muted-foreground mt-2">
            {user.role === "mentor" ? "Your student evaluations" : "All evaluations"}
          </p>
        </div>
        {user.role === "mentor" && (
          <Link href="/evaluations/new">
            <Button>New Evaluation</Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Evaluations List */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {filteredEvaluations.length > 0 ? (
              filteredEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{evaluation.studentName}</p>
                      <p className="text-sm text-muted-foreground">{evaluation.studentId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{evaluation.score}</span>
                      </div>
                      <Badge variant="outline">{evaluation.type}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{evaluation.feedback}</p>
                  <p className="text-xs text-muted-foreground">{evaluation.date}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No evaluations found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
