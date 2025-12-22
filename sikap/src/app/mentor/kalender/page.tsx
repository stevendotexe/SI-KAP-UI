"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown, Pencil, Trash2 } from "lucide-react"
import { api } from "@/trpc/react"
import { useMentorCompany } from "@/components/mentor/useMentorCompany"
import ActivityFormDialog from "@/components/mentor/ActivityFormDialog"

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

const EVENT_TYPES = [
  { value: "in_class", label: "In-Class" },
  { value: "field_trip", label: "Field Trip" },
  { value: "meet_greet", label: "Meet & Greet" },
] as const

type EventType = typeof EVENT_TYPES[number]["value"]

const EVENT_COLORS: Record<EventType, string> = {
  in_class: "bg-blue-500",
  field_trip: "bg-green-500",
  meet_greet: "bg-purple-500",
  meeting: "bg-orange-500",
  deadline: "bg-red-500",
  milestone: "bg-yellow-500",
}

function buildWeeks(year: number, month: number) {
  const first = new Date(year, month, 1)
  const offset = first.getFullYear() === 1970 ? 4 : first.getDay()
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

type CalendarEvent = {
  id: number
  title: string
  type: EventType
  startDate: Date
  dueDate: Date
  organizerName: string | null
  colorHex: string | null
  placementId: number | null
  description: string | null
  organizerLogoUrl: string | null
}



export default function Page() {
  const [year, setYear] = useState(2025)
  const [month, setMonth] = useState(new Date().getMonth())
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null)

  const weeks = useMemo(() => buildWeeks(year, month), [year, month])

  const utils = api.useUtils()

  const { companyId, isLoading: isMentorLoading, isError: isMentorError } = useMentorCompany()
  const { data: events, isLoading, isError, refetch } = api.calendarEvents.list.useQuery({
    companyId: companyId!,
    month: month + 1, // API expects 1-12
    year: year,
  }, { enabled: !!companyId })

  const deleteMutation = api.calendarEvents.delete.useMutation({
    onSuccess: () => {
      void utils.calendarEvents.list.invalidate()
      setDeleteConfirmOpen(false)
      setEventToDelete(null)
    },
  })

  function handleOpenEdit(event: CalendarEvent) {
    setEditingEvent(event)
    setDialogOpen(true)
  }

  function handleDelete(event: CalendarEvent) {
    setEventToDelete(event)
    setDeleteConfirmOpen(true)
  }

  function confirmDelete() {
    if (eventToDelete) {
      deleteMutation.mutate({ eventId: eventToDelete.id })
    }
  }

  // Get events for a specific week to render on calendar
  function getWeekSegments(week: DayCell[]) {
    if (!events || events.length === 0) return { segments: [], maxSlot: 0 }

    const minDay = Math.min(...week.filter(w => w.inMonth).map(w => w.day))
    const maxDay = Math.max(...week.filter(w => w.inMonth).map(w => w.day))
    if (!isFinite(minDay) || !isFinite(maxDay)) return { segments: [], maxSlot: 0 }

    // 1. Convert events to raw segments
    const rawSegments = events
      .map(evt => {
        const startDate = new Date(evt.startDate)
        const endDate = new Date(evt.dueDate)

        // Check if event is in current month
        if (startDate.getMonth() !== month && endDate.getMonth() !== month) return null

        const startDay = startDate.getMonth() === month ? startDate.getDate() : 1
        const endDay = endDate.getMonth() === month ? endDate.getDate() : new Date(year, month + 1, 0).getDate()

        const segStartDay = Math.max(startDay, minDay)
        const segEndDay = Math.min(endDay, maxDay)
        if (segStartDay > segEndDay) return null

        const startIdx = week.findIndex(c => c.inMonth && c.day === segStartDay)
        const endIdx = week.findIndex(c => c.inMonth && c.day === segEndDay)
        if (startIdx < 0 || endIdx < 0) return null

        return {
          startIdx, // 0-6
          endIdx,   // 0-6
          span: endIdx - startIdx + 1,
          leftPct: (startIdx / 7) * 100,
          widthPct: ((endIdx - startIdx + 1) / 7) * 100,
          label: evt.title,
          colorClass: evt.colorHex ? "" : EVENT_COLORS[evt.type] ?? "bg-chart-4",
          colorHex: evt.colorHex,
          event: evt,
        }
      })
      .filter((s): s is NonNullable<typeof s> => !!s)
      .sort((a, b) => {
        // Sort by start index, then span (longer first)
        if (a.startIdx !== b.startIdx) return a.startIdx - b.startIdx
        return b.span - a.span
      })

    // 2. Assign slots to prevent overlap
    const slots: number[][] = Array(7).fill([]).map(() => []) // 7 days in a week
    const segmentsWithSlot: (typeof rawSegments[0] & { slot: number })[] = []
    let maxSlot = -1

    for (const seg of rawSegments) {
      // Find first available slot for this segment's duration
      let slot = 0
      while (true) {
        let fit = true
        for (let i = seg.startIdx; i <= seg.endIdx; i++) {
          if (slots[i][slot]) {
            fit = false
            break
          }
        }
        if (fit) break
        slot++
      }

      // Mark slot as occupied
      for (let i = seg.startIdx; i <= seg.endIdx; i++) {
        slots[i][slot] = 1
      }

      if (slot > maxSlot) maxSlot = slot
      segmentsWithSlot.push({ ...seg, slot })
    }

    return { segments: segmentsWithSlot, maxSlot }
  }

  // const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold">Kalender</h1>
            <p className="text-muted-foreground">Daftar jadwal</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
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
              <div className="absolute z-20 mt-2 w-44 rounded-md border bg-card shadow-sm">
                <ul className="max-h-64 overflow-auto py-1" role="listbox">
                  {MONTHS_ID.map((m, i) => (
                    <li key={m}>
                      <button
                        type="button"
                        onClick={() => { setMonth(i); setOpen(false) }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer ${i === month ? "bg-accent/50" : ""}`}
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

          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isMentorLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Memuat profil mentor...
          </div>
        ) : isMentorError ? (
          <div className="mt-4 text-sm text-destructive">Gagal memuat profil mentor.</div>
        ) : isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Memuat kalender...
          </div>
        ) : isError ? (
          <div className="mt-4 flex flex-col items-start gap-2">
            <div className="text-sm text-destructive">Gagal memuat kalender.</div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        ) : (
          <section className="mt-4 rounded-2xl border bg-card p-4 sm:p-6">
            <div className="grid grid-cols-7 rounded-xl overflow-hidden">
              {WEEKDAYS_ID.map((d) => (
                <div key={d} className="bg-destructive text-primary-foreground px-3 py-2 text-center font-medium border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-0">
              {weeks.map((week, wi) => {
                const { segments, maxSlot } = getWeekSegments(week)
                // Calculate dynamic height based on max overlapping events
                // Base 7rem (28) + extra space per additional slot
                const heightStyle = maxSlot > 2 ? { height: `${(maxSlot + 2) * 2.5}rem` } : undefined

                return (
                  <div key={wi} className="relative">
                    <div className="grid grid-cols-7">
                      {week.map((c, ci) => (
                        <div
                          key={ci}
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
                        className={`absolute z-10 h-7 ${s.colorClass} rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity`}
                        style={{
                          top: 34 + (s.slot * 32), // Dynamic top: Base 34 + 32px per slot
                          left: `${s.leftPct}%`,
                          width: `${s.widthPct}%`,
                          paddingLeft: 12,
                          paddingRight: 12,
                          backgroundColor: s.colorHex ?? undefined,
                        }}
                        onClick={() => handleOpenEdit(s.event)}
                        title="Klik untuk edit"
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

        {/* Event List */}
        {events && events.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Daftar Aktivitas Bulan Ini</h2>
            <div className="space-y-2">
              {events.map((event) => {
                const colorClass = event.colorHex
                  ? ""
                  : EVENT_COLORS[event.type] ?? "bg-chart-4"
                const typeLabel = EVENT_TYPES.find(t => t.value === event.type)?.label ?? event.type

                return (
                  <div key={event.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${colorClass}`}
                        style={{ backgroundColor: event.colorHex ?? undefined }}
                      />
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {typeLabel} • {new Date(event.startDate).toLocaleDateString("id-ID")}
                          {event.dueDate && new Date(event.dueDate).getTime() !== new Date(event.startDate).getTime() && (
                            <> - {new Date(event.dueDate).toLocaleDateString("id-ID")}</>
                          )}
                        </div>
                        {event.organizerName && (
                          <div className="text-xs text-muted-foreground">Penyelenggara: {event.organizerName}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(event)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(event)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Edit Activity Dialog */}
      <ActivityFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingEvent(null)
          }
        }}
        editingEvent={editingEvent}
        onSuccess={() => {
          void utils.calendarEvents.list.invalidate()
          setDialogOpen(false)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus event &quot;{eventToDelete?.title}&quot;? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <><Spinner className="mr-2" /> Menghapus...</> : "Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
