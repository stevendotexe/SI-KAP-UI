"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { api } from "@/trpc/react";

// Helper function to format dates
function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export default function MentorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const {
        data,
        isLoading,
        isError,
        refetch,
    } = api.mentors.detail.useQuery({ userId });

    if (isLoading) {
        return (
            <main className="min-h-screen bg-muted text-foreground">
                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    <div className="text-center text-muted-foreground">
                        Memuat data mentor...
                    </div>
                </div>
            </main>
        );
    }

    if (isError || !data) {
        return (
            <main className="min-h-screen bg-muted text-foreground">
                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-sm text-destructive">
                            Gagal memuat data mentor.
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                        >
                            Coba Lagi
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    const { profile, students, stats } = data;

    return (
        <main className="min-h-screen bg-muted text-foreground">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                {/* Header with Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 -ml-2 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">{profile.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {profile.userId}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Status
                        </h3>
                        <div className="text-2xl font-bold mb-1">
                            {profile.active ? "Aktif" : "Nonaktif"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Mentor {profile.active ? "Aktif" : "Nonaktif"}
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Laporan
                        </h3>
                        <div className="text-2xl font-bold mb-1">-</div>
                        <div className="text-xs text-muted-foreground">
                            Diterbitkan
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Jumlah Siswa
                        </h3>
                        <div className="text-2xl font-bold mb-1">
                            {stats.studentCount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Dimentori
                        </div>
                    </div>
                </div>

                {/* Informasi Mentor */}
                <div className="bg-card border rounded-xl shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-6">Informasi Mentor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {/* Left Column */}
                        <div>
                            <label className="text-sm font-semibold block mb-1">Email</label>
                            <p className="text-sm">{profile.email}</p>
                        </div>

                        {/* Right Column */}
                        <div>
                            <label className="text-sm font-semibold block mb-1">Alamat</label>
                            <p className="text-sm">-</p>
                        </div>

                        {/* Left Column */}
                        <div>
                            <label className="text-sm font-semibold block mb-1">Tanggal Mulai</label>
                            <p className="text-sm">{formatDate(stats.startDate)}</p>
                        </div>

                        {/* Right Column */}
                        <div>
                            <label className="text-sm font-semibold block mb-1">Tanggal Selesai</label>
                            <p className="text-sm">{formatDate(stats.endDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Siswa yang dimentori */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Siswa yang dimentori</h3>
                    <div className="rounded-xl overflow-hidden border bg-card shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-destructive text-white">
                                    <tr>
                                        <th className="text-left text-sm font-medium px-4 py-3">
                                            Nama
                                        </th>
                                        <th className="text-left text-sm font-medium px-4 py-3">
                                            Kode
                                        </th>
                                        <th className="text-left text-sm font-medium px-4 py-3">
                                            Email
                                        </th>
                                        <th className="text-left text-sm font-medium px-4 py-3">
                                            Detail
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada siswa yang dimentori
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student, index) => (
                                            <tr
                                                key={student.id}
                                                className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                                            >
                                                <td className="px-4 py-3 text-sm">{student.name}</td>
                                                <td className="px-4 py-3 text-sm">{student.studentId}</td>
                                                <td className="px-4 py-3 text-sm">{student.email}</td>
                                                <td className="px-4 py-3">
                                                    <Link href={`/admin/siswa/${student.studentId}`}>
                                                        <Button
                                                            size="sm"
                                                            className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors"
                                                        >
                                                            Detail
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
