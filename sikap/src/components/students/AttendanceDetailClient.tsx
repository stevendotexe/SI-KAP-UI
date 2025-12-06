"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import BackButton from "@/components/students/BackButton"
import { api } from "@/trpc/react"

// Map API status to display labels
function getStatusLabel(status: string): "Hadir" | "Tidak Hadir" | "Izin" | "Terlambat" {
  switch (status) {
    case "present":
      return "Hadir"
    case "absent":
      return "Tidak Hadir"
    case "excused":
      return "Izin"
    case "late":
      return "Terlambat"
    default:
      return "Tidak Hadir"
  }
}

// Map UI filter to API status enum
function mapStatusFilterToApi(status: string): "present" | "absent" | "excused" | "late" | undefined {
  switch (status) {
    case "Hadir":
      return "present"
    case "Tidak Hadir":
      return "absent"
    case "Izin":
      return "excused"
    case "Terlambat":
      return "late"
    default:
      return undefined
  }
}

export default function AttendanceDetailClient({ date }: { date: string }) {
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("Semua Status")

  // Parse date string to Date object for API
  const dateObj = React.useMemo(() => {
    const d = new Date(date)
    return isNaN(d.getTime()) ? new Date() : d
  }, [date])

  // TODO: Replace hardcoded companyId with mentor's actual company from session/profile
  const { data, isLoading, isError, refetch } = api.attendances.detail.useQuery({
    companyId: 1, // TODO: Get from mentor profile
    date: dateObj,
    status: mapStatusFilterToApi(status),
    search: q || undefined,
    limit: 200,
    offset: 0,
  })

  const list = data?.items ?? []

  return (
    <div>
      <BackButton hrefFallback="/mentor/kehadiran" />
      <h2 className="text-2xl font-semibold mt-2">Detail Kehadiran</h2>
      <p className="text-sm text-muted-foreground">
        {new Date(date).toLocaleDateString("id-ID", { weekday: "long" })} • {date}
      </p>

      <div className="mt-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari Berdasarkan Nama atau Kode" className="h-10" />
      </div>

      <div className="mt-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="min-w-60 w-full sm:w-fit">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Status">Semua Status</SelectItem>
            <SelectItem value="Hadir">Hadir</SelectItem>
            <SelectItem value="Tidak Hadir">Tidak Hadir</SelectItem>
            <SelectItem value="Izin">Izin</SelectItem>
            <SelectItem value="Terlambat">Terlambat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 bg-card border rounded-xl shadow-sm p-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Memuat data kehadiran...</div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2">
            <div className="text-sm text-destructive">Gagal memuat data kehadiran.</div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        ) : list.length === 0 ? (
          <div className="text-sm text-muted-foreground">Tidak ada data kehadiran.</div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2 px-2">
              <div className="text-sm font-medium">Kode</div>
              <div className="text-sm font-medium col-span-2">Nama</div>
              <div className="text-sm font-medium">Presensi</div>
              <div className="text-sm font-medium">Detail</div>
            </div>
            <div className="mt-2 space-y-2">
              {list.map((e) => {
                const statusLabel = getStatusLabel(e.status)
                const statusClass = 
                  e.status === "present" ? "bg-green-100 text-green-800" :
                  e.status === "late" ? "bg-yellow-100 text-yellow-800" :
                  e.status === "excused" ? "bg-blue-100 text-blue-800" :
                  "bg-red-100 text-red-800"

                return (
                  <div key={e.id} className="grid grid-cols-5 items-center gap-2 px-2 py-2 rounded-md">
                    <div className="text-sm">{e.student.code}</div>
                    <div className="text-sm col-span-2">{e.student.name}</div>
                    <div className="text-sm">
                      <span className={`inline-flex items-center justify-center rounded-sm px-2 py-0.5 text-xs ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="rounded-full">Lihat Detail</Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-none max-w-3xl">
                          <div className="p-2 space-y-2">
                            <div className="text-lg font-semibold mb-4">{e.student.name}</div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Kode Siswa</div>
                                <div className="text-sm font-medium">{e.student.code}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Status</div>
                                <div className="text-sm font-medium">
                                  <span className={`inline-flex items-center justify-center rounded-sm px-2 py-0.5 text-xs ${statusClass}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Tanggal</div>
                                <div className="text-sm font-medium">{e.date}</div>
                              </div>
                              {e.mentor && (
                                <div>
                                  <div className="text-sm text-muted-foreground">Mentor</div>
                                  <div className="text-sm font-medium">{e.mentor.name ?? "-"}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
