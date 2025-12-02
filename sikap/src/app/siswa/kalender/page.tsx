"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { api } from "@/trpc/react"

type DayCell = { date: Date; inMonth: boolean; day: number }
type EventSpec = {
  label: string
  startDay: number
  endDay: number
  colorClass: string // e.g. "bg-chart-4", "bg-chart-5"
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]
const WEEKDAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

function buildWeeks(year: number, month: number) {
  const first = new Date(year, month, 1)
  const offset = first.getFullYear() === 1970 ? 4 : first.getDay() // 0=Sun
  const start = 1 - offset
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, start + i)
    cells.push({ date: d, inMonth: d.getMonth() === month, day: d.getDate() })
  }
  const weeks: DayCell[][] = []
  for (let i = 0; i < 6; i++) weeks.push(cells.slice(i * 7, i * 7 + 7))
  return weeks
}

// Simple mapping when event.colorHex not used
function typeToColorClass(t?: string): string {
  switch (t) {
    case "deadline":
      return "bg-chart-5"
    case "meeting":
      return "bg-chart-2"
    case "field_trip":
      return "bg-chart-4"
    case "milestone":
      return "bg-chart-1"
    case "in_class":
      return "bg-chart-3"
    case "meet_greet":
      return "bg-chart-2"
    default:
      return "bg-chart-4"
  }
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-based
  const [open, setOpen] = useState(false)
  const [companyId] = useState<number>(1) // sesuaikan jika ada konteks company

  const weeks = useMemo(() => buildWeeks(year, month), [year, month])

  // Nonaktifkan query agar tidak memicu console error
  const { data } = api.calendarEvents.list.useQuery(
    { companyId, month: month + 1, year },
    { retry: 0, enabled: false }
  )

  const fetchedEvents: EventSpec[] = useMemo(() => {
    if (!data) return []
    return data.map((ev) => {
      const sd = new Date(ev.startDate)
      const ed = new Date(ev.dueDate)
      return {
        label: ev.title,
        startDay: sd.getDate(),
        endDay: ed.getDate(),
        colorClass: typeToColorClass(ev.type),
      }
    })
  }, [data])

  const fallbackEvents: EventSpec[] = [
    { label: "Tenggat waktu laporan 3", startDay: 1, endDay: 4, colorClass: "bg-chart-4" },
    { label: "Tenggat waktu laporan 4", startDay: 19, endDay: 21, colorClass: "bg-chart-5" },
  ]

  const events: EventSpec[] = fetchedEvents.length ? fetchedEvents : fallbackEvents

  // Compute event segments per week for overlay
  function getWeekSegments(week: DayCell[]) {
    const minDay = Math.min(...week.filter(w => w.inMonth).map(w => w.day))
    const maxDay = Math.max(...week.filter(w => w.inMonth).map(w => w.day))
    if (!isFinite(minDay) || !isFinite(maxDay)) return []

    return events
      .map(evt => {
        const segStartDay = Math.max(evt.startDay, minDay)
        const segEndDay = Math.min(evt.endDay, maxDay)
        if (segStartDay > segEndDay) return null

        const startIdx = week.findIndex(c => c.inMonth && c.day === segStartDay)
        const endIdx = week.findIndex(c => c.inMonth && c.day === segEndDay)
        if (startIdx < 0 || endIdx < 0) return null

        const span = endIdx - startIdx + 1
        const leftPct = (startIdx / 7) * 100
        const widthPct = (span / 7) * 100

        return {
          leftPct,
          widthPct,
          label: evt.label,
          colorClass: evt.colorClass,
        }
      })
      .filter(Boolean) as { leftPct: number; widthPct: number; label: string; colorClass: string }[]
  }

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-5 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold">Kalender</h1>
          <p className="text-muted-foreground">Daftar jadwal</p>
        </div>

        {/* Controls */}
        <div className="mt-4">
          <div className="relative inline-block">
            <Button
              variant="outline"
              onClick={() => setOpen(v => !v)}
              className="px-4"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              {MONTHS_ID[month]} {year}
              <ChevronDown className="ml-2 size-4" />
            </Button>

            {open && (
              <div className="absolute z-20 mt-2 w-44 rounded-xl border bg-card shadow-sm">
                <ul className="max-h-64 overflow-auto py-1" role="listbox">
                  {MONTHS_ID.map((m, i) => (
                    <li key={m}>
                      <button
                        type="button"
                        onClick={() => {
                          setMonth(i)
                          setOpen(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground ${i === month ? "bg-accent/50" : ""}`}
                        role="option"
                        aria-selected={i === month}
                      >
                        {m}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Calendar card */}
        <section className="mt-4 rounded-2xl border bg-card p-4 sm:p-6">
          {/* Weekday header */}
          <div className="grid grid-cols-7 rounded-xl overflow-hidden">
            {WEEKDAYS_ID.map((d) => (
              <div
                key={d}
                className="bg-destructive text-primary-foreground px-3 py-2 text-center font-medium border-r last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="mt-0">
            {weeks.map((week, wi) => {
              const segments = getWeekSegments(week)
              return (
                <div key={wi} className="relative">
                  {/* day cells */}
                  <div className="grid grid-cols-7">
                    {week.map((c, ci) => (
                      <div
                        key={ci}
                        className={`h-28 border ${c.inMonth ? "bg-card" : "bg-muted/40"}`}
                      >
                        <div className="px-2 pt-2 text-xs text-muted-foreground">{c.day}</div>
                      </div>
                    ))}
                  </div>

                  {/* event overlays */}
                  {segments.map((s, si) => (
                    <div
                      key={si}
                      className={`absolute z-10 pointer-events-none h-7 ${s.colorClass} rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground`}
                      style={{
                        top: 34,
                        left: `${s.leftPct}%`,
                        width: `${s.widthPct}%`,
                        paddingLeft: 12,
                        paddingRight: 12,
                      }}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
