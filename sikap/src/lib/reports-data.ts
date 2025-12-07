export type ReportItem = {
  id: string // student id
  student: string
  title: string
  date: string
  status: "sudah_direview" | "belum_direview" | "belum_dikerjakan"
  taskId?: string
  createdAt?: string
  updatedAt?: string
}

let reports: ReportItem[] = [
  { id: "STD-001", student: "Alya Putri", title: "Penyiapan Awal & Orientasi", date: "2025-06-20", status: "sudah_direview", taskId: "seed-orient" },
  { id: "STD-001", student: "Alya Putri", title: "Perancangan & Implementasi Basis Data", date: "2025-06-27", status: "belum_direview", taskId: "seed-db" },
  { id: "STD-001", student: "Alya Putri", title: "Integrasi Frontend", date: "2025-07-04", status: "sudah_direview", taskId: "seed-fe" },
  { id: "STD-002", student: "Bagus Pratama", title: "Penyiapan Awal & Orientasi", date: "2025-06-20", status: "belum_direview", taskId: "seed-orient" },
  { id: "STD-003", student: "Citra Dewi", title: "Integrasi Frontend", date: "2025-07-11", status: "belum_dikerjakan", taskId: "seed-fe" },
  { id: "STD-004", student: "Dwi Santoso", title: "Perancangan & Implementasi Basis Data", date: "2025-06-27", status: "sudah_direview", taskId: "seed-db" },
  { id: "STD-005", student: "Eka Ramadhan", title: "Implementasi API", date: "2025-06-21", status: "belum_direview", taskId: "seed-impl" },
]

type Listener = (items: ReportItem[]) => void
const listeners = new Set<Listener>()

export function getReports() {
  return reports
}

export function onReportsChange(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function updateReport(index: number, item: ReportItem) {
  reports[index] = item
  listeners.forEach((l) => l(reports))
}

export const STUDENTS: Array<{ id: string; student: string; school: string; batch: number; state: "Aktif" | "Non-Aktif" | "Lulus" | "Pindah"; major: "TKJ" | "RPL" }> = [
  { id: "STD-001", student: "Alya Putri", school: "SMK 13 Tasikmalaya", batch: 2025, state: "Aktif", major: "RPL" },
  { id: "STD-002", student: "Bagus Pratama", school: "SMK 2 Bandung", batch: 2025, state: "Aktif", major: "TKJ" },
  { id: "STD-003", student: "Citra Dewi", school: "SMK 1 Garut", batch: 2025, state: "Aktif", major: "RPL" },
  { id: "STD-004", student: "Dwi Santoso", school: "SMK 5 Jakarta", batch: 2025, state: "Non-Aktif", major: "TKJ" },
  { id: "STD-005", student: "Eka Ramadhan", school: "SMK 4 Yogyakarta", batch: 2025, state: "Aktif", major: "TKJ" },
  { id: "STD-006", student: "Farhan Akbar", school: "SMK 7 Bandung", batch: 2025, state: "Aktif", major: "RPL" },
  { id: "STD-007", student: "Gita Lestari", school: "SMK 11 Tasikmalaya", batch: 2025, state: "Lulus", major: "RPL" },
  { id: "STD-008", student: "Hana Safira", school: "SMK 3 Ciamis", batch: 2025, state: "Aktif", major: "TKJ" },
  { id: "STD-009", student: "Indra Setiawan", school: "SMK 8 Bandung", batch: 2025, state: "Pindah", major: "RPL" },
  { id: "STD-010", student: "Jihan Kartika", school: "SMK 2 Garut", batch: 2025, state: "Aktif", major: "TKJ" },
  { id: "STD-011", student: "Kamal Fauzi", school: "SMK 1 Tasikmalaya", batch: 2025, state: "Aktif", major: "RPL" },
  { id: "STD-012", student: "Laras Puspita", school: "SMK 5 Bandung", batch: 2025, state: "Aktif", major: "RPL" },
  { id: "STD-013", student: "Miko Pradana", school: "SMK 6 Bandung", batch: 2025, state: "Non-Aktif", major: "TKJ" },
  { id: "STD-014", student: "Nabila Zahra", school: "SMK 4 Bandung", batch: 2025, state: "Aktif", major: "RPL" },
  { id: "STD-015", student: "Omar Rizky", school: "SMK 1 Bandung", batch: 2025, state: "Aktif", major: "TKJ" },
  { id: "STD-016", student: "Putri Anindya", school: "SMK 9 Bandung", batch: 2025, state: "Aktif", major: "RPL" },
  { id: "STD-017", student: "Qori Azzahra", school: "SMK 10 Bandung", batch: 2025, state: "Lulus", major: "TKJ" },
  { id: "STD-018", student: "Rangga Saputra", school: "SMK 12 Bandung", batch: 2025, state: "Aktif", major: "RPL" },
  { id: "STD-019", student: "Sinta Maharani", school: "SMK 14 Bandung", batch: 2025, state: "Aktif", major: "TKJ" },
  { id: "STD-020", student: "Taufik Hidayat", school: "SMK 15 Bandung", batch: 2025, state: "Pindah", major: "RPL" },
]

export const TASKS = [
  { id: "seed-impl", title: "Implementasi API", description: "Bangun endpoint login dan refresh token", deadline: "2025-06-21" },
  { id: "seed-db", title: "Perancangan Basis Data", description: "Rancang tabel siswa dan relasi", deadline: "2025-06-25" },
  { id: "seed-fe", title: "Integrasi Frontend", description: "Integrasikan form laporan dengan API", deadline: "2025-07-02" },
  { id: "seed-orient", title: "Penyiapan Awal & Orientasi", description: "Onboarding & setup lingkungan", deadline: "2025-06-20" },
  { id: "seed-docs", title: "Dokumentasi Proyek", description: "Lengkapi README dan API docs", deadline: "2025-07-05" },
]

export function distributeTaskToStudents(taskId: string, title: string, date: string) {
  const now = new Date().toISOString()
  const newEntries: ReportItem[] = STUDENTS.map((s) => ({ id: s.id, student: s.student, title, date, status: "belum_dikerjakan" as const, taskId, createdAt: now, updatedAt: now }))
  reports = [...reports, ...newEntries]
  listeners.forEach((l) => l(reports))
}

export function ensureTaskForAllStudents(taskId: string, title: string, date: string) {
  const seen = new Set(reports.filter((r) => r.title === title).map((r) => r.id))
  const missing = STUDENTS.filter((s) => !seen.has(s.id))
  if (missing.length) {
    const now = new Date().toISOString()
    const add = missing.map((s) => ({ id: s.id, student: s.student, title, date, status: "belum_dikerjakan" as const, taskId, createdAt: now, updatedAt: now }))
    reports = [...reports, ...add]
  }
}

// Pastikan semua siswa memiliki tugas Implementasi API
ensureTaskForAllStudents("seed-impl", "Implementasi API", "2025-06-21")

export function listStudentTasks(studentId: string) {
  return reports.filter((r) => r.id === studentId).sort((a, b) => a.title.localeCompare(b.title))
}

export function updateStatus(studentId: string, taskId: string, status: "belum_dikerjakan" | "belum_direview" | "sudah_direview") {
  const idx = reports.findIndex((r) => r.id === studentId && r.taskId === taskId)
  if (idx !== -1 && reports[idx]) {
    reports[idx] = { ...reports[idx], status, updatedAt: new Date().toISOString() } as ReportItem
    listeners.forEach((l) => l(reports))
  }
}
