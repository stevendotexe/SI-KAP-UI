"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { sanitizeHtml } from "@/lib/sanitize-html";
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
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { api } from "@/trpc/react";

const typeLabels: Record<string, string> = {
    in_class: "In-Class",
    field_trip: "Field Trip",
    meet_greet: "Meet & Greet",
};

// Map event type to color classes
const typeColors: Record<string, string> = {
    in_class: "bg-blue-100 text-blue-700 border-blue-200",
    field_trip: "bg-green-100 text-green-700 border-green-200",
    meet_greet: "bg-amber-100 text-amber-700 border-amber-200",
    meeting: "bg-purple-100 text-purple-700 border-purple-200",
    deadline: "bg-red-100 text-red-700 border-red-200",
    milestone: "bg-pink-100 text-pink-700 border-pink-200",
};

// Default colors if no colorHex provided
const defaultColors: Record<string, string> = {
    in_class: "#3b82f6",
    field_trip: "#10b981",
    meet_greet: "#f59e0b",
    meeting: "#8b5cf6",
    deadline: "#ef4444",
    milestone: "#ec4899",
};

export default function MentorAktivitasPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");

    // Get current month/year for default query
    const now = new Date();
    const [month] = useState(now.getMonth() + 1);
    const [year] = useState(now.getFullYear());

    // Fetch from calendar events API
    const { data, isLoading, isError, refetch } = api.calendarEvents.list.useQuery({
        month,
        year,
        type: filterType !== "all" ? (filterType as any) : undefined,
        search: search || undefined,
    });

    const activities = data ?? [];

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Aktivitas</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Lihat semua kegiatan dan aktivitas PKL
                    </p>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama atau penyelenggara"
                            className="pl-11 bg-white border-gray-200"
                        />
                    </div>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Semua Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="in_class">In-Class</SelectItem>
                            <SelectItem value="field_trip">Field Trip</SelectItem>
                            <SelectItem value="meet_greet">Meet & Greet</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Loading/Error states */}
                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner /> Memuat aktivitas...
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-start gap-2">
                        <div className="text-sm text-destructive">Gagal memuat aktivitas.</div>
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            Coba Lagi
                        </Button>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Tidak ada aktivitas yang ditemukan</p>
                    </div>
                ) : (
                    /* Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Color bar */}
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: activity.colorHex ?? defaultColors[activity.type] ?? "#6b7280" }}
                                />

                                {/* Card content */}
                                <div className="p-5">
                                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                                        {activity.title}
                                    </h3>

                                    {/* Type badge */}
                                    <div className="mb-3">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${typeColors[activity.type] ?? "bg-gray-100 text-gray-700 border-gray-200"
                                                }`}
                                        >
                                            {typeLabels[activity.type] ?? activity.type}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {activity.description && (
                                        <div
                                            className="text-sm text-gray-600 mb-4 line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.description) }}
                                        />
                                    )}

                                    {/* Date & Time */}
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>
                                            {activity.startDate
                                                ? new Date(activity.startDate).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })
                                                : "-"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span>
                                            {activity.startDate
                                                ? new Date(activity.startDate).toLocaleTimeString("id-ID", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }) + " WIB"
                                                : "-"}
                                        </span>
                                    </div>

                                    {activity.organizerName && (
                                        <div className="flex items-center gap-3 text-sm text-gray-700 pt-3 mb-4 border-t border-gray-100">
                                            <div className="w-10 h-10 relative flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white overflow-hidden">
                                                {activity.organizerLogoUrl ? (
                                                    <Image
                                                        src={activity.organizerLogoUrl}
                                                        alt={activity.organizerName}
                                                        fill
                                                        className="object-contain p-0.5"
                                                        sizes="40px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-xs">
                                                        {activity.organizerName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-500">Penyelenggara</div>
                                                <div className="font-medium text-gray-900 truncate">{activity.organizerName}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Detail button */}
                                    <Link href={`/mentor/aktivitas/${activity.id}`}>
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Lihat Detail
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
