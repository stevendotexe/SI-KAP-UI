"use client"

import React from "react"
import StudentFilters from "@/components/students/StudentFilters"
import StudentTable from "@/components/students/StudentTable"
import { STUDENTS } from "@/lib/reports-data"

export default function StudentsPageClient() {
  const [q, setQ] = React.useState("")
  const [filters, setFilters] = React.useState<{ batch?: string; school?: string; status?: string }>({})

  const rows = React.useMemo(() => {
    return STUDENTS.filter((s) => (filters.status && filters.status !== "Semua Status" ? s.state === filters.status : true))
      .filter((s) => (filters.school && filters.school !== "Semua Sekolah" ? s.school === filters.school : true))
      .filter((s) => (filters.batch && filters.batch !== "Semua Angkatan" ? String(s.batch) === filters.batch : true))
      .filter((s) => (q ? (s.student + s.id).toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((s) => ({ name: s.student, code: s.id, school: s.school, batch: s.batch, status: s.state }))
  }, [q, filters])

  return (
    <div className="space-y-6">
      <StudentFilters onSearchChange={setQ} onFiltersChange={setFilters} />
      <StudentTable rows={rows} />
    </div>
  )
}

