"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  // Mock analytics data
  const reportSubmissionData = [
    { week: "Week 1", submitted: 156, pending: 0 },
    { week: "Week 2", submitted: 152, pending: 4 },
    { week: "Week 3", submitted: 148, pending: 8 },
    { week: "Week 4", submitted: 145, pending: 11 },
  ]

  const scoreDistribution = [
    { name: "9-10", value: 45, fill: "#10b981" },
    { name: "8-9", value: 78, fill: "#3b82f6" },
    { name: "7-8", value: 25, fill: "#f59e0b" },
    { name: "Below 7", value: 8, fill: "#ef4444" },
  ]

  const departmentStats = [
    { department: "IT", students: 45, mentors: 8 },
    { department: "Engineering", students: 38, mentors: 6 },
    { department: "Business", students: 42, mentors: 7 },
    { department: "Design", students: 31, mentors: 5 },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-2">System-wide statistics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+5 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Mentors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reports Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">487</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2</div>
            <p className="text-xs text-muted-foreground">out of 10</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Submission Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Report Submission Trend</CardTitle>
            <CardDescription>Weekly submission status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportSubmissionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submitted" fill="#10b981" />
                <Bar dataKey="pending" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Student performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Department Statistics</CardTitle>
          <CardDescription>Students and mentors by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Department</th>
                  <th className="text-left py-3 px-4 font-medium">Students</th>
                  <th className="text-left py-3 px-4 font-medium">Mentors</th>
                  <th className="text-left py-3 px-4 font-medium">Ratio</th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((dept, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{dept.department}</td>
                    <td className="py-3 px-4">{dept.students}</td>
                    <td className="py-3 px-4">{dept.mentors}</td>
                    <td className="py-3 px-4 text-muted-foreground">{(dept.students / dept.mentors).toFixed(1)}:1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
