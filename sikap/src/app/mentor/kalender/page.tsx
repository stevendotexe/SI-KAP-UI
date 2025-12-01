"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TASKS, getReports, type ReportItem } from "@/lib/reports-data"

type CalendarTask = { id: string; title: string; deadline: string; status: "Selesai" | "Dalam Proses" | "Belum Mulai" }

function bulanNama(i: number) {
  const names = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]
  return names[i]!
}

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1)
  const days = [] as Array<{ day: number; date: Date }>
  while (date.getMonth() === month) {
    days.push({ day: date.getDate(), date: new Date(date) })
    date.setDate(date.getDate() + 1)
  }
  return days
}

function computeTaskStatus(taskId: string, reports: ReportItem[]): CalendarTask["status"] {
  const related = reports.filter((r) => r.taskId === taskId)
  if (!related.length) return "Belum Mulai"
  const anyBelumDikerjakan = related.some((r) => r.status === "belum_dikerjakan")
  const allSudah = related.every((r) => r.status === "sudah_direview")
  const anyBelumDireview = related.some((r) => r.status === "belum_direview")
  if (allSudah) return "Selesai"
  if (anyBelumDireview) return "Dalam Proses"
  if (anyBelumDikerjakan) return "Belum Mulai"
  return "Belum Mulai"
}

async function fetchCalendarTasks(): Promise<CalendarTask[]> {
  const reports = getReports()
  return TASKS.map((t) => ({ id: t.id, title: t.title, deadline: t.deadline, status: computeTaskStatus(t.id, reports) }))
}

export default function Page() {
  const now = new Date()
  const [month, setMonth] = React.useState(now.getMonth())
  const [year] = React.useState(now.getFullYear())
  const [tasks, setTasks] = React.useState<CalendarTask[]>([])

  React.useEffect(() => {
    void fetchCalendarTasks().then(setTasks)
  }, [])

  const days = getDaysInMonth(year, month)
  const firstDayIndex = new Date(year, month, 1).getDay() // 0 Minggu

  const byDate = React.useMemo(() => {
    const map = new Map<number, CalendarTask[]>()
    for (const t of tasks) {
      const d = new Date(t.deadline)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        const arr = map.get(day) ?? []
        arr.push(t)
        map.set(day, arr)
      }
    }
    return map
  }, [tasks, year, month])

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold">Kalender</h1>
        <p className="text-sm text-muted-foreground">Daftar Jadwal</p>

        <div className="mt-4">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="min-w-[240px] w-full sm:w-fit">
              <SelectValue placeholder={bulanNama(month)} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={String(i)}>{bulanNama(i)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 bg-card border rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-7 text-center font-medium">
            {[
              "Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu",
            ].map((d, i) => (
              <div key={i} className="py-2 bg-destructive text-white rounded-(--radius-sm)">{d}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`pad-${i}`} className="h-24 rounded-(--radius-sm) border bg-background" />
            ))}
            {days.map((d) => {
              const items = byDate.get(d.day) ?? []
              return (
                <div key={d.day} className="h-24 rounded-(--radius-sm) border p-2 flex flex-col gap-1 bg-background">
                  <div className="text-xs font-medium">{d.day}</div>
                  <div className="flex-1 overflow-hidden">
                    {items.map((t, idx) => (
                      <div
                        key={idx}
                        className={`text-[10px] px-2 py-1 rounded-(--radius-sm) whitespace-nowrap overflow-hidden text-ellipsis ${
                          t.status === "Selesai" ? "bg-green-100 text-green-800" : t.status === "Dalam Proses" ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-800"
                        }`}
                        title={`${t.title} • ${t.deadline} • ${t.status}`}
                      >
                        {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
