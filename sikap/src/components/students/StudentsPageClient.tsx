"use client"

import React from "react"
import StudentFilters from "@/components/students/StudentFilters"
import StudentTable from "@/components/students/StudentTable"
import { api } from "@/trpc/react"
import { Spinner } from "@/components/ui/spinner"

// Map UI status labels to backend enums
function mapUIStatusToBackend(status?: string): "active" | "completed" | "canceled" | undefined {
  if (!status || status === "Semua Status") return undefined
  if (status === "Aktif") return "active"
  if (status === "Lulus") return "completed"
  if (status === "Non-Aktif" || status === "Pindah") return "canceled"
  return undefined
}

// Map backend status to UI labels
function mapBackendStatusToUI(status: string): string {
  if (status === "active") return "Aktif"
  if (status === "completed") return "Lulus"
  if (status === "canceled") return "Non-Aktif"
  return status
}

export default function StudentsPageClient() {
  const [q, setQ] = React.useState("")
  const [filters, setFilters] = React.useState<{ batch?: string; school?: string; status?: string }>({})

  // companyId is now automatically determined by the backend based on the logged-in mentor
  const { data, isLoading, isError, error, refetch } = api.students.list.useQuery({
    year: filters.batch && filters.batch !== "Semua Angkatan" ? Number(filters.batch) : undefined,
    school: filters.school && filters.school !== "Semua Sekolah" ? filters.school : undefined,
    status: mapUIStatusToBackend(filters.status),
    search: q || undefined,
    limit: 200,
  }, {
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
  })

  const rows = React.useMemo(() => {
    if (!data?.items) return []
    return data.items.map((s) => ({
      name: s.name,
      code: s.studentId,
      school: s.school ?? "-",
      batch: s.year ?? s.cohort ?? "-",
      status: mapBackendStatusToUI(s.status),
    }))
  }, [data])

  React.useEffect(() => {
    if (data?.items) {
      try {
        const snapshot = { timestamp: Date.now(), items: data.items }
        localStorage.setItem("mentor-siswa-backup", JSON.stringify(snapshot))
      } catch {}
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StudentFilters onSearchChange={setQ} onFiltersChange={setFilters} />
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <StudentFilters onSearchChange={setQ} onFiltersChange={setFilters} />
        <div className="bg-card border rounded-xl shadow-sm p-6 text-center">
          <div className="text-destructive font-medium mb-2">Gagal memuat data siswa</div>
          <div className="text-sm text-muted-foreground mb-4">{error?.message ?? "Terjadi kesalahan"}</div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-destructive text-white rounded-lg text-sm hover:bg-destructive/90"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <StudentFilters onSearchChange={setQ} onFiltersChange={setFilters} />
        <div className="bg-card border rounded-xl shadow-sm p-6 text-center">
          <div className="text-muted-foreground">Tidak ada siswa ditemukan</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StudentFilters onSearchChange={setQ} onFiltersChange={setFilters} />
      <StudentTable rows={rows} />
    </div>
  )
}
