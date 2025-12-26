"use client";

import { useMemo } from "react";

interface JournalEntry {
  id: number;
  activityDate: string | null;
  reviewStatus: "pending" | "approved" | "rejected";
}

interface JournalCalendarViewProps {
  year: number;
  month: number; // 1-12
  entries: JournalEntry[];
  selectedDate?: string | null; // Currently selected date (YYYY-MM-DD)
  onDayClick?: (date: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const DAYS_OF_WEEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function JournalCalendarView({
  year,
  month,
  entries,
  selectedDate,
  onDayClick,
  onMonthChange,
}: JournalCalendarViewProps) {
  // Build a map of date -> entry for quick lookup
  const entryMap = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    entries.forEach((e) => {
      if (e.activityDate) {
        map.set(e.activityDate, e);
      }
    });
    return map;
  }, [entries]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: Array<{ date: string; day: number } | null> = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({ date: dateStr, day });
    }

    return days;
  }, [year, month]);

  // Get status color for a date
  function getStatusColor(date: string): string {
    const entry = entryMap.get(date);
    if (!entry) return "bg-gray-100 text-gray-400"; // No entry
    switch (entry.reviewStatus) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-300";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-400";
    }
  }

  // Check if date is today
  function isToday(date: string): boolean {
    return date === new Date().toISOString().slice(0, 10);
  }

  // Check if date is in the future
  function isFuture(date: string): boolean {
    return new Date(date) > new Date();
  }

  // Navigate to previous month
  function prevMonth() {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onMonthChange?.(newYear, newMonth);
  }

  // Navigate to next month
  function nextMonth() {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onMonthChange?.(newYear, newMonth);
  }

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold">
          {monthNames[month - 1]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const { date, day } = dayData;
          const statusColor = getStatusColor(date);
          const today = isToday(date);
          const future = isFuture(date);
          const isSelected = selectedDate === date;

          return (
            <button
              key={date}
              onClick={() => !future && onDayClick?.(date)}
              disabled={future}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                border transition-all
                ${statusColor}
                ${isSelected ? "ring-2 ring-red-500 ring-offset-1" : ""}
                ${today && !isSelected ? "ring-2 ring-red-500 ring-offset-1" : ""}
                ${future ? "opacity-40 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span>Disetujui</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          <span>Menunggu</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          <span>Ditolak</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100" />
          <span>Belum diisi</span>
        </div>
      </div>
    </div>
  );
}
