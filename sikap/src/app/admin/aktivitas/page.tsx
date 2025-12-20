"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import ActivityTaskCard from "@/components/activities/ActivityTaskCard";

const typeColors = {
    "in_class": "bg-blue-100 text-blue-700",
    "field_trip": "bg-green-100 text-green-700",
    "meet_greet": "bg-amber-100 text-amber-700",
    "meeting": "bg-purple-100 text-purple-700",
    "deadline": "bg-red-100 text-red-700",
    "milestone": "bg-indigo-100 text-indigo-700",
};

const typeLabels = {
    "in_class": "In-Class",
    "field_trip": "Field Trip",
    "meet_greet": "Meet & Greet",
    "meeting": "Meeting",
    "deadline": "Deadline",
    "milestone": "Milestone",
};

export default function AktivitasPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<"all" | "in_class" | "field_trip" | "meet_greet">("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<{ id: number; title: string } | null>(null);

    const utils = api.useUtils();

    // Query all activities (companyId is optional for admin users)
    const { data: events, isLoading, isError, refetch } = api.calendarEvents.list.useQuery({
        // companyId is optional - admin users will see all activities
        search: search || undefined,
        type: filterType === "all" ? undefined : filterType,
    });

    const { data: tasksData } = api.tasks.list.useQuery({
        search: search || undefined,
        limit: 100,
    });

    const deleteMutation = api.calendarEvents.delete.useMutation({
        onSuccess: () => {
            void utils.calendarEvents.list.invalidate();
            setDeleteDialogOpen(false);
            setEventToDelete(null);
        },
    });

    const handleDeleteClick = (event: { id: number; title: string }) => {
        setEventToDelete(event);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (eventToDelete) {
            deleteMutation.mutate({ eventId: eventToDelete.id });
        }
    };

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
                    <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                        <SelectTrigger className="w-[180px] rounded-full bg-background">
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

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner /> Memuat aktivitas...
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="flex flex-col items-start gap-2">
                        <div className="text-sm text-destructive">Gagal memuat aktivitas.</div>
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            Coba Lagi
                        </Button>
                    </div>
                )}

                {/* Cards (Events + Tasks) */}
                {!isLoading && !isError && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(events ?? []).map((ev) => (
                            <ActivityTaskCard
                                key={`event-${ev.id}`}
                                item={{
                                    kind: "event",
                                    id: ev.id,
                                    title: ev.title,
                                    description: null,
                                    dateLabel: new Date(ev.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
                                    timeLabel: new Date(ev.startDate).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                                    typeLabel: typeLabels[ev.type] ?? ev.type,
                                    organizerName: ev.organizerName ?? null,
                                    colorHex: ev.colorHex ?? undefined,
                                }}
                                actions={
                                    <>
                                        <Link href={`/admin/aktivitas/${ev.id}/edit`}>
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </Link>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteClick({ id: ev.id, title: ev.title })}>Hapus</Button>
                                    </>
                                }
                            />
                        ))}

                        {(tasksData?.items ?? []).map((t) => (
                            <ActivityTaskCard
                                key={`task-${t.id}`}
                                item={{
                                    kind: "task",
                                    id: t.id,
                                    title: t.title,
                                    description: t.description ?? undefined,
                                    dateLabel: t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "",
                                    timeLabel: undefined,
                                    status: (t.status as "todo" | "in_progress" | "submitted" | "approved" | "rejected") ?? "todo",
                                }}
                                actions={
                                    <Link href={`/mentor/tugas/${t.id}/monitoring`}>
                                        <Button variant="outline" size="sm">Monitoring</Button>
                                    </Link>
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Aktivitas</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menghapus aktivitas &quot;{eventToDelete?.title}&quot;? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
        </main>
    );
}
