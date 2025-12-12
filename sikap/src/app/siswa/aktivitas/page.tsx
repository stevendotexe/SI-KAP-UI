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

const typeColors = {
    in_class: "bg-blue-100 text-blue-700 border-blue-200",
    field_trip: "bg-green-100 text-green-700 border-green-200",
    meet_greet: "bg-amber-100 text-amber-700 border-amber-200",
    meeting: "bg-purple-100 text-purple-700 border-purple-200",
    deadline: "bg-red-100 text-red-700 border-red-200",
    milestone: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const typeLabels = {
    in_class: "In-Class",
    field_trip: "Field Trip",
    meet_greet: "Meet & Greet",
    meeting: "Meeting",
    deadline: "Deadline",
    milestone: "Milestone",
};

export default function SiswaAktivitasPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");

    const { data, isLoading, error } = api.calendarEvents.listForStudent.useQuery(
        filterType === "all"
            ? {}
            : { type: filterType as "in_class" | "field_trip" | "meet_greet" | "meeting" | "deadline" | "milestone" }
    );

    const events = data?.items ?? [];

    // Client-side search filter
    const filteredEvents = events.filter((event) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            event.title.toLowerCase().includes(searchLower) ||
            (event.description?.toLowerCase().includes(searchLower) ?? false) ||
            (event.organizerName?.toLowerCase().includes(searchLower) ?? false)
        );
    });

    return (
        <main className="space-y-6 p-5 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
            <div className="w-full max-w-none p-0 m-0">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-semibold">Aktivitas</h1>
                    <p className="text-muted-foreground mt-1">
                        Lihat semua kegiatan dan tugas PKL
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
                            className="pl-11 rounded-full bg-white border-gray-200"
                        />
                    </div>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[200px] rounded-full bg-white">
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
                        {filteredEvents.map((event) => (
                            <div
                                key={event.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Color bar */}
                                <div
                                    style={{ backgroundColor: event.colorHex ?? "#6b7280" }}
                                />

                                {/* Card content */}
                                <div className="p-5">
                                    {/* Event title */}
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {event.description ?? "Tidak ada deskripsi"}
                                    </p>

                                    {/* Date */}
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>
                                            {new Date(event.startDate).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>

                                    {/* Time */}
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span>
                                            {new Date(event.startDate).toLocaleTimeString("id-ID", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })} WIB
                                        </span>
                                    </div>

                                    {/* Organizer with logo */}
                                    {event.organizerName && (
                                        <div className="flex items-center gap-3 text-sm text-gray-700 pt-3 mb-4 border-t border-gray-100">
                                            {event.organizerLogoUrl ? (
                                                <Image
                                                    src={event.organizerLogoUrl}
                                                    alt={event.organizerName}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-lg object-cover border border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-500">Penyelenggara</div>
                                                <div className="font-medium text-gray-900">{event.organizerName}</div>
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
                {!isLoading && !error && filteredEvents.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Tidak ada aktivitas yang ditemukan</p>
                    </div>
                )}
            </div>
        </main>
    );
}
