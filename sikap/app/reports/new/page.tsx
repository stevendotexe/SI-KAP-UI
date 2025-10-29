"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewReportPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    week: "",
    title: "",
    content: "",
    activities: "",
    challenges: "",
    nextWeek: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Reset form and redirect
    setFormData({
      week: "",
      title: "",
      content: "",
      activities: "",
      challenges: "",
      nextWeek: "",
    })
    router.push("/reports")
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
          <h1 className="text-3xl font-bold">Submit New Report</h1>
          <p className="text-muted-foreground mt-2">Create your weekly progress report</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Report Form</CardTitle>
          <CardDescription>Fill in your weekly activities and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Week Selection */}
            <div className="space-y-2">
              <Label htmlFor="week">Week *</Label>
              <Input
                id="week"
                name="week"
                placeholder="e.g., Week 1"
                value={formData.week}
                onChange={handleChange}
                required
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Initial Setup & Orientation"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Activities */}
            <div className="space-y-2">
              <Label htmlFor="activities">Activities This Week *</Label>
              <Textarea
                id="activities"
                name="activities"
                placeholder="Describe the activities you completed this week..."
                value={formData.activities}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            {/* Challenges */}
            <div className="space-y-2">
              <Label htmlFor="challenges">Challenges & Solutions</Label>
              <Textarea
                id="challenges"
                name="challenges"
                placeholder="Describe any challenges you faced and how you solved them..."
                value={formData.challenges}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* Next Week */}
            <div className="space-y-2">
              <Label htmlFor="nextWeek">Plans for Next Week</Label>
              <Textarea
                id="nextWeek"
                name="nextWeek"
                placeholder="What do you plan to do next week?..."
                value={formData.nextWeek}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
              <Link href="/reports">
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
