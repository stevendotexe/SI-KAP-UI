"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Trash2, Edit } from "lucide-react"

export default function MentorsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  // Mock mentors data
  const allMentors = [
    {
      id: 1,
      name: "Dr. Budi Santoso",
      mentorId: "MEN-001",
      email: "budi@example.com",
      status: "active",
      studentsCount: 3,
      department: "Information Technology",
      joinDate: "2023-06-01",
    },
    {
      id: 2,
      name: "Prof. Siti Nurhaliza",
      mentorId: "MEN-002",
      email: "siti@example.com",
      status: "active",
      studentsCount: 4,
      department: "Information Technology",
      joinDate: "2023-07-15",
    },
    {
      id: 3,
      name: "Dr. Ahmad Rizki",
      mentorId: "MEN-003",
      email: "ahmad@example.com",
      status: "inactive",
      studentsCount: 0,
      department: "Information Technology",
      joinDate: "2023-08-20",
    },
  ]

  const filteredMentors = allMentors.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.mentorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mentors</h1>
          <p className="text-muted-foreground mt-2">Manage all mentors in the system</p>
        </div>
        <Button>Add Mentor</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mentors Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Students</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMentors.length > 0 ? (
                  filteredMentors.map((mentor) => (
                    <tr key={mentor.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">{mentor.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{mentor.mentorId}</td>
                      <td className="py-3 px-4 text-muted-foreground">{mentor.email}</td>
                      <td className="py-3 px-4">{mentor.studentsCount}</td>
                      <td className="py-3 px-4">
                        <Badge variant={mentor.status === "active" ? "default" : "secondary"}>{mentor.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No mentors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
