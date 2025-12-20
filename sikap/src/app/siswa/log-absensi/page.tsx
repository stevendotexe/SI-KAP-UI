"use client"

import { api } from "@/trpc/react"
import { Spinner } from "@/components/ui/spinner"

export default function LogAbsensiPage() {
  const { data, isLoading, isError } = api.attendances.myLog.useQuery({ limit: 100 })

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="w-full max-w-none p-5 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold">Log Absensi</h1>
          <p className="text-muted-foreground">Log histori absen Anda</p>
        </div>

        <div className="mt-8 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold">Histori absensi Anda</h2>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner className="size-8" />
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                Gagal memuat data absensi. Silakan coba lagi nanti.
              </div>
            ) : !data?.items.length ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada data absensi.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-destructive text-primary-foreground">
                    <th className="text-left font-medium px-4 py-3 border-r border-border last:border-r-0">Tanggal</th>
                    <th className="text-left font-medium px-4 py-3 border-r border-border last:border-r-0">Absen Masuk</th>
                    <th className="text-left font-medium px-4 py-3">Absen Keluar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((r) => {
                    const dateStr = new Date(r.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    const checkIn = r.checkInAt
                      ? new Date(r.checkInAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                      : "-"
                    const checkOut = r.checkOutAt
                      ? new Date(r.checkOutAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                      : "-"

                    return (
                      <tr key={r.id} className="bg-card hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 border-r border-border last:border-r-0 whitespace-nowrap">{dateStr}</td>
                        <td className="px-4 py-3 border-r border-border last:border-r-0">{checkIn}</td>
                        <td className="px-4 py-3">{checkOut}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
