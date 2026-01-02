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
import { Search, Calendar, Clock, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { api } from "@/trpc/react";
import ActivityFormDialog, { type CalendarEvent } from "@/components/mentor/ActivityFormDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
    in_class: "In-Class",
    field_trip: "Field Trip",
    meet_greet: "Meet & Greet",
    meeting: "Meeting",
    deadline: "Deadline",
    milestone: "Milestone",
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
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

    // Month and Year filter state
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    const utils = api.useUtils();

    // Fetch from calendar events API - mentor uses listForAdmin which now supports both roles
    const { data, isLoading, isError, refetch } = api.calendarEvents.listForAdmin.useQuery({
        month: selectedMonth,
        year: selectedYear,
        type: filterType !== "all" ? (filterType as any) : undefined,
        search: search || undefined,
    });

    const activities = data ?? [];

    const deleteMutation = api.calendarEvents.delete.useMutation({
        onSuccess: () => {
            void utils.calendarEvents.listForAdmin.invalidate();
            setDeleteConfirmOpen(false);
            setEventToDelete(null);
            toast.success("Aktivitas berhasil dihapus");
        },
        onError: (err) => {
            toast.error("Gagal menghapus aktivitas: " + err.message);
        },
    });

    function handleOpenCreate() {
        setEditingEvent(null);
        setDialogOpen(true);
    }

    function handleOpenEdit(event: any) {
        setEditingEvent({
            ...event,
            description: event.description,
            startDate: new Date(event.startDate),
            dueDate: new Date(event.dueDate),
        });
        setDialogOpen(true);
    }

    function handleDelete(event: any) {
        setEventToDelete(event);
        setDeleteConfirmOpen(true);
    }

    function confirmDelete() {
        if (eventToDelete) {
            deleteMutation.mutate({ eventId: eventToDelete.id });
        }
    }

    const monthNames = [
        { value: 1, label: "Januari" },
        { value: 2, label: "Februari" },
        { value: 3, label: "Maret" },
        { value: 4, label: "April" },
        { value: 5, label: "Mei" },
        { value: 6, label: "Juni" },
        { value: 7, label: "Juli" },
        { value: 8, label: "Agustus" },
        { value: 9, label: "September" },
        { value: 10, label: "Oktober" },
        { value: 11, label: "November" },
        { value: 12, label: "Desember" },
    ];

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <main className="bg-muted text-foreground min-h-screen">
            <div className="mx-auto max-w-[1200px] px-6 py-8">
                {/* Header */}
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold">Aktivitas</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Lihat semua kegiatan dan aktivitas PKL
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleOpenCreate} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                            <Plus className="size-4" />
                            Tambah Aktivitas
                        </Button>
                    </div>
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

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-3">
                    {/* Month Filter */}
                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                        <SelectTrigger className="w-[140px] bg-background">
                            <SelectValue placeholder="Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthNames.map((m) => (
                                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Year Filter */}
                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-[100px] bg-background">
                            <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Type Filter */}
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[140px] bg-background">
                            <SelectValue placeholder="Semua Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="in_class">In-Class</SelectItem>
                            <SelectItem value="field_trip">Field Trip</SelectItem>
                            <SelectItem value="meet_greet">Meet &amp; Greet</SelectItem>
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
                        <p className="text-muted-foreground">Tidak ada aktivitas yang ditemukan</p>
                    </div>
                ) : (
                    /* Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                            >
                                {/* Color bar */}
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: activity.colorHex ?? defaultColors[activity.type] ?? "#6b7280" }}
                                />

                                {/* Card content */}
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold line-clamp-2">
                                            {activity.title}
                                        </h3>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(activity)}>
                                                <Pencil className="size-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(activity)}>
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>

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
                                            className="text-sm text-muted-foreground mb-4 line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.description) }}
                                        />
                                    )}

                                    {/* Date & Time */}
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
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

                                    <div className="flex items-center gap-2 text-sm mb-4">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
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
                                        <div className="flex items-center gap-3 text-sm pt-3 mb-4 border-t">
                                            <div className="w-10 h-10 relative flex-shrink-0 flex items-center justify-center rounded-lg border bg-background overflow-hidden">
                                                {activity.organizerLogoUrl ? (
                                                    <Image
                                                        src={activity.organizerLogoUrl}
                                                        alt={activity.organizerName}
                                                        fill
                                                        className="object-contain p-0.5"
                                                        sizes="40px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xs">
                                                        {activity.organizerName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-muted-foreground">Penyelenggara</div>
                                                <div className="font-medium truncate">{activity.organizerName}</div>
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

                <ActivityFormDialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setEditingEvent(null);
                    }}
                    editingEvent={editingEvent}
                    onSuccess={() => {
                        void utils.calendarEvents.listForAdmin.invalidate();
                        setDialogOpen(false);
                    }}
                />

                <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Hapus Aktivitas</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                            Apakah Anda yakin ingin menghapus aktivitas &quot;{eventToDelete?.title}&quot;? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? <><Spinner className="mr-2" /> Menghapus...</> : "Hapus"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </main>
    );
}
