import React from "react"
export const revalidate = 0

import AddStudentDialog from "@/components/students/AddStudentDialog"
import StudentsPageClient from "@/components/students/StudentsPageClient"

export default async function Page() {
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

        <StudentsPageClient />
      </div>
    </main>
  )
}
