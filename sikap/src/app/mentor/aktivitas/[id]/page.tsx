"use client";

import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/students/BackButton";
import { formatFileSize } from "@/lib/file-utils";
import { sanitizeHtml } from "@/lib/sanitize-html";
import {
    Calendar,
    Clock,
    MapPin,
    FileText,
    Download,
    Image as ImageIcon,
    File as FileIcon,
} from "lucide-react";
import Image from "next/image";

// Map event type to display label
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
    in_class: "bg-blue-100 text-blue-700",
    field_trip: "bg-green-100 text-green-700",
    meet_greet: "bg-amber-100 text-amber-700",
    meeting: "bg-purple-100 text-purple-700",
    deadline: "bg-red-100 text-red-700",
    milestone: "bg-pink-100 text-pink-700",
};

// Format date
function formatDate(date: Date | string | null): string {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

// Format time
function formatTime(date: Date | string | null): string {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    }) + " WIB";
}

// Get file icon
function getFileIcon(mimeType: string | null) {
    if (!mimeType) return <FileIcon className="size-5" />;
    if (mimeType.startsWith("image/")) return <ImageIcon className="size-5" />;
    if (mimeType === "application/pdf") return <FileText className="size-5" />;
    return <FileIcon className="size-5" />;
}

export default function AktivitasDetailPage() {
    const params = useParams();
    const eventId = Number(params.id);

    const { data, isLoading, isError, refetch } = api.calendarEvents.detail.useQuery(
        { eventId },
        { enabled: !isNaN(eventId) }
    );

    if (isNaN(eventId)) {
        return (
            <main className="min-h-screen bg-gray-50">
                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    <BackButton hrefFallback="/mentor/aktivitas" />
                    <div className="mt-4 text-destructive">ID aktivitas tidak valid.</div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                <BackButton hrefFallback="/mentor/aktivitas" />

                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6">
                        <Spinner /> Memuat aktivitas...
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-start gap-2 mt-6">
                        <div className="text-sm text-destructive">Gagal memuat aktivitas.</div>
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            Coba Lagi
                        </Button>
                    </div>
                ) : data ? (
                    <div className="mt-6 space-y-6">
                        {/* Header with color bar */}
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div
                                className="h-3"
                                style={{ backgroundColor: data.colorHex ?? "#6b7280" }}
                            />
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl font-semibold text-gray-900">
                                            {data.title}
                                        </h1>
                                        <div className="mt-2">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColors[data.type] ?? "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {typeLabels[data.type] ?? data.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="bg-white rounded-xl border shadow-sm p-6">
                            <h2 className="text-sm font-medium text-gray-500 mb-4">
                                Waktu Pelaksanaan
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Tanggal Mulai</div>
                                        <div className="text-sm font-medium">{formatDate(data.startDate)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Waktu</div>
                                        <div className="text-sm font-medium">{formatTime(data.startDate)}</div>
                                    </div>
                                </div>
                                {data.dueDate && data.dueDate !== data.startDate && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Tanggal Selesai</div>
                                            <div className="text-sm font-medium">{formatDate(data.dueDate)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {data.description && (
                            <div className="bg-white rounded-xl border shadow-sm p-6">
                                <h2 className="text-sm font-medium text-gray-500 mb-3">Deskripsi</h2>
                                <div
                                    className="text-sm text-gray-700 whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.description) }}
                                />
                            </div>
                        )}

                        {/* Organizer */}
                        {data.organizerName && (
                            <div className="bg-white rounded-xl border shadow-sm p-6">
                                <h2 className="text-sm font-medium text-gray-500 mb-4">Penyelenggara</h2>
                                <div className="flex items-center gap-4">
                                    <div className="w-[60px] h-[60px] relative flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white overflow-hidden">
                                        {data.organizerLogoUrl ? (
                                            <Image
                                                src={data.organizerLogoUrl}
                                                alt={data.organizerName}
                                                fill
                                                className="object-contain p-1"
                                                sizes="60px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-lg">
                                                {data.organizerName.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-lg font-medium text-gray-900">
                                            {data.organizerName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        {data.attachments && data.attachments.length > 0 && (
                            <div className="bg-white rounded-xl border shadow-sm p-6">
                                <h2 className="text-sm font-medium text-gray-500 mb-4">
                                    Lampiran ({data.attachments.length} file)
                                </h2>
                                <div className="space-y-2">
                                    {data.attachments.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
                                        >
                                            <div className="flex-shrink-0 text-gray-500">
                                                {getFileIcon(file.mimeType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">
                                                    {file.filename ?? "File"}
                                                </div>
                                                {file.sizeBytes && (
                                                    <div className="text-xs text-gray-500">
                                                        {formatFileSize(file.sizeBytes)}
                                                    </div>
                                                )}
                                            </div>
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-shrink-0"
                                            >
                                                <Button variant="outline" size="sm" className="gap-1.5">
                                                    <Download className="size-4" /> Unduh
                                                </Button>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Created by */}
                        {data.createdBy && (
                            <div className="bg-white rounded-xl border shadow-sm p-6">
                                <h2 className="text-sm font-medium text-gray-500 mb-2">Dibuat oleh</h2>
                                <div className="text-sm text-gray-700">
                                    {data.createdBy.name ?? data.createdBy.email ?? "Unknown"}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </main>
    );
}
