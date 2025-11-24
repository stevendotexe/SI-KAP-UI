export interface Student {
  id: string
  name: string
  studentId: string
  email: string
  status: "active" | "inactive"
  reportsSubmitted: number
  totalReports: number
  averageScore: number
  department: string
  mentorId: string
  startDate: string
  endDate: string
}

export interface Mentor {
  id: string
  name: string
  mentorId: string
  email: string
  status: "active" | "inactive"
  studentsCount: number
  department: string
  joinDate: string
}

export interface Report {
  id: string
  studentId: string
  week: string
  date: string
  status: "submitted" | "pending" | "draft"
  title: string
  activities: string
  challenges: string
  nextWeek: string
  feedback: string | null
  score: number | null
}

export interface Evaluation {
  id: string
  studentId: string
  mentorId: string
  date: string
  type: string
  score: number
  feedback: string
}

export interface Analytics {
  totalStudents: number
  totalMentors: number
  reportsSubmitted: number
  completionRate: number
  averageScore: number
}
