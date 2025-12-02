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
import { Search, Calendar, Clock, Building2, FileText } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// Dummy data - same as admin
const activities = [
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
        name: "Kunjungan Industri ke Google",
        type: "Field Trip",
        date: "2025-08-20",
        time: "08:00",
        organizer: "SMK 13 Tasikmalaya",
        color: "#10b981",
        description: "Kunjungan ke kantor Google Indonesia",
    },
    {
        id: 3,
        name: "Perkenalan dengan Alumni",
        type: "Meet & Greet",
        date: "2025-08-25",
        time: "14:00",
        organizer: "Komisi Magang",
        color: "#f59e0b",
        description: "Sesi networking dengan alumni yang sudah bekerja",
    },
    {
        id: 4,
        name: "Training Soft Skills",
        type: "In-Class",
        date: "2025-09-01",
        time: "10:00",
        organizer: "HR Department",
        color: "#8b5cf6",
        description: "Pelatihan komunikasi dan kerjasama tim",
    },
    {
        id: 5,
        name: "Expo Teknologi 2025",
        type: "Field Trip",
        date: "2025-09-10",
        time: "09:00",
        organizer: "Asosiasi IT Indonesia",
        color: "#ec4899",
        description: "Pameran teknologi terbaru di JCC",
    },
];

const typeColors = {
    "In-Class": "bg-blue-100 text-blue-700 border-blue-200",
    "Field Trip": "bg-green-100 text-green-700 border-green-200",
    "Meet & Greet": "bg-amber-100 text-amber-700 border-amber-200",
};

export default function SiswaAktivitasPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");

    const filtered = activities.filter((a) => {
        const matchSearch =
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.organizer.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === "all" || a.type === filterType;
        return matchSearch && matchType;
    });

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Aktivitas</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Lihat semua kegiatan dan event PKL
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
                        <SelectTrigger className="w-[180px] rounded-full bg-white">
                            <SelectValue placeholder="Semua Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="In-Class">In-Class</SelectItem>
                            <SelectItem value="Field Trip">Field Trip</SelectItem>
                            <SelectItem value="Meet & Greet">Meet & Greet</SelectItem>
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
                                style={{ backgroundColor: activity.color }}
                            />

                            {/* Card content */}
                            <div className="p-5">
                                {/* Activity name */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {activity.name}
                                </h3>

                                {/* Type badge */}
                                <div className="mb-3">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${typeColors[activity.type as keyof typeof typeColors]
                                            }`}
                                    >
                                        {activity.type}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {activity.description}
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
                                    <span>{activity.time} WIB</span>
                                </div>

                                {/* Organizer with logo */}
                                <div className="flex items-center gap-3 text-sm text-gray-700 pt-3 mb-4 border-t border-gray-100">
                                    <Image
                                        src={`https://via.placeholder.com/80x80/e5e7eb/374151?text=${encodeURIComponent(activity.organizer.substring(0, 2))}`}
                                        alt={activity.organizer}
                                        width={40}
                                        height={40}
                                        className="rounded-lg object-cover border border-gray-200"
                                    />
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500">Penyelenggara</div>
                                        <div className="font-medium text-gray-900">{activity.organizer}</div>
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
                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Tidak ada aktivitas yang ditemukan</p>
                    </div>
                )}
            </div>
        </main>
    );
}
