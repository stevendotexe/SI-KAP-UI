"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { api } from "@/trpc/react"
import { Spinner } from "@/components/ui/spinner"

type DayCell = { date: Date; inMonth: boolean; day: number }

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

// Event type colors matching siswa/aktivitas page
const EVENT_TYPE_COLORS: Record<string, string> = {
  in_class: "#3b82f6",      // blue
  field_trip: "#10b981",    // green
  meet_greet: "#f59e0b",    // amber
  meeting: "#8b5cf6",       // purple
  deadline: "#ef4444",      // red
  milestone: "#ec4899",     // pink
}

type CalendarEvent = {
  id: number
  title: string
  type: string
  startDate: Date
  endDate: Date | null
  colorHex: string | null
}

function buildWeeks(year: number, month: number) {
  const first = new Date(year, month, 1)
  const offset = first.getDay() // 0=Sunday, 1=Monday, etc.
  const start = 1 - offset
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, start + i)
    const inMonth = d.getMonth() === month
    cells.push({ date: d, inMonth, day: d.getDate() })
  }
  const weeks: DayCell[][] = []
  for (let i = 0; i < 6; i++) weeks.push(cells.slice(i * 7, i * 7 + 7))
  return weeks
}

export default function CalendarPage() {
  const now = new Date()
  const [year] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-based
  const [open, setOpen] = useState(false)

  const weeks = useMemo(() => buildWeeks(year, month), [year, month])

  // Fetch calendar events from API
  const { data, isLoading, isError, refetch } = api.calendarEvents.listForStudent.useQuery({
    month: month + 1, // API expects 1-12
    year,
  })

  // Transform API events to CalendarEvent format
  const events: CalendarEvent[] = useMemo(() => {
    if (!data?.items) return []

    return data.items.map((event) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      startDate: new Date(event.startDate),
      endDate: event.endDate ? new Date(event.endDate) : null,
      colorHex: event.colorHex,
    }))
  }, [data])

  // Get events for a specific week to render on calendar
  function getWeekSegments(week: DayCell[]) {
    if (!events || events.length === 0) return { segments: [], maxRowIndex: -1 }

    // Get the actual date range for this week
    const weekStart = week[0]?.date
    const weekEnd = week[6]?.date
    if (!weekStart || !weekEnd) return { segments: [], maxRowIndex: -1 }

    const segments = events
      .map(evt => {
        const startDate = evt.startDate
        const endDate = evt.endDate ?? evt.startDate

        // Convert to date-only strings for comparison (ignore time)
        const evtStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const evtEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        const wkStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
        const wkEnd = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate())

        // Check if event overlaps with this week
        if (evtEnd < wkStart || evtStart > wkEnd) return null

        // Calculate which days in the week to show the event
        const segStart = evtStart > wkStart ? evtStart : wkStart
        const segEnd = evtEnd < wkEnd ? evtEnd : wkEnd

        // Find indices in the week array
        const startIdx = week.findIndex(c => {
          const cellDate = new Date(c.date.getFullYear(), c.date.getMonth(), c.date.getDate())
          return cellDate.getTime() === segStart.getTime()
        })
        const endIdx = week.findIndex(c => {
          const cellDate = new Date(c.date.getFullYear(), c.date.getMonth(), c.date.getDate())
          return cellDate.getTime() === segEnd.getTime()
        })

        if (startIdx < 0 || endIdx < 0) return null

        const span = endIdx - startIdx + 1
        const leftPct = (startIdx / 7) * 100
        const widthPct = (span / 7) * 100

        // Use colorHex if available, otherwise use default color for event type
        const backgroundColor = evt.colorHex ?? EVENT_TYPE_COLORS[evt.type] ?? "#6b7280"

        return {
          startIdx,
          endIdx,
          leftPct,
          widthPct,
          label: evt.title,
          backgroundColor,
          event: evt,
        }
      })
      .filter(Boolean) as Array<{
        startIdx: number
        endIdx: number
        leftPct: number
        widthPct: number
        label: string
        backgroundColor: string
        event: CalendarEvent
      }>

    // Assign row indices to segments to prevent overlapping
    const segmentsWithRows: Array<typeof segments[0] & { rowIndex: number }> = []
    let maxRowIndex = -1

    for (const seg of segments) {
      // Find the lowest available row for this segment
      let rowIndex = 0
      while (true) {
        // Check if this row has conflicting segments (overlapping days)
        const conflict = segmentsWithRows.some(
          existing =>
            existing.rowIndex === rowIndex &&
            !(seg.endIdx < existing.startIdx || seg.startIdx > existing.endIdx)
        )
        if (!conflict) break
        rowIndex++
      }
      segmentsWithRows.push({ ...seg, rowIndex })
      if (rowIndex > maxRowIndex) maxRowIndex = rowIndex
    }

    return { segments: segmentsWithRows, maxRowIndex }
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
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground ${i === month ? "bg-accent/50" : ""
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

        {/* Loading state */}
        {isLoading && (
          <div className="mt-6 flex items-center justify-center p-12">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="mt-6 rounded-2xl border border-destructive bg-destructive/10 p-6">
            <p className="text-sm text-destructive">
              Gagal memuat kalender. Silakan coba lagi.{" "}
              <button
                onClick={() => void refetch()}
                className="underline font-medium"
              >
                Refresh
              </button>
            </p>
          </div>
        )}

        {/* Calendar card */}
        {!isLoading && !isError && (
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
                const { segments, maxRowIndex } = getWeekSegments(week)
                // Calculate dynamic height based on max overlapping events
                // Base 7rem (28) + extra space per additional slot
                const heightStyle = maxRowIndex > 2 ? { height: `${(maxRowIndex + 2) * 2.5}rem` } : undefined

                return (
                  <div key={wi} className="relative">
                    <div className="grid grid-cols-7">
                      {week.map((c, ci) => (
                        <div key={ci}
                          className={`min-h-28 border ${c.inMonth ? "bg-card" : "bg-muted/40"}`}
                          style={heightStyle}
                        >
                          <div className="px-2 pt-2 text-xs text-muted-foreground">{c.day}</div>
                        </div>
                      ))}
                    </div>

                    {segments.map((s, si) => (
                      <div
                        key={si}
                        className="absolute z-10 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white cursor-default"
                        style={{
                          top: 34 + (s.rowIndex * 32),
                          left: `${s.leftPct}%`,
                          width: `${s.widthPct}%`,
                          paddingLeft: 12,
                          paddingRight: 12,
                          backgroundColor: s.backgroundColor,
                        }}
                        title={s.label}
                      >
                        <span className="truncate">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
