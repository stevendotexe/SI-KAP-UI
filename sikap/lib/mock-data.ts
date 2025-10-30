// Mock Students
export const mockStudents = [
  {
    id: "1",
    name: "Ahmad Rizki",
    studentId: "STU-001",
    email: "ahmad@example.com",
    status: "active" as const,
    reportsSubmitted: 3,
    totalReports: 4,
    averageScore: 8.5,
    department: "Information Technology",
    mentorId: "MEN-001",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    studentId: "STU-002",
    email: "siti@example.com",
    status: "active" as const,
    reportsSubmitted: 4,
    totalReports: 4,
    averageScore: 9.0,
    department: "Information Technology",
    mentorId: "MEN-001",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
  },
  {
    id: "3",
    name: "Budi Santoso",
    studentId: "STU-003",
    email: "budi@example.com",
    status: "active" as const,
    reportsSubmitted: 2,
    totalReports: 4,
    averageScore: 7.8,
    department: "Information Technology",
    mentorId: "MEN-002",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
  },
]

// Mock Mentors
export const mockMentors = [
  {
    id: "MEN-001",
    name: "Dr. Budi Santoso",
    mentorId: "MEN-001",
    email: "budi.mentor@example.com",
    status: "active" as const,
    studentsCount: 3,
    department: "Information Technology",
    joinDate: "2023-06-01",
  },
  {
    id: "MEN-002",
    name: "Prof. Siti Nurhaliza",
    mentorId: "MEN-002",
    email: "siti.mentor@example.com",
    status: "active" as const,
    studentsCount: 4,
    department: "Information Technology",
    joinDate: "2023-07-15",
  },
  {
    id: "MEN-003",
    name: "Dr. Ahmad Rizki",
    mentorId: "MEN-003",
    email: "ahmad.mentor@example.com",
    status: "inactive" as const,
    studentsCount: 0,
    department: "Information Technology",
    joinDate: "2023-08-20",
  },
]

// Mock Reports
export const mockReports = [
  {
    id: "1",
    studentId: "1",
    week: "Week 1",
    date: "2024-01-08",
    status: "submitted" as const,
    title: "Initial Setup & Orientation",
    activities:
      "This week I completed the onboarding process, set up my development environment, and attended orientation sessions.",
    challenges: "Initially had some issues with environment setup, but the IT team helped resolve them quickly.",
    nextWeek: "Next week I plan to start working on the database schema design.",
    feedback: "Great start! Your setup is complete and you're ready to begin development work.",
    score: 8.5,
  },
  {
    id: "2",
    studentId: "1",
    week: "Week 2",
    date: "2024-01-15",
    status: "submitted" as const,
    title: "Database Design & Implementation",
    activities: "Designed the database schema and implemented the initial tables.",
    challenges: "Had to optimize some queries for better performance.",
    nextWeek: "Start API development.",
    feedback: "Excellent database design! Keep up the good work.",
    score: 8.7,
  },
  {
    id: "3",
    studentId: "1",
    week: "Week 3",
    date: "2024-01-22",
    status: "submitted" as const,
    title: "API Development",
    activities: "Developed REST API endpoints for core features.",
    challenges: "Authentication implementation took longer than expected.",
    nextWeek: "Complete API testing and documentation.",
    feedback: "Good progress on API development.",
    score: 8.3,
  },
  {
    id: "4",
    studentId: "1",
    week: "Week 4",
    date: "2024-01-29",
    status: "pending" as const,
    title: "Testing & Debugging",
    activities: "Implemented comprehensive testing suite.",
    challenges: "Found and fixed several edge cases.",
    nextWeek: "Deploy to staging environment.",
    feedback: null,
    score: null,
  },
]

// Mock Evaluations
export const mockEvaluations = [
  {
    id: "1",
    studentId: "1",
    mentorId: "MEN-001",
    date: "2024-01-15",
    type: "Mid-week Check-in",
    score: 8.5,
    feedback: "Good progress on database design. Keep up the good work!",
  },
  {
    id: "2",
    studentId: "2",
    mentorId: "MEN-001",
    date: "2024-01-16",
    type: "Weekly Review",
    score: 9.0,
    feedback: "Excellent work on API implementation.",
  },
  {
    id: "3",
    studentId: "3",
    mentorId: "MEN-002",
    date: "2024-01-17",
    type: "Progress Check",
    score: 7.8,
    feedback: "Needs improvement on documentation.",
  },
]

