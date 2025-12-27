"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { api } from "@/trpc/react";

type DayCell = { date: Date; inMonth: boolean; day: number };

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
];
const WEEKDAYS_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const EVENT_TYPES = [
  { value: "in_class", label: "In-Class" },
  { value: "field_trip", label: "Field Trip" },
  { value: "meet_greet", label: "Meet & Greet" },
  { value: "meeting", label: "Meeting" },
  { value: "deadline", label: "Deadline" },
  { value: "milestone", label: "Milestone" },
] as const;

type EventType = (typeof EVENT_TYPES)[number]["value"];

const EVENT_COLORS: Record<string, string> = {
  in_class: "bg-blue-500",
  field_trip: "bg-green-500",
  meet_greet: "bg-purple-500",
  meeting: "bg-orange-500",
  deadline: "bg-red-500",
  milestone: "bg-yellow-500",
};

// Calculate contrast text color (white or black) based on background hex color
function getContrastTextColor(hexColor: string | null): string {
  if (!hexColor) return "text-white"; // Default for class-based colors

  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance using sRGB
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white text for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "text-gray-900" : "text-white";
}

function buildWeeks(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = first.getFullYear() === 1970 ? 4 : first.getDay();
  const start = 1 - offset;
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, start + i);
    cells.push({ date: d, inMonth: d.getMonth() === month, day: d.getDate() });
  }
  const weeks: DayCell[][] = [];
  for (let i = 0; i < 6; i++) weeks.push(cells.slice(i * 7, i * 7 + 7));
  return weeks;
}

type CalendarEvent = {
  id: number;
  title: string;
  type: string;
  startDate: Date;
  dueDate: Date;
  organizerName: string | null;
  colorHex: string | null;
  placementId: number | null;
  description: string | null;
  organizerLogoUrl: string | null;
};

