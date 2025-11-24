"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewEvaluationPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdParam = searchParams.get("studentId")

  const [formData, setFormData] = useState({
    studentId: studentIdParam || "",
    type: "",
    score: 5,
    feedback: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "mentor")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  // Mock students list
  const students = [
    { id: "STU-001", name: "Ahmad Rizki" },
    { id: "STU-002", name: "Siti Nurhaliza" },
    { id: "STU-003", name: "Budi Santoso" },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, studentId: value }))
  }

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }))
  }

  const handleScoreChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, score: value[0] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Reset form and redirect
    setFormData({
      studentId: "",
      type: "",
      score: 5,
      feedback: "",
    })
    router.push("/evaluations")
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/evaluations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Evaluation</h1>
          <p className="text-muted-foreground mt-2">Evaluate student performance</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Form</CardTitle>
          <CardDescription>Provide feedback and score for the student</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label htmlFor="studentId">Student *</Label>
              <Select value={formData.studentId} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Evaluation Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Evaluation Type *</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select evaluation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mid-week">Mid-week Check-in</SelectItem>
                  <SelectItem value="weekly">Weekly Review</SelectItem>
                  <SelectItem value="progress">Progress Check</SelectItem>
                  <SelectItem value="final">Final Evaluation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Score */}
            <div className="space-y-4">
              <Label>Score: {formData.score}/10</Label>
              <Slider
                value={[formData.score]}
                onValueChange={handleScoreChange}
                min={0}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback *</Label>
              <Textarea
                id="feedback"
                name="feedback"
                placeholder="Provide detailed feedback about the student's performance..."
                value={formData.feedback}
                onChange={handleChange}
                rows={6}
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Evaluation"}
              </Button>
              <Link href="/evaluations">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
