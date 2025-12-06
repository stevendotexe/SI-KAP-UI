"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Loader2, AlertCircle } from "lucide-react"
import { api } from "@/trpc/react"

type DayCell = { date: Date; inMonth: boolean; day: number }
type EventSpec = {
  label: string
  startDate: Date
  endDate: Date
  startDay: number
  endDay: number
  startMonth: number
  endMonth: number
  startYear: number
  endYear: number
  colorHex: string | null
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

// Event type to color mapping
const EVENT_TYPE_COLORS: Record<string, string> = {
  deadline: "bg-red-500",
  milestone: "bg-purple-500",
  meeting: "bg-blue-500",
  in_class: "bg-green-500",
  field_trip: "bg-orange-500",
  meet_greet: "bg-pink-500",
}

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

export default function AdminKalenderPage() {
  const now = new Date()
  const [year] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-based
  const [open, setOpen] = useState(false)

  // Fetch events from backend
  const { data: eventsData, isLoading, error } = api.calendarEvents.listForAdmin.useQuery({
    month: month + 1, // API expects 1-based month
    year,
  })

  const weeks = useMemo(() => buildWeeks(year, month), [year, month])

  // Convert API events to EventSpec format for display
  const events: EventSpec[] = useMemo(() => {
    if (!eventsData) return []

    return eventsData.map((event) => {
      const startDate = new Date(event.startDate)
      const endDate = new Date(event.endDate)

      return {
        label: event.title,
        startDate: startDate,
        endDate: endDate,
        startDay: startDate.getDate(),
        endDay: endDate.getDate(),
        startMonth: startDate.getMonth(),
        endMonth: endDate.getMonth(),
        startYear: startDate.getFullYear(),
        endYear: endDate.getFullYear(),
        colorHex: event.colorHex,
        colorClass: event.colorHex
          ? "" // Use inline style instead of dynamic Tailwind class
          : EVENT_TYPE_COLORS[event.type] || "bg-chart-4",
      }
    })
  }, [eventsData])

  // Compute event segments per week for overlay
  function getWeekSegments(week: DayCell[]) {
    const inMonthCells = week.filter(w => w.inMonth)
    if (inMonthCells.length === 0) return []

    // Normalize dates to compare only date part (no time)
    const normalizeDate = (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      return d
    }

    const weekStart = normalizeDate(inMonthCells[0]!.date)
    const weekEnd = normalizeDate(inMonthCells[inMonthCells.length - 1]!.date)

    return events
      .map(evt => {
        const evtStart = normalizeDate(evt.startDate)
        const evtEnd = normalizeDate(evt.endDate)

        // Check if event overlaps with this week
        if (evtStart > weekEnd || evtEnd < weekStart) return null

        // Find the actual start and end within this week
        const segStart = evtStart > weekStart ? evtStart : weekStart
        const segEnd = evtEnd < weekEnd ? evtEnd : weekEnd

        // Find cell indices
        const startIdx = week.findIndex(c => {
          if (!c.inMonth) return false
          const cellDate = normalizeDate(c.date)
          return cellDate.getTime() === segStart.getTime()
        })
        
        const endIdx = week.findIndex(c => {
          if (!c.inMonth) return false
          const cellDate = normalizeDate(c.date)
          return cellDate.getTime() === segEnd.getTime()
        })

        if (startIdx < 0) return null
        const actualEndIdx = endIdx >= 0 ? endIdx : week.length - 1

        const span = actualEndIdx - startIdx + 1
        const leftPct = (startIdx / 7) * 100
        const widthPct = (span / 7) * 100

        return {
          leftPct,
          widthPct,
          label: evt.label,
          colorClass: evt.colorClass,
          colorHex: evt.colorHex,
        }
      })
      .filter(Boolean) as { leftPct: number; widthPct: number; label: string; colorClass: string; colorHex: string | null }[]
  }

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
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
              className="px-4 cursor-pointer"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              {MONTHS_ID[month]}
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
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer ${i === month ? "bg-accent/50" : ""
                          }`}
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
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Memuat kalender...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12 text-destructive">
              <AlertCircle className="size-6 mr-2" />
              <span>Gagal memuat kalender: {error.message}</span>
            </div>
          )}

          {/* Calendar Grid */}
          {!isLoading && !error && (
            <>
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
                            backgroundColor: s.colorHex || undefined,
                          }}
                        >
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Empty State */}
              {eventsData?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Tidak ada event di bulan ini
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
