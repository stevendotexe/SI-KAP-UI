"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ReportDetailPage() {
    const params = useParams();
    const router = useRouter();

    // Dummy data
    const report = {
        id: params.reportId,
        title: "Penyiapan Awal Orientasi",
        week: "Minggu 1",
        date: "2025-09-08",
        student: {
            name: "Rafif Zharif",
        },
        mentor: {
            name: "Ahsan Nur Ilham",
            submittedDate: "2025-09-08",
            status: "Diserahkan",
        },
        score: "85/100",
        details: {
            aktivitasMingguIni: "Minggu ini saya menyelesaikan proses onboarding, menyiapkan lingkungan pengembangan, dan mengikuti sesi orientasi.",
            tantanganSolusi: "Awalnya ada beberapa kendala saat penyiapan lingkungan, tetapi tim TI membantu menyelesaikannya dengan cepat.",
            rencanaMingguDepan: "Minggu depan saya berencana mulai mengerjakan desain skema basis data.",
        },
        feedback: "Awal yang bagus! Penyiapan sudah lengkap dan siap memulai pekerjaan pengembangan.",
    };

    return (
        <main className="min-h-screen bg-muted text-foreground">
            <div className="max-w-[900px] mx-auto px-6 py-8">
                {/* Header with Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 -ml-2 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">{report.title}</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {report.week} - {report.date}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Siswa</p>
                            <p className="text-xl font-semibold">{report.student.name}</p>
                        </div>
                    </div>
                </div>

                {/* Mentor Info Card */}
                <div className="bg-card border rounded-xl shadow-sm p-6 mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                        Mentor
                    </h3>
                    <h2 className="text-2xl font-bold mb-4">{report.mentor.name}</h2>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                            {report.mentor.status}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            Diserahkan pada {report.mentor.submittedDate}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Skor</p>
                        <p className="text-3xl font-bold">{report.score}</p>
                    </div>
                </div>

                {/* Detail Laporan */}
                <div className="bg-card border rounded-xl shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-6">Detail Laporan</h3>

                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2">Aktivitas Minggu Ini</h4>
                            <p className="text-sm text-muted-foreground">
                                {report.details.aktivitasMingguIni}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Tantangan & Solusi</h4>
                            <p className="text-sm text-muted-foreground">
                                {report.details.tantanganSolusi}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Rencana Minggu Depan</h4>
                            <p className="text-sm text-muted-foreground">
                                {report.details.rencanaMingguDepan}
                            </p>
                        </div>
                    </div>

                    <Button className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 mt-6">
                        Tampilkan Gambar
                    </Button>
                </div>

                {/* Umpan Balik Mentor */}
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-cyan-700 mb-4">
                        Umpan Balik Mentor
                    </h3>
                    <p className="text-cyan-900">{report.feedback}</p>
                </div>
            </div>
        </main>
    );
}
