"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { api } from "@/trpc/react"
import { Spinner } from "@/components/ui/spinner"

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

// Helper to get color class for events
const EVENT_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
]

function getColorClass(colorHex: string | null, index: number): string {
  return EVENT_COLORS[index % EVENT_COLORS.length]!
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

  // Transform API events to EventSpec format
  const events: EventSpec[] = useMemo(() => {
    if (!data?.items) return []

    return data.items.map((event, index) => {
      const startDate = new Date(event.startDate)
      const endDate = event.endDate ? new Date(event.endDate) : startDate

      return {
        label: event.title,
        startDay: startDate.getDate(),
        endDay: endDate.getDate(),
        colorClass: getColorClass(event.colorHex, index),
      }
    })
  }, [data])

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
                return (
                  <div key={wi} className="grid grid-cols-7">
                    {week.map((c, ci) => {
                      // Find events for this day
                      const dayEvents = c.inMonth
                        ? events.filter(evt => c.day >= evt.startDay && c.day <= evt.endDay)
                        : []

                      return (
                        <div
                          key={ci}
                          className={`h-28 border overflow-hidden ${c.inMonth ? "bg-card" : "bg-muted/40"}`}
                        >
                          <div className="px-2 pt-2 text-xs text-muted-foreground">{c.day}</div>
                          {/* Events for this day */}
                          <div className="px-1 pt-1 space-y-1 overflow-hidden">
                            {dayEvents.map((evt, ei) => (
                              <div
                                key={ei}
                                className={`${evt.colorClass} text-white text-xs px-2 py-0.5 rounded truncate`}
                              >
                                {evt.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
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
