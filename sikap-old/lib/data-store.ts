"use client"

import { mockStudents, mockMentors, mockReports, mockEvaluations, mockAnalytics } from "./mock-data"

// Student Store
export const studentStore = {
  getAll: () => mockStudents,
  getById: (id: string) => mockStudents.find((s) => s.id === id),
  getByMentorId: (mentorId: string) => mockStudents.filter((s) => s.mentorId === mentorId),
  search: (query: string) =>
    mockStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.studentId.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase()),
    ),
}

// Mentor Store
export const mentorStore = {
  getAll: () => mockMentors,
  getById: (id: string) => mockMentors.find((m) => m.id === id),
  search: (query: string) =>
    mockMentors.filter(
      (m) =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.mentorId.toLowerCase().includes(query.toLowerCase()) ||
        m.email.toLowerCase().includes(query.toLowerCase()),
    ),
}

// Report Store
export const reportStore = {
  getAll: () => mockReports,
  getById: (id: string) => mockReports.find((r) => r.id === id),
  getByStudentId: (studentId: string) => mockReports.filter((r) => r.studentId === studentId),
  search: (query: string) =>
    mockReports.filter(
      (r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.week.toLowerCase().includes(query.toLowerCase()),
    ),
  getByStatus: (status: string) => mockReports.filter((r) => r.status === status),
}

// Evaluation Store
export const evaluationStore = {
  getAll: () => mockEvaluations,
  getById: (id: string) => mockEvaluations.find((e) => e.id === id),
  getByStudentId: (studentId: string) => mockEvaluations.filter((e) => e.studentId === studentId),
  getByMentorId: (mentorId: string) => mockEvaluations.filter((e) => e.mentorId === mentorId),
  search: (query: string) => mockEvaluations.filter((e) => e.type.toLowerCase().includes(query.toLowerCase())),
}

// Analytics Store
export const analyticsStore = {
  getOverview: () => ({
    totalStudents: mockAnalytics.totalStudents,
    totalMentors: mockAnalytics.totalMentors,
    reportsSubmitted: mockAnalytics.reportsSubmitted,
    completionRate: mockAnalytics.completionRate,
    averageScore: mockAnalytics.averageScore,
  }),
  getReportSubmissionData: () => mockAnalytics.reportSubmissionData,
  getScoreDistribution: () => mockAnalytics.scoreDistribution,
  getDepartmentStats: () => mockAnalytics.departmentStats,
}
