"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AttendanceLine from "@/components/students/AttendanceLine";
import { api } from "@/trpc/react";

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"laporan" | "informasi">("laporan");

    const userId = params.id as string;

    const { data, isLoading, error } = api.students.detail.useQuery({ userId });

    if (isLoading) {
        return (
            <main className="min-h-screen bg-muted text-foreground flex items-center justify-center">
                <div className="text-muted-foreground">Memuat data siswa...</div>
            </main>
        );
    }

    if (error || !data) {
        return (
            <main className="min-h-screen bg-muted text-foreground flex items-center justify-center">
                <div className="text-destructive">
                    Gagal memuat data siswa. {error?.message}
                </div>
            </main>
        );
    }

    const { profile, stats, attendance, reports, scoreHistory, attendanceHistory } = data;

    return (
        <main className="min-h-screen bg-muted text-foreground">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                {/* Header with Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 -ml-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">{profile.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {profile.nis ?? "-"}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Status
                        </h3>
                        <div className="text-2xl font-bold mb-1 capitalize">
                            {profile.active ? "Aktif" : "Tidak Aktif"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {profile.active ? "Siswa Aktif" : "Siswa Tidak Aktif"}
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Laporan
                        </h3>
                        <div className="text-2xl font-bold mb-1">{reports.length}</div>
                        <div className="text-xs text-muted-foreground">Diserahkan</div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Skor Rata-Rata
                        </h3>
                        <div className="text-2xl font-bold mb-1">
                            {stats.averageScore ? Math.round(stats.averageScore) : "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">Dari 100</div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Mentor
                        </h3>
                        <div className="text-2xl font-bold mb-1">
                            {profile.mentorName ?? "-"}
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium mb-1">
                            Perkembangan Skor Siswa
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">{profile.name}</p>
                        <div className="text-3xl font-bold mb-4">
                            {stats.averageScore ? Math.round(stats.averageScore) : "-"}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">dari 100</div>
                        <div className="mt-4">
                            <AttendanceLine data={scoreHistory} />
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium mb-1">
                            Perkembangan Kehadiran Siswa
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">{profile.name}</p>
                        <div className="text-3xl font-bold mb-4">
                            {attendance.percent}%
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">dari 100%</div>
                        <div className="mt-4">
                            <AttendanceLine data={attendanceHistory} />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-4">
                    <div className="flex gap-2">
                        <Button
                            variant={activeTab === "laporan" ? "default" : "outline"}
                            onClick={() => setActiveTab("laporan")}
                            className={
                                activeTab === "laporan"
                                    ? "bg-destructive hover:bg-destructive/90 text-white rounded-full cursor-pointer"
                                    : "rounded-full cursor-pointer"
                            }
                        >
                            Laporan
                        </Button>
                        <Button
                            variant={activeTab === "informasi" ? "default" : "outline"}
                            onClick={() => setActiveTab("informasi")}
                            className={
                                activeTab === "informasi"
                                    ? "bg-destructive hover:bg-destructive/90 text-white rounded-full cursor-pointer"
                                    : "rounded-full cursor-pointer"
                            }
                        >
                            Informasi
                        </Button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === "laporan" && (
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-2">
                            Laporan yang Diserahkan
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Laporan yang Dipertimbangkan
                        </p>

                        <div className="space-y-3">
                            {reports.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4">
                                    Belum ada laporan yang diserahkan.
                                </div>
                            ) : (
                                reports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                                    >
                                        <div>
                                            <h4 className="font-medium capitalize">{report.type}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {report.title || "Tanpa Judul"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {report.submittedAt
                                                    ? new Date(report.submittedAt).toLocaleDateString()
                                                    : "-"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-semibold">
                                                {report.score ?? "-"}
                                            </span>
                                            <Link
                                                href={`/admin/siswa/${userId}/laporan/${report.id}`}
                                            >
                                                <Button
                                                    size="sm"
                                                    className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors"
                                                >
                                                    Lihat Detail
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "informasi" && (
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-6">Informasi Siswa</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">
                                    Email
                                </label>
                                <p className="text-sm">{profile.email}</p>
                            </div>

                            {/* Right Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">
                                    Sekolah
                                </label>
                                <p className="text-sm">{profile.school ?? "-"}</p>
                            </div>

                            {/* Left Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">
                                    Tanggal Mulai
                                </label>
                                <p className="text-sm">{profile.startDate ?? "-"}</p>
                            </div>

                            {/* Right Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">
                                    Tanggal Selesai
                                </label>
                                <p className="text-sm">{profile.endDate ?? "-"}</p>
                            </div>

                            {/* Left Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">
                                    Angkatan
                                </label>
                                <p className="text-sm">{profile.cohort ?? "-"}</p>
                            </div>

                            {/* Right Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">
                                    Alamat
                                </label>
                                <p className="text-sm">{profile.address ?? "-"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
