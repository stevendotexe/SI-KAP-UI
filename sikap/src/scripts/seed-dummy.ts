import { STUDENTS, TASKS, distributeTaskToStudents, updateStatus } from "@/lib/reports-data"

function seed() {
  for (const t of TASKS) {
    distributeTaskToStudents(t.id, t.title, t.deadline)
  }

  // Variasi status realistis: sebagian belum dikerjakan, sebagian dalam proses (belum direview), sebagian selesai
  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i]!
    for (const t of TASKS) {
      const mod = (i + TASKS.indexOf(t)) % 3
      const status = mod === 0 ? "belum_dikerjakan" : mod === 1 ? "belum_direview" : "sudah_direview"
      updateStatus(s.id, t.id, status)
    }
  }
}

seed()

