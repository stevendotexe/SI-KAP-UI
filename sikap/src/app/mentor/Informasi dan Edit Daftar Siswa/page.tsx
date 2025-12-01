import React from "react"

import AddStudentDialog from "@/components/students/AddStudentDialog"
import StudentFilters from "@/components/students/StudentFilters"
import StudentTable, { type StudentRow } from "@/components/students/StudentTable"

export default async function Page() {
  const rows: StudentRow[] = [
    { name: "Rafif Zharif", code: "STD-001", school: "SMK 13 Tasikmalaya", batch: 2025, status: "Aktif" },
    { name: "Rafif Zharif", code: "STD-001", school: "SMK 13 Tasikmalaya", batch: 2025, status: "Aktif" },
    { name: "Rafif Zharif", code: "STD-001", school: "SMK 13 Tasikmalaya", batch: 2025, status: "Aktif" },
    { name: "Rafif Zharif", code: "STD-001", school: "SMK 13 Tasikmalaya", batch: 2025, status: "Aktif" },
    { name: "Rafif Zharif", code: "STD-001", school: "SMK 13 Tasikmalaya", batch: 2025, status: "Aktif" },
  ]

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold">Siswa</h1>
              <p className="text-sm text-muted-foreground mt-1">Daftar Siswa PKL</p>
            </div>
            <AddStudentDialog />
          </div>
        </header>

        <div className="space-y-6">
          <StudentFilters />
          <StudentTable rows={rows} />
        </div>
      </div>
    </main>
  )
}

