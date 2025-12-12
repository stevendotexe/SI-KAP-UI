"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Calendar, Clock, MapPin, Building2 } from "lucide-react";
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

export default function SiswaAktivitasDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = parseInt(params.id as string);

    const { data: event, isLoading, error } = api.calendarEvents.listForStudent.useQuery({});

    const currentEvent = event?.items.find((e) => e.id === eventId);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spinner className="w-8 h-8" />
            </main>
        );
    }

    if (error || !currentEvent) {
        return (
            <main className="min-h-screen bg-gray-50">
                <div className="max-w-[900px] mx-auto px-6 py-8">
                    <div className="text-center py-12">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
                            <p className="text-red-600">
                                {error ? `Gagal memuat detail aktivitas: ${error.message}` : "Aktivitas tidak ditemukan"}
                            </p>
                        </div>
                        <div className="mt-4">
                            <Button variant="outline" onClick={() => router.back()}>
                                Kembali
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-[900px] mx-auto px-6 py-8">
                {/* Header with Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 -ml-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Detail Aktivitas</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Informasi lengkap kegiatan PKL
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Color bar */}
                    <div
                        className="h-2"
                        style={{ backgroundColor: currentEvent.colorHex ?? "#6b7280" }}
                    />

                    <div className="p-8">
                        {/* Title and Type */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                {currentEvent.title}
                            </h2>
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${typeColors[currentEvent.type] ?? "bg-gray-100 text-gray-700 border-gray-200"
                                    }`}
                            >
                                {typeLabels[currentEvent.type] ?? currentEvent.type}
                            </span>
                        </div>

                        {/* Description */}
                        {currentEvent.description && (
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Deskripsi</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {currentEvent.description}
                                </p>
                            </div>
                        )}

                        {/* Date and Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Tanggal</div>
                                    <div className="font-medium text-gray-900">
                                        {new Date(currentEvent.startDate).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Waktu</div>
                                    <div className="font-medium text-gray-900">
                                        {new Date(currentEvent.startDate).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}{" "}
                                        WIB
                                        {currentEvent.endDate && currentEvent.endDate !== currentEvent.startDate && (
                                            <span>
                                                {" - "}
                                                {new Date(currentEvent.endDate).toLocaleTimeString("id-ID", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}{" "}
                                                WIB
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        {currentEvent.location && (
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Lokasi</div>
                                    <div className="font-medium text-gray-900">{currentEvent.location}</div>
                                </div>
                            </div>
                        )}

                        {/* Organizer */}
                        {currentEvent.organizerName && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 mb-3">Penyelenggara</h3>
                                <div className="flex items-center gap-4">
                                    {currentEvent.organizerLogoUrl ? (
                                        <Image
                                            src={currentEvent.organizerLogoUrl}
                                            alt={currentEvent.organizerName}
                                            width={60}
                                            height={60}
                                            className="rounded-lg object-cover border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-[60px] h-[60px] rounded-lg bg-white flex items-center justify-center border border-gray-200">
                                            <Building2 className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {currentEvent.organizerName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
