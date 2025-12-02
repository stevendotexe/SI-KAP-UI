"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, Clock, FileText } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

type UiEvent = {
  id: number;
  name: string;
  type: string;
  date: string;
  time?: string;
  organizer?: string;
  color?: string;
  description?: string;
};

const typeColors: Record<string, string> = {
  "In-Class": "bg-blue-100 text-blue-700 border-blue-200",
  "Field Trip": "bg-green-100 text-green-700 border-green-200",
  "Meet & Greet": "bg-amber-100 text-amber-700 border-amber-200",
  meeting: "bg-blue-100 text-blue-700 border-blue-200",
  deadline: "bg-amber-100 text-amber-700 border-amber-200",
  milestone: "bg-green-100 text-green-700 border-green-200",
  in_class: "bg-blue-100 text-blue-700 border-blue-200",
  field_trip: "bg-green-100 text-green-700 border-green-200",
  meet_greet: "bg-amber-100 text-amber-700 border-amber-200",
};

function normalizeType(t?: string): string {
  if (!t) return "In-Class";
  switch (t) {
    case "in_class": return "In-Class";
    case "field_trip": return "Field Trip";
    case "meet_greet": return "Meet & Greet";
    default: return t;
  }
}

export default function SiswaAktivitasPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [companyId] = useState<number>(1);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Nonaktifkan query untuk menghindari console error
    const { data, isLoading } = api.calendarEvents.list.useQuery(
      { companyId, month, year },
      { retry: 0, enabled: false }
    );

    // Data bawaan lokal (fallback)
    const defaultEvents: UiEvent[] = [
      {
        id: 1,
        name: "Workshop Web Development",
        type: "In-Class",
        date: "2025-08-15",
        time: "09:00",
        organizer: "PT Teknologi Indonesia",
        color: "#3b82f6",
        description: "Workshop intensif mengenai web development modern",
      },
      {
        id: 2,
        name: "Kunjungan Industri",
        type: "Field Trip",
        date: "2025-08-20",
        time: "08:00",
        organizer: "SMK 13 Tasikmalaya",
        color: "#10b981",
        description: "Kunjungan ke kantor perusahaan teknologi",
      },
      {
        id: 3,
        name: "Perkenalan Alumni",
        type: "Meet & Greet",
        date: "2025-08-25",
        time: "14:00",
        organizer: "Komisi Magang",
        color: "#f59e0b",
        description: "Sesi networking dengan alumni",
      },
    ];

    // Transform hasil DB -> UI (akan kosong karena enabled:false)
    const eventsFromDb: UiEvent[] = useMemo(() => {
      if (!Array.isArray(data)) return [];
      return data.map((ev) => {
        const d = new Date(ev.startDate);
        const hh = d.getHours().toString().padStart(2, "0");
        const mm = d.getMinutes().toString().padStart(2, "0");
        return {
          id: ev.id,
          name: ev.title,
          type: normalizeType(ev.type),
          date: new Date(ev.startDate).toISOString().slice(0, 10),
          time: `${hh}:${mm}`,
          organizer: ev.organizerName || "",
          color: ev.colorHex || "#3b82f6",
          description: "",
        };
      });
    }, [data]);

    // Sumber data: fallback lokal
    const source = eventsFromDb.length ? eventsFromDb : defaultEvents;

    // Saring berdasarkan pencarian dan tipe
    const filtered = useMemo(() => {
      const s = search.trim().toLowerCase();
      return source.filter((a) => {
        const matchSearch =
          a.name.toLowerCase().includes(s) ||
          (a.organizer && a.organizer.toLowerCase().includes(s));
        const matchType = filterType === "all" || a.type === filterType;
        return matchSearch && matchType;
      });
    }, [source, search, filterType]);

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="space-y-6 p-6 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
                {/* Header */}
                <div className="mb-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold">Aktivitas</h1>
                    <p className="text-muted-foreground mt-1">
                        Lihat semua kegiatan dan event PKL
                    </p>
                </div>

                {/* Search */}
                <div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isLoading ? "Memuat..." : "Cari berdasarkan nama atau penyelenggara"}
                            className="pl-11 rounded-full bg-white border-gray-200"
                        />
                    </div>
                </div>

                {/* Filter */}
                <div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[180px] rounded-full bg-white">
                            <SelectValue placeholder="Semua Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="In-Class">In-Class</SelectItem>
                            <SelectItem value="Field Trip">Field Trip</SelectItem>
                            <SelectItem value="Meet & Greet">Meet & Greet</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="deadline">Deadline</SelectItem>
                            <SelectItem value="milestone">Milestone</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((activity) => (
                        <div
                            key={activity.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                        >
                            {/* Color bar */}
                            <div
                                className="h-2"
                                style={{ backgroundColor: activity.color || "#e5e7eb" }}
                            />

                            {/* Card content */}
                            <div className="p-5">
                                {/* Activity name */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {isLoading ? "Memuat..." : activity.name}
                                </h3>

                                {/* Type badge */}
                                <div className="mb-3">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${typeColors[activity.type] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                                    >
                                        {activity.type}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {activity.description && activity.description.length ? activity.description : "—"}
                                </p>

                                {/* Date & Time */}
                                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>
                                        {new Date(activity.date).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span>{(activity.time && activity.time.length ? activity.time : "--:--") + " WIB"}</span>
                                </div>

                                {/* Organizer with logo */}
                                <div className="flex items-center gap-3 text-sm text-gray-700 pt-3 mb-4 border-t border-gray-100">
                                    <Image
                                        src={`https://via.placeholder.com/80x80/e5e7eb/374151?text=${encodeURIComponent((activity.organizer || "").substring(0, 2) || "EV")}`}
                                        alt={activity.organizer || "Penyelenggara"}
                                        width={40}
                                        height={40}
                                        className="rounded-lg object-cover border border-gray-200"
                                    />
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500">Penyelenggara</div>
                                        <div className="font-medium text-gray-900">{activity.organizer && activity.organizer.length ? activity.organizer : "—"}</div>
                                    </div>
                                </div>

                                {/* File access button */}
                                <Button
                                    variant="outline"
                                    className="w-full rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Lihat File
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* No results */}
                {!isLoading && filtered.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Tidak ada aktivitas yang ditemukan</p>
                    </div>
                )}
            </div>
        </main>
    );
}
