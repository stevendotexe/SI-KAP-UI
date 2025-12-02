"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AttendanceLine from "@/components/students/AttendanceLine";

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"laporan" | "informasi">("laporan");

    // Dummy data
    const student = {
        id: params.id,
        name: "Rafif Zharif",
        code: "STD-001",
        status: "Aktif",
        statusLabel: "Siswa Aktif",
        laporan: "3/4",
        laporanLabel: "Diserahkan",
        skorRataRata: 85,
        skorLabel: "Dari 100",
        mentor: "Ahsan",
        email: "rafif@gmail.com",
        school: "SMK 13 Tasikmalaya",
        tanggalMulai: "15-06-2025",
        tanggalSelesai: "15-12-2025",
        mesh: "Masuk",
        alamat: "JL.Pendidikan No.31",
    };

    const scoreData = [
        { period: "W1", count: 75 },
        { period: "W2", count: 78 },
        { period: "W3", count: 82 },
        { period: "W4", count: 80 },
        { period: "W5", count: 85 },
    ];

    const attendanceData = [
        { period: "W1", count: 88 },
        { period: "W2", count: 90 },
        { period: "W3", count: 89 },
        { period: "W4", count: 92 },
        { period: "W5", count: 91 },
    ];

    const reports = [
        {
            id: 1,
            week: "Minggu 1",
            title: "Penyiapan Awal & Orientasi",
            score: 85,
        },
        {
            id: 2,
            week: "Minggu 2",
            title: "Perancangan & Implementasi Basis Data",
            score: 85,
        },
        {
            id: 3,
            week: "Minggu 3",
            title: "Pengembangan API",
            score: 85,
        },
        {
            id: 4,
            week: "Minggu 3",
            title: "Pengembangan API",
            score: 85,
        },
    ];

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
                        <h1 className="text-2xl font-semibold">{student.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {student.code}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Status
                        </h3>
                        <div className="text-2xl font-bold mb-1">{student.status}</div>
                        <div className="text-xs text-muted-foreground">
                            {student.statusLabel}
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Laporan
                        </h3>
                        <div className="text-2xl font-bold mb-1">{student.laporan}</div>
                        <div className="text-xs text-muted-foreground">
                            {student.laporanLabel}
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Skor Rata-Rata
                        </h3>
                        <div className="text-2xl font-bold mb-1">
                            {student.skorRataRata}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {student.skorLabel}
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Mentor
                        </h3>
                        <div className="text-2xl font-bold mb-1">{student.mentor}</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium mb-1">
                            Perkembangan Skor Siswa
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                            {student.name}
                        </p>
                        <div className="text-3xl font-bold mb-4">8.2</div>
                        <div className="text-xs text-muted-foreground mb-2">dari 10</div>
                        <div className="mt-4">
                            <AttendanceLine data={scoreData} />
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium mb-1">
                            Perkembangan Kehadiran Siswa
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                            {student.name}
                        </p>
                        <div className="text-3xl font-bold mb-4">91%</div>
                        <div className="text-xs text-muted-foreground mb-2">dari 100%</div>
                        <div className="mt-4">
                            <AttendanceLine data={attendanceData} />
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
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                                >
                                    <div>
                                        <h4 className="font-medium">{report.week}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {report.title}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-semibold">
                                            {report.score}
                                        </span>
                                        <Link href={`/admin/siswa/${params.id}/laporan/${report.id}`}>
                                            <Button
                                                size="sm"
                                                className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors"
                                            >
                                                Lihat Detail
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "informasi" && (
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-6">Informasi Siswa</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">Email</label>
                                <p className="text-sm">{student.email}</p>
                            </div>

                            {/* Right Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">Sekolah</label>
                                <p className="text-sm">{student.school}</p>
                            </div>

                            {/* Left Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">Tanggal Mulai</label>
                                <p className="text-sm">{student.tanggalMulai}</p>
                            </div>

                            {/* Right Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">Tanggal Selesai</label>
                                <p className="text-sm">{student.tanggalSelesai}</p>
                            </div>

                            {/* Left Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">Mesh</label>
                                <p className="text-sm">{student.mesh}</p>
                            </div>

                            {/* Right Column */}
                            <div>
                                <label className="text-sm font-semibold block mb-1">Alamat</label>
                                <p className="text-sm">{student.alamat}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
