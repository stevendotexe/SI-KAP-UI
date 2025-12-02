import React from "react"
import AttendanceDetailClient from "@/components/students/AttendanceDetailClient"

type Entry = { code: string; name: string; status: "Hadir" | "Tidak Hadir" | "Izin"; checkIn?: string; checkOut?: string; note?: string; proof?: string }

export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const students = [
    { code: "STD-001", name: "Alya Putri" },
    { code: "STD-002", name: "Bagus Pratama" },
    { code: "STD-003", name: "Citra Dewi" },
    { code: "STD-004", name: "Dwi Santoso" },
    { code: "STD-005", name: "Eka Ramadhan" },
  ]

  const base: Entry[] = [
    { code: students[0]!.code, name: students[0]!.name, status: "Hadir", checkIn: "08:05", checkOut: "16:02", note: "", proof: "https://picsum.photos/seed/1/800/400" },
    { code: students[1]!.code, name: students[1]!.name, status: "Izin", note: "Sakit", proof: "https://picsum.photos/seed/2/800/400" },
    { code: students[2]!.code, name: students[2]!.name, status: "Hadir", checkIn: "08:10", checkOut: "16:00", proof: "https://picsum.photos/seed/3/800/400" },
    { code: students[3]!.code, name: students[3]!.name, status: "Hadir", checkIn: "08:02", checkOut: "16:10", proof: "https://picsum.photos/seed/4/800/400" },
    { code: students[4]!.code, name: students[4]!.name, status: "Tidak Hadir", note: "", proof: "https://picsum.photos/seed/5/800/400" },
  ]

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-4 py-4 md:px-6 md:py-8">
        <AttendanceDetailClient date={date} initial={base} />
      </div>
    </main>
  )
}
/* client moved to components/students/AttendanceDetailClient */