export default function Page() {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(new Date().getMonth());
  const [open, setOpen] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<{
    event: CalendarEvent;
    position: { x: number; y: number };
  } | null>(null);

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  // Mentor calendar - no companyId needed, API will auto-detect from mentor profile
  const {
    data: events,
    isLoading,
    isError,
    refetch,
  } = api.calendarEvents.list.useQuery({
    month: month + 1, // API expects 1-12
    year: year,
  });

  // Get events for a specific week to render on calendar
  function getWeekSegments(week: DayCell[]) {
    if (!events || events.length === 0) return { segments: [], maxSlot: 0 };

    const minDay = Math.min(...week.filter((w) => w.inMonth).map((w) => w.day));
    const maxDay = Math.max(...week.filter((w) => w.inMonth).map((w) => w.day));
    if (!isFinite(minDay) || !isFinite(maxDay))
      return { segments: [], maxSlot: 0 };

    // 1. Convert events to raw segments
    const rawSegments = events
      .map((evt) => {
        const startDate = new Date(evt.startDate);
        const endDate = new Date(evt.dueDate);

        // Check if event is in current month
        if (startDate.getMonth() !== month && endDate.getMonth() !== month)
          return null;

        const startDay =
          startDate.getMonth() === month ? startDate.getDate() : 1;
        const endDay =
          endDate.getMonth() === month
            ? endDate.getDate()
            : new Date(year, month + 1, 0).getDate();

        const segStartDay = Math.max(startDay, minDay);
        const segEndDay = Math.min(endDay, maxDay);
        if (segStartDay > segEndDay) return null;

        const startIdx = week.findIndex(
          (c) => c.inMonth && c.day === segStartDay,
        );
        const endIdx = week.findIndex((c) => c.inMonth && c.day === segEndDay);
        if (startIdx < 0 || endIdx < 0) return null;

        return {
          startIdx, // 0-6
          endIdx, // 0-6
          span: endIdx - startIdx + 1,
          leftPct: (startIdx / 7) * 100,
          widthPct: ((endIdx - startIdx + 1) / 7) * 100,
          label: evt.title,
          colorClass: evt.colorHex
            ? ""
            : (EVENT_COLORS[evt.type] ?? "bg-chart-4"),
          colorHex: evt.colorHex,
          event: evt,
        };
      })
      .filter((s): s is NonNullable<typeof s> => !!s)
      .sort((a, b) => {
        // Sort by start index, then span (longer first)
        if (a.startIdx !== b.startIdx) return a.startIdx - b.startIdx;
        return b.span - a.span;
      });

    // 2. Assign slots to prevent overlap
    const slots: number[][] = Array(7)
      .fill([])
      .map(() => []); // 7 days in a week
    const segmentsWithSlot: ((typeof rawSegments)[0] & { slot: number })[] = [];
    const maxSlot = -1;

    for (const seg of rawSegments) {
      // Find first available slot for this segment's duration
      let slot = 0;
      while (true) {
        let fit = true;
        for (let i = seg.startIdx; i <= seg.endIdx; i++) {
          const daySlots = slots[i];
          if (daySlots && daySlots[slot]) {
            fit = false;
            break;
          }
        }
        if (fit) break;
        slot++;
      }

      // Mark slot as occupied
      for (let i = seg.startIdx; i <= seg.endIdx; i++) {
        const row = slots[i];
        if (row) row[slot] = 1;
      }
    }

    return { segments: segmentsWithSlot, maxSlot };
  }

  return (
    <div className="bg-muted/30 min-h-screen p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold sm:text-3xl">Kalender</h1>
            <p className="text-muted-foreground">Daftar jadwal</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative inline-block">
            <Button
              variant="outline"
              onClick={() => setOpen((v) => !v)}
              className="cursor-pointer px-4"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              {MONTHS_ID[month]}
              <ChevronDown className="ml-2 size-4" />
            </Button>

            {open && (
              <div className="bg-card absolute z-20 mt-2 w-44 rounded-md border shadow-sm">
                <ul className="max-h-64 overflow-auto py-1" role="listbox">
                  {MONTHS_ID.map((m, i) => (
                    <li key={m}>
                      <button
                        type="button"
                        onClick={() => {
                          setMonth(i);
                          setOpen(false);
                        }}
                        className={`hover:bg-accent hover:text-accent-foreground w-full cursor-pointer px-3 py-2 text-left text-sm ${i === month ? "bg-accent/50" : ""}`}
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

          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <Spinner /> Memuat kalender...
          </div>
        ) : isError ? (
          <div className="mt-4 flex flex-col items-start gap-2">
            <div className="text-destructive text-sm">
              Gagal memuat kalender.
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          <section className="bg-card mt-4 rounded-2xl border p-4 sm:p-6">
            <div className="grid grid-cols-7 overflow-hidden rounded-xl">
              {WEEKDAYS_ID.map((d) => (
                <div
                  key={d}
                  className="bg-destructive text-primary-foreground border-r px-3 py-2 text-center font-medium last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-0">
              {weeks.map((week, wi) => {
                const { segments, maxSlot } = getWeekSegments(week);
                // Calculate dynamic height based on max overlapping events
                const heightStyle =
                  maxSlot > 2
                    ? { height: `${(maxSlot + 2) * 2.5}rem` }
                    : undefined;

                return (
                  <div key={wi} className="relative">
                    <div className="grid grid-cols-7">
                      {week.map((c, ci) => (
                        <div
                          key={ci}
                          className={`min-h-28 border ${c.inMonth ? "bg-card" : "bg-muted/40"}`}
                          style={heightStyle}
                        >
                          <div className="text-muted-foreground px-2 pt-2 text-xs">
                            {c.day}
                          </div>
                        </div>
                      ))}
                    </div>

                    {segments.map((s, si) => (
                      <div
                        key={si}
                        className={`absolute z-10 h-7 ${s.colorClass} flex items-center justify-center rounded-full text-xs font-medium ${getContrastTextColor(s.colorHex)} cursor-default transition-opacity hover:opacity-90`}
                        style={{
                          top: 34 + s.slot * 32,
                          left: `${s.leftPct}%`,
                          width: `${s.widthPct}%`,
                          paddingLeft: 12,
                          paddingRight: 12,
                          backgroundColor: s.colorHex ?? undefined,
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredEvent({
                            event: s.event as CalendarEvent,
                            position: {
                              x: rect.left + rect.width / 2,
                              y: rect.bottom + 8,
                            },
                          });
                        }}
                        onMouseLeave={() => setHoveredEvent(null)}
                      >
                        <span className="truncate">{s.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Hover Popover for Event Details */}
            {hoveredEvent && (
              <div
                className="bg-card pointer-events-none fixed z-50 w-72 rounded-xl border p-4 shadow-lg"
                style={{
                  left: Math.min(
                    hoveredEvent.position.x - 144,
                    window.innerWidth - 300,
                  ),
                  top: hoveredEvent.position.y,
                }}
              >
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {hoveredEvent.event.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${!hoveredEvent.event.colorHex ? (EVENT_COLORS[hoveredEvent.event.type] ?? "bg-gray-400") : ""}`}
                      style={{
                        backgroundColor:
                          hoveredEvent.event.colorHex ?? undefined,
                      }}
                    />
                    <span className="text-muted-foreground text-sm">
                      {EVENT_TYPES.find(
                        (t) => t.value === hoveredEvent.event.type,
                      )?.label ?? hoveredEvent.event.type}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {new Date(hoveredEvent.event.startDate).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                    {hoveredEvent.event.dueDate &&
                      new Date(hoveredEvent.event.dueDate).getTime() !==
                        new Date(hoveredEvent.event.startDate).getTime() && (
                        <>
                          {" "}
                          -{" "}
                          {new Date(
                            hoveredEvent.event.dueDate,
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </>
                      )}
                  </div>
                  {hoveredEvent.event.organizerName && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Penyelenggara:
                      </span>{" "}
                      {hoveredEvent.event.organizerName}
                    </div>
                  )}
                  {hoveredEvent.event.description && (
                    <div className="text-muted-foreground line-clamp-3 text-sm">
                      {hoveredEvent.event.description}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Event List */}
        {events && events.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-lg font-semibold">
              Daftar Aktivitas Bulan Ini
            </h2>
            <div className="space-y-2">
              {events.map((event) => {
                const colorClass = event.colorHex
                  ? ""
                  : (EVENT_COLORS[event.type] ?? "bg-chart-4");
                const typeLabel =
                  EVENT_TYPES.find((t) => t.value === event.type)?.label ??
                  event.type;

                return (
                  <div
                    key={event.id}
                    className="bg-card flex items-center justify-between rounded-xl border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${colorClass}`}
                        style={{ backgroundColor: event.colorHex ?? undefined }}
                      />
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-muted-foreground text-sm">
                          {typeLabel} •{" "}
                          {new Date(event.startDate).toLocaleDateString(
                            "id-ID",
                          )}
                          {event.dueDate &&
                            new Date(event.dueDate).getTime() !==
                              new Date(event.startDate).getTime() && (
                              <>
                                {" "}
                                -{" "}
                                {new Date(event.dueDate).toLocaleDateString(
                                  "id-ID",
                                )}
                              </>
                            )}
                        </div>
                        {event.organizerName && (
                          <div className="text-muted-foreground text-xs">
                            Penyelenggara: {event.organizerName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