// Mock Analytics Data
export const mockAnalytics = {
  totalStudents: 156,
  totalMentors: 24,
  reportsSubmitted: 487,
  completionRate: 92,
  averageScore: 8.2,
  reportSubmissionData: [
    { week: "Week 1", submitted: 156, pending: 0 },
    { week: "Week 2", submitted: 152, pending: 4 },
    { week: "Week 3", submitted: 148, pending: 8 },
    { week: "Week 4", submitted: 145, pending: 11 },
  ],
  scoreDistribution: [
    { name: "9-10", value: 45 },
    { name: "8-9", value: 78 },
    { name: "7-8", value: 25 },
    { name: "Below 7", value: 8 },
  ],
  departmentStats: [
    { department: "IT", students: 45, mentors: 8 },
    { department: "Engineering", students: 38, mentors: 6 },
    { department: "Business", students: 42, mentors: 7 },
    { department: "Design", students: 31, mentors: 5 },
  ],
}

// Mock Performance Data
export const mockPerformanceData = [
  {
    studentId: "1",
    studentName: "Ahmad Rizki",
    tasks: [
      { taskName: "Setup Database", date: "2024-01-08", score: 8.5 },
      { taskName: "API Development", date: "2024-01-15", score: 8.7 },
      { taskName: "Testing", date: "2024-01-22", score: 8.3 },
      { taskName: "Documentation", date: "2024-01-29", score: 8.6 },
    ],
  },
  {
    studentId: "2",
    studentName: "Siti Nurhaliza",
    tasks: [
      { taskName: "Setup Database", date: "2024-01-08", score: 9.0 },
      { taskName: "API Development", date: "2024-01-15", score: 9.2 },
      { taskName: "Testing", date: "2024-01-22", score: 9.1 },
      { taskName: "Documentation", date: "2024-01-29", score: 9.0 },
    ],
  },
  {
    studentId: "3",
    studentName: "Budi Santoso",
    tasks: [
      { taskName: "Setup Database", date: "2024-01-08", score: 7.8 },
      { taskName: "API Development", date: "2024-01-15", score: 7.9 },
      { taskName: "Testing", date: "2024-01-22", score: 7.7 },
      { taskName: "Documentation", date: "2024-01-29", score: 8.0 },
    ],
  },
]

// Mock Attendance Data
export const mockAttendanceData = [
  {
    studentId: "1",
    studentName: "Ahmad Rizki",
    attendance: {
      hadir: 10,
      izin: 2,
      tidakHadir: 1,
    },
    details: [
      { date: "2024-01-08", status: "hadir", photo: "photo1.jpg" },
      { date: "2024-01-09", status: "hadir", photo: "photo2.jpg" },
      { date: "2024-01-10", status: "izin", reason: "Sakit" },
      { date: "2024-01-11", status: "hadir", photo: "photo3.jpg" },
      { date: "2024-01-12", status: "tidakHadir" },
    ],
  },
  {
    studentId: "2",
    studentName: "Siti Nurhaliza",
    attendance: {
      hadir: 12,
      izin: 1,
      tidakHadir: 0,
    },
    details: [
      { date: "2024-01-08", status: "hadir", photo: "photo4.jpg" },
      { date: "2024-01-09", status: "hadir", photo: "photo5.jpg" },
      { date: "2024-01-10", status: "hadir", photo: "photo6.jpg" },
      { date: "2024-01-11", status: "izin", reason: "Acara keluarga" },
      { date: "2024-01-12", status: "hadir", photo: "photo7.jpg" },
    ],
  },
  {
    studentId: "3",
    studentName: "Budi Santoso",
    attendance: {
      hadir: 9,
      izin: 2,
      tidakHadir: 2,
    },
    details: [
      { date: "2024-01-08", status: "hadir", photo: "photo8.jpg" },
      { date: "2024-01-09", status: "tidakHadir" },
      { date: "2024-01-10", status: "hadir", photo: "photo9.jpg" },
      { date: "2024-01-11", status: "izin", reason: "Perjalanan" },
      { date: "2024-01-12", status: "tidakHadir" },
    ],
  },
]

// Mock Bank Soal
export const mockBankSoal = [
  {
    id: "1",
    mentorId: "MEN-001",
    title: "Desain Database Relasional",
    description: "Buatlah desain database untuk sistem manajemen siswa dengan minimal 5 tabel",
    attachment: null,
    createdAt: "2024-01-05",
  },
  {
    id: "2",
    mentorId: "MEN-001",
    title: "Implementasi REST API",
    description: "Implementasikan REST API dengan minimal 10 endpoint menggunakan Node.js dan Express",
    attachment: "api-requirements.pdf",
    createdAt: "2024-01-10",
  },
  {
    id: "3",
    mentorId: "MEN-002",
    title: "Unit Testing dengan Jest",
    description: "Buatlah unit test untuk fungsi-fungsi kritis dengan coverage minimal 80%",
    attachment: null,
    createdAt: "2024-01-12",
  },
]
