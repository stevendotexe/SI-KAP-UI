"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MentorDetailPage() {
    const params = useParams();
    const router = useRouter();

    // Dummy data
    const mentor = {
        id: params.id,
        name: "Ahsan Nur Ilham",
        code: "MEN-001",
        status: "Aktif",
        statusLabel: "Mentor Aktif",
        laporan: 12,
        laporanLabel: "Diterbitkan",
        jumlahSiswa: 12,
        jumlahSiswaLabel: "Dimentori",
        email: "ahsan@gmail.com",
        tanggalMulai: "15-06-2025",
        tanggalSelesai: "15-12-2025",
        alamat: "JL.Pendidikan No.31",
    };

    const students = [
        {
            id: 1,
            name: "Rafif Zharif",
            code: "MEN-001",
            email: "ahsan@gmail.com",
            jumlahSiswa: 7,
            status: "Aktif",
        },
        {
            id: 2,
            name: "Rafif Zharif",
            code: "MEN-001",
            email: "ahsan@gmail.com",
            jumlahSiswa: 6,
            status: "Aktif",
        },
        {
            id: 3,
            name: "Rafif Zharif",
            code: "MEN-001",
            email: "ahsan@gmail.com",
            jumlahSiswa: 3,
            status: "Aktif",
        },
        {
            id: 4,
            name: "Rafif Zharif",
            code: "MEN-001",
            email: "ahsan@gmail.com",
            jumlahSiswa: 8,
            status: "Aktif",
        },
        {
            id: 5,
            name: "Rafif Zharif",
            code: "MEN-001",
            email: "ahsan@gmail.com",
            jumlahSiswa: 5,
            status: "Aktif",
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
                        className="mb-4 -ml-2 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">{mentor.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {mentor.code}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Status
                        </h3>
                        <div className="text-2xl font-bold mb-1">{mentor.status}</div>
                        <div className="text-xs text-muted-foreground">
                            {mentor.statusLabel}
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Laporan
                        </h3>
                        <div className="text-2xl font-bold mb-1">{mentor.laporan}</div>
                        <div className="text-xs text-muted-foreground">
                            {mentor.laporanLabel}
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Jumlah Siswa
                        </h3>
                        <div className="text-2xl font-bold mb-1">
                            {mentor.jumlahSiswa}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {mentor.jumlahSiswaLabel}
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
                            <p className="text-sm">{mentor.email}</p>
                        </div>

                        {/* Right Column */}
                        <div>
                            <label className="text-sm font-semibold block mb-1">Alamat</label>
                            <p className="text-sm">{mentor.alamat}</p>
                        </div>

                        {/* Left Column */}
                        <div>
                            <label className="text-sm font-semibold block mb-1">Tanggal Mulai</label>
                            <p className="text-sm">{mentor.tanggalMulai}</p>
                        </div>

                        {/* Right Column */}
                        <div>
                            <label className="text-sm font-semibold block mb-1">Tanggal Selesai</label>
                            <p className="text-sm">{mentor.tanggalSelesai}</p>
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
                                            Jumlah Siswa
                                        </th>
                                        <th className="text-left text-sm font-medium px-4 py-3">
                                            Status
                                        </th>
                                        <th className="text-left text-sm font-medium px-4 py-3">
                                            Detail
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr
                                            key={student.id}
                                            className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                                        >
                                            <td className="px-4 py-3 text-sm">{student.name}</td>
                                            <td className="px-4 py-3 text-sm">{student.code}</td>
                                            <td className="px-4 py-3 text-sm">{student.email}</td>
                                            <td className="px-4 py-3 text-sm">{student.jumlahSiswa}</td>
                                            <td className="px-4 py-3 text-sm">{student.status}</td>
                                            <td className="px-4 py-3">
                                                <Link href={`/admin/siswa/${student.id}`}>
                                                    <Button
                                                        size="sm"
                                                        className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors"
                                                    >
                                                        Detail
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
