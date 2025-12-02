"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";

// Dummy data
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
    "In-Class": "bg-blue-100 text-blue-700",
    "Field Trip": "bg-green-100 text-green-700",
    "Meet & Greet": "bg-amber-100 text-amber-700",
};

export default function AktivitasPage() {
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
        <main className="min-h-screen bg-muted text-foreground">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold">Aktivitas</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola kegiatan dan event PKL
                        </p>
                    </div>
                    <Link href="/admin/aktivitas/tambah">
                        <Button className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors">
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Aktivitas
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama atau penyelenggara"
                            className="pl-11 rounded-full bg-background border-border"
                        />
                    </div>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[180px] rounded-full bg-background">
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

                {/* Table */}
                <div className="rounded-xl overflow-hidden border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-destructive text-white">
                                <tr>
                                    <th className="text-left text-sm font-medium px-4 py-3">
                                        Nama Kegiatan
                                    </th>
                                    <th className="text-left text-sm font-medium px-4 py-3">
                                        Tipe
                                    </th>
                                    <th className="text-left text-sm font-medium px-4 py-3">
                                        Tanggal & Waktu
                                    </th>
                                    <th className="text-left text-sm font-medium px-4 py-3">
                                        Penyelenggara
                                    </th>
                                    <th className="text-left text-sm font-medium px-4 py-3">
                                        Warna
                                    </th>
                                    <th className="text-left text-sm font-medium px-4 py-3">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((activity, index) => (
                                    <tr
                                        key={activity.id}
                                        className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                                    >
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {activity.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[activity.type as keyof typeof typeColors]
                                                    }`}
                                            >
                                                {activity.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {new Date(activity.date).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}{" "}
                                            - {activity.time}
                                        </td>
                                        <td className="px-4 py-3 text-sm">{activity.organizer}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-full border"
                                                    style={{ backgroundColor: activity.color }}
                                                ></div>
                                                <span className="text-xs text-muted-foreground">
                                                    {activity.color}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/aktivitas/${activity.id}/edit`}>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="hover:bg-muted cursor-pointer"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="hover:bg-destructive/10 text-destructive cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
