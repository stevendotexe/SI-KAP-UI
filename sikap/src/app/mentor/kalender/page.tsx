"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronDown, Plus, Pencil, Trash2, X } from "lucide-react"
import { api } from "@/trpc/react"
import { useMentorCompany } from "@/components/mentor/useMentorCompany"
import { FileUploadField, type FileUploadValue } from "@/components/ui/file-upload-field"

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
  { value: "in_class", label: "Kelas" },
  { value: "field_trip", label: "Kunjungan Lapangan" },
  { value: "meet_greet", label: "Meet & Greet" },
  { value: "meeting", label: "Rapat" },
  { value: "deadline", label: "Tenggat Waktu" },
  { value: "milestone", label: "Milestone" },
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
}

type FormData = {
  title: string
  type: EventType
  date: string
  endDate: string
  description: string
  organizerName: string
  placementId: number | null
  attachments: FileUploadValue[]
}

const defaultFormData: FormData = {
  title: "",
  type: "meeting",
  date: "",
  endDate: "",
  description: "",
  organizerName: "",
  placementId: null,
  attachments: [],
}

export default function Page() {
  const [year, setYear] = useState(2025)
  const [month, setMonth] = useState(new Date().getMonth())
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
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

  const createMutation = api.calendarEvents.create.useMutation({
    onSuccess: () => {
      void utils.calendarEvents.list.invalidate()
      setDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = api.calendarEvents.update.useMutation({
    onSuccess: () => {
      void utils.calendarEvents.list.invalidate()
      setDialogOpen(false)
      setEditingEvent(null)
      resetForm()
    },
  })

  const deleteMutation = api.calendarEvents.delete.useMutation({
    onSuccess: () => {
      void utils.calendarEvents.list.invalidate()
      setDeleteConfirmOpen(false)
      setEventToDelete(null)
    },
  })

  function resetForm() {
    setFormData(defaultFormData)
    setEditingEvent(null)
  }

  function handleOpenCreate() {
    resetForm()
    setDialogOpen(true)
  }

  function handleOpenEdit(event: CalendarEvent) {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      type: event.type,
      date: new Date(event.startDate).toISOString().slice(0, 10),
      endDate: new Date(event.dueDate).toISOString().slice(0, 10),
      description: "",
      organizerName: event.organizerName ?? "",
      placementId: event.placementId,
      attachments: [],
    })
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (editingEvent) {
      updateMutation.mutate({
        eventId: editingEvent.id,
        title: formData.title,
        type: formData.type,
        date: new Date(formData.date),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        description: formData.description || undefined,
        organizerName: formData.organizerName || undefined,
        placementId: formData.placementId ?? undefined,
        attachments: formData.attachments.length > 0
          ? formData.attachments
          : undefined,
      })
    } else {
      createMutation.mutate({
        title: formData.title,
        type: formData.type,
        date: new Date(formData.date),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        description: formData.description || undefined,
        organizerName: formData.organizerName || undefined,
        placementId: formData.placementId ?? undefined,
        attachments: formData.attachments.length > 0
          ? formData.attachments
          : undefined,
      })
    }
  }

  // Get events for a specific week to render on calendar
  function getWeekSegments(week: DayCell[]) {
    if (!events || events.length === 0) return []

    const minDay = Math.min(...week.filter(w => w.inMonth).map(w => w.day))
    const maxDay = Math.max(...week.filter(w => w.inMonth).map(w => w.day))
    if (!isFinite(minDay) || !isFinite(maxDay)) return []

    return events
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

        const span = endIdx - startIdx + 1
        const leftPct = (startIdx / 7) * 100
        const widthPct = (span / 7) * 100

        const colorClass = evt.colorHex
          ? ""
          : EVENT_COLORS[evt.type] ?? "bg-chart-4"

        return {
          leftPct,
          widthPct,
          label: evt.title,
          colorClass,
          colorHex: evt.colorHex,
          event: evt,
        }
      })
      .filter(Boolean) as { leftPct: number; widthPct: number; label: string; colorClass: string; colorHex: string | null; event: CalendarEvent }[]
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold">Kalender</h1>
            <p className="text-muted-foreground">Daftar jadwal</p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="size-4" />
            Tambah Event
          </Button>
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
              <div className="absolute z-20 mt-2 w-44 rounded-xl border bg-card shadow-sm">
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
                const segments = getWeekSegments(week)
                return (
                  <div key={wi} className="relative">
                    <div className="grid grid-cols-7">
                      {week.map((c, ci) => (
                        <div key={ci} className={`h-28 border ${c.inMonth ? "bg-card" : "bg-muted/40"}`}>
                          <div className="px-2 pt-2 text-xs text-muted-foreground">{c.day}</div>
                        </div>
                      ))}
                    </div>

                    {segments.map((s, si) => (
                      <div
                        key={si}
                        className={`absolute z-10 h-7 ${s.colorClass} rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity`}
                        style={{
                          top: 34,
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
            <h2 className="text-lg font-semibold mb-3">Daftar Event Bulan Ini</h2>
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

      {/* Create/Edit Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Tambah Event Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Judul Event *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                placeholder="Masukkan judul event"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tipe Event *</label>
              <Select value={formData.type} onValueChange={(v) => setFormData(f => ({ ...f, type: v as EventType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Tanggal Mulai *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tanggal Selesai</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi event (opsional)"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Penyelenggara</label>
              <Input
                value={formData.organizerName}
                onChange={(e) => setFormData(f => ({ ...f, organizerName: e.target.value }))}
                placeholder="Nama penyelenggara (opsional)"
              />
            </div>

            {/* File Upload - only show when editing (needs ownerId) */}
            {editingEvent && (
              <FileUploadField
                ownerType="calendar_event"
                ownerId={editingEvent.id}
                value={formData.attachments}
                onChange={(files) => setFormData(f => ({ ...f, attachments: files }))}
                label="Lampiran"
                description="Upload file lampiran (opsional)"
                multiple
                maxFiles={5}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner className="mr-2" /> Menyimpan...</> : editingEvent ? "Simpan Perubahan" : "Tambah Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
