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
import { Search, Calendar, Clock, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

const statusColors = {
    todo: "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
    submitted: "bg-purple-100 text-purple-700 border-purple-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
    todo: "Belum Dikerjakan",
    in_progress: "Sedang Dikerjakan",
    submitted: "Sudah Dikumpulkan",
    approved: "Disetujui",
    rejected: "Ditolak",
};

const statusBarColors = {
    todo: "#3b82f6",
    in_progress: "#f59e0b",
    submitted: "#8b5cf6",
    approved: "#10b981",
    rejected: "#ef4444",
};

const PAGE_SIZE = 12;

export default function SiswaAktivitasPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [page, setPage] = useState(0);

    // Reset to first page when search or filter changes
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(0);
    };

    const handleFilterChange = (value: string) => {
        setFilterType(value);
        setPage(0);
    };

    const { data, isLoading, error } = api.tasks.listAssigned.useQuery({
        // Search is handled server-side, no need to filter again on the client
        search: search || undefined,
        status: filterType === "all" ? undefined : (filterType as "todo" | "in_progress" | "submitted" | "approved" | "rejected"),
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
    });

    const tasks = data?.items ?? [];
    const totalItems = data?.pagination?.total ?? 0;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Aktivitas</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Lihat semua kegiatan dan tugas PKL
                    </p>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Cari berdasarkan nama atau deskripsi"
                            className="pl-11 rounded-full bg-white border-gray-200"
                        />
                    </div>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <Select value={filterType} onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[200px] rounded-full bg-white">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="todo">Belum Dikerjakan</SelectItem>
                            <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                            <SelectItem value="submitted">Sudah Dikumpulkan</SelectItem>
                            <SelectItem value="approved">Disetujui</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
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
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Color bar based on status */}
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: statusBarColors[task.status as keyof typeof statusBarColors] || "#6b7280" }}
                                />

                                {/* Card content */}
                                <div className="p-5">
                                    {/* Task title */}
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {task.title}
                                    </h3>

                                    {/* Status badge */}
                                    <div className="mb-3">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[task.status as keyof typeof statusColors] || "bg-gray-100 text-gray-700 border-gray-200"
                                                }`}
                                        >
                                            {statusLabels[task.status as keyof typeof statusLabels] || task.status}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {task.description || "Tidak ada deskripsi"}
                                    </p>

                                    {/* Due Date */}
                                    {task.dueDate && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>
                                                {new Date(task.dueDate).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    )}

                                    {task.dueDate && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>
                                                {new Date(task.dueDate).toLocaleTimeString("id-ID", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })} WIB
                                            </span>
                                        </div>
                                    )}

                                    {/* View detail button */}
                                    <Link href={`/siswa/tugas/${task.id}`}>
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
                {!isLoading && !error && tasks.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Tidak ada aktivitas yang ditemukan</p>
                    </div>
                )}

                {/* Pagination Controls */}
                {!isLoading && !error && totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Menampilkan {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalItems)} dari {totalItems} aktivitas
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="rounded-full"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Sebelumnya
                            </Button>
                            <span className="text-sm text-gray-600 px-2">
                                Halaman {page + 1} dari {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="rounded-full"
                            >
                                Selanjutnya
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
