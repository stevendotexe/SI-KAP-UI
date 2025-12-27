"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, Clock, FileText, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import Image from "next/image";

const typeColors: Record<string, string> = {
    in_class: "bg-blue-100 text-blue-700 border-blue-200",
    field_trip: "bg-green-100 text-green-700 border-green-200",
    meet_greet: "bg-amber-100 text-amber-700 border-amber-200",
    meeting: "bg-purple-100 text-purple-700 border-purple-200",
    deadline: "bg-red-100 text-red-700 border-red-200",
    milestone: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const typeLabels: Record<string, string> = {
    in_class: "In-Class",
    field_trip: "Field Trip",
    meet_greet: "Meet & Greet",
    meeting: "Meeting",
    deadline: "Deadline",
    milestone: "Milestone",
};

const defaultColors: Record<string, string> = {
    in_class: "#3b82f6",
    field_trip: "#10b981",
    meet_greet: "#f59e0b",
    meeting: "#8b5cf6",
    deadline: "#ef4444",
    milestone: "#ec4899",
};

export default function SiswaAktivitasPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");

    // Get current month/year for query
    const now = new Date();
    const [month] = useState(now.getMonth() + 1);
    const [year] = useState(now.getFullYear());

    // Use listAllForStudent to show all activities (read-only for students)
    const { data, isLoading, error } = api.calendarEvents.listAllForStudent.useQuery({
        month,
        year,
        type: filterType !== "all" ? (filterType as any) : undefined,
        search: search || undefined,
    });

    const events = data ?? [];

    return (
        <main className="bg-muted text-foreground min-h-screen">
            <div className="mx-auto max-w-[1200px] px-6 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Aktivitas</h1>
                    <p className="text-muted-foreground mt-1">
                        Lihat semua kegiatan dan tugas PKL
                    </p>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama atau penyelenggara"
                            className="pl-11 bg-background border"
                        />
                    </div>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[200px] bg-background">
                            <SelectValue placeholder="Semua Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="in_class">In-Class</SelectItem>
                            <SelectItem value="field_trip">Field Trip</SelectItem>
                            <SelectItem value="meet_greet">Meet & Greet</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="deadline">Deadline</SelectItem>
                            <SelectItem value="milestone">Milestone</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <Spinner className="w-8 h-8" />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-12">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
                            <p className="text-red-600">Gagal memuat aktivitas: {error.message}</p>
                        </div>
                    </div>
                )}

                {/* Cards Grid */}
                {!isLoading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Color bar */}
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: event.colorHex ?? defaultColors[event.type] ?? "#6b7280" }}
                                />

                                {/* Card content */}
                                <div className="p-5">
                                    {/* Event title */}
                                    <h3 className="text-lg font-semibold mb-2">
                                        {event.title}
                                    </h3>

                                    {/* Type badge */}
                                    <div className="mb-3">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${typeColors[event.type] ?? "bg-gray-100 text-gray-700 border-gray-200"
                                                }`}
                                        >
                                            {typeLabels[event.type] ?? event.type}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {event.description ?? "Tidak ada deskripsi"}
                                    </p>

                                    {/* Date */}
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span>
                                            {new Date(event.startDate).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>

                                    {/* Time */}
                                    <div className="flex items-center gap-2 text-sm mb-4">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span>
                                            {new Date(event.startDate).toLocaleTimeString("id-ID", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })} WIB
                                        </span>
                                    </div>

                                    {/* Organizer with logo */}
                                    {event.organizerName && (
                                        <div className="flex items-center gap-3 text-sm pt-3 mb-4 border-t">
                                            {event.organizerLogoUrl ? (
                                                <Image
                                                    src={event.organizerLogoUrl}
                                                    alt={event.organizerName}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-lg object-cover border"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border">
                                                    <Building2 className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="text-xs text-muted-foreground">Penyelenggara</div>
                                                <div className="font-medium">{event.organizerName}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* View detail button */}
                                    <Link href={`/siswa/aktivitas/${event.id}`}>
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

                {/* No results */}
                {!isLoading && !error && events.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Tidak ada aktivitas yang ditemukan</p>
                    </div>
                )}
            </div>
        </main>
    );
}
