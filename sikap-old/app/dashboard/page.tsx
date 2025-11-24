"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { StudentDashboard } from "@/components/student-dashboard"
import { MentorDashboard } from "@/components/mentor-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  switch (user.role) {
    case "student":
      return <StudentDashboard />
    case "mentor":
      return <MentorDashboard />
    case "admin":
      return <AdminDashboard />
    default:
      return null
  }
}
