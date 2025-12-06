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

const typeColors = {
    "in_class": "bg-blue-100 text-blue-700",
    "field_trip": "bg-green-100 text-green-700",
    "meet_greet": "bg-amber-100 text-amber-700",
};

const typeLabels = {
    "in_class": "In-Class",
    "field_trip": "Field Trip",
    "meet_greet": "Meet & Greet",
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

    const deleteMutation = api.calendarEvents.delete.useMutation({
        onSuccess: () => {
            utils.calendarEvents.list.invalidate();
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

                {/* Table */}
                {!isLoading && !isError && (
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
                                    {events && events.length > 0 ? (
                                        events.map((activity, index) => {
                                            const type = activity.type as keyof typeof typeColors;
                                            return (
                                                <tr
                                                    key={activity.id}
                                                    className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                                                >
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        {activity.title}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[type] ?? "bg-gray-100 text-gray-700"}`}
                                                        >
                                                            {typeLabels[type] ?? activity.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {new Date(activity.startDate).toLocaleDateString("id-ID", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}{" "}
                                                        - {new Date(activity.startDate).toLocaleTimeString("id-ID", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{activity.organizerName ?? "-"}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-6 h-6 rounded-full border"
                                                                style={{ backgroundColor: activity.colorHex ?? "#3b82f6" }}
                                                            ></div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {activity.colorHex ?? "#3b82f6"}
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
                                                                onClick={() => handleDeleteClick({ id: activity.id, title: activity.title })}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                Tidak ada aktivitas ditemukan
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
