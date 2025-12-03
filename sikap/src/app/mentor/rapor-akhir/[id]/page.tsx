"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import AttendanceLine from "@/components/students/AttendanceLine";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";

type ScoreItem = {
    id: number;
    name: string;
    score: number;
};

export default function EditRaporAkhirPage() {
    const params = useParams();
    const router = useRouter();
    const finalReportId = Number(params.id);

    const { data: reportData, isLoading, error } = api.finalReports.detail.useQuery(
        { finalReportId },
        { enabled: !isNaN(finalReportId) }
    );

    const upsertMutation = api.finalReports.upsertScores.useMutation({
        onSuccess: () => {
            alert("Nilai berhasil disimpan!");
            router.push("/mentor/rapor-akhir");
        },
        onError: (err) => {
            alert(`Gagal menyimpan nilai: ${err.message}`);
        }
    });

    // State for scores
    const [personalityScores, setPersonalityScores] = useState<ScoreItem[]>([]);
    const [technicalScores, setTechnicalScores] = useState<ScoreItem[]>([]);

    const [totalNilai, setTotalNilai] = useState(0);
    const [rataRata, setRataRata] = useState(0);

    // Initialize scores when data loads
    useEffect(() => {
        if (reportData?.scores) {
            setPersonalityScores(reportData.scores.personality);
            setTechnicalScores(reportData.scores.technical);
        }
        // TODO: Backend needs endpoint to fetch competency templates by major (e.g., api.finalReports.getCompetencyTemplates({ major: 'TKJ' })) to support new reports without existing scores.
    }, [reportData]);

    // Calculate totals
    useEffect(() => {
        const personalityTotal = personalityScores.reduce((sum, item) => sum + item.score, 0);
        const technicalTotal = technicalScores.reduce((sum, item) => sum + item.score, 0);
        const total = personalityTotal + technicalTotal;
        const itemCount = personalityScores.length + technicalScores.length;
        const average = itemCount > 0 ? total / itemCount : 0;

        setTotalNilai(total);
        setRataRata(Math.round(average * 10) / 10);
    }, [personalityScores, technicalScores]);

    // Mock graph data (kept from original)
    const attendanceSeries = useMemo(() => {
        // Use major from reportData if available, default to TKJ
        const major = reportData?.student.major || "TKJ";
        const base = major === "RPL" ? 85 : 82;
        return [0, 1, 2, 3, 4, 5].map((i) => ({ period: `M${i + 1}`, count: Math.max(60, Math.min(98, Math.round(base + (i - 3) * 2 + (i % 2 ? 3 : -2)))) }));
    }, [reportData]);

    const scoreSeries = useMemo(() => {
        const major = reportData?.student.major || "TKJ";
        const base = major === "RPL" ? 78 : 75;
        return [0, 1, 2, 3, 4, 5].map((i) => ({ period: `M${i + 1}`, count: Math.max(60, Math.min(98, Math.round(base + (i - 3) * 2 + (i % 2 ? 2 : -1)))) }));
    }, [reportData]);

    const attGrowth = useMemo(() => {
        const first = attendanceSeries[0]?.count ?? 0;
        const last = attendanceSeries[attendanceSeries.length - 1]?.count ?? 0;
        return first ? Math.round(((last - first) / first) * 100) : 0;
    }, [attendanceSeries]);

    const scoreGrowth = useMemo(() => {
        const first = scoreSeries[0]?.count ?? 0;
        const last = scoreSeries[scoreSeries.length - 1]?.count ?? 0;
        return first ? Math.round(((last - first) / first) * 100) : 0;
    }, [scoreSeries]);


    const handlePersonalityChange = (id: number, value: string) => {
        const numValue = parseInt(value) || 0;
        const clampedValue = Math.min(100, Math.max(0, numValue));
        setPersonalityScores(prev =>
            prev.map(item => item.id === id ? { ...item, score: clampedValue } : item)
        );
    };

    const handleTechnicalChange = (id: number, value: string) => {
        const numValue = parseInt(value) || 0;
        const clampedValue = Math.min(100, Math.max(0, numValue));
        setTechnicalScores(prev =>
            prev.map(item => item.id === id ? { ...item, score: clampedValue } : item)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportData) return;

        const allScores = [...personalityScores, ...technicalScores].map(s => ({
            competencyTemplateId: s.id,
            score: s.score
        }));

        upsertMutation.mutate({
            placementId: (reportData as any).placementId, // Cast to any because we will add this field to the backend
            scores: allScores
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (error || isNaN(finalReportId)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <div className="bg-card p-8 rounded-xl border shadow-sm max-w-md w-full text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Terjadi Kesalahan</h2>
                    <p className="text-muted-foreground mb-6">{error?.message || "ID Rapor tidak valid"}</p>
                    <Button onClick={() => router.back()}>Kembali</Button>
                </div>
            </div>
        );
    }

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
                    <div>
                        <h1 className="text-2xl font-semibold">Edit Rapor Akhir</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {reportData?.student.name}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Student Info Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-4 bg-card border rounded-xl shadow-sm p-4">
                            <div className="text-sm font-medium mb-2">Informasi Siswa</div>
                            <div className="space-y-1 text-sm">
                                <div><span className="text-muted-foreground">Nama:</span> {reportData?.student.name}</div>
                                <div><span className="text-muted-foreground">ID:</span> {reportData?.student.code}</div>
                                <div><span className="text-muted-foreground">Sekolah:</span> {reportData?.student.school}</div>
                                <div><span className="text-muted-foreground">Jurusan:</span> {reportData?.student.major}</div>
                                <div><span className="text-muted-foreground">Status:</span> {reportData?.placementStatus}</div>
                                <div><span className="text-muted-foreground">Angkatan:</span> {reportData?.student.cohort}</div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-card border rounded-xl shadow-sm p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm text-muted-foreground">Rata Kehadiran</div>
                                </div>
                                <div className="text-2xl font-semibold">{attendanceSeries.length ? `${attendanceSeries[attendanceSeries.length - 1]!.count}%` : "-"}</div>
                            </div>
                            <div className="mt-2">
                                <AttendanceLine data={attendanceSeries} />
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">Pertumbuhan: {attGrowth}%</div>
                        </div>

                        <div className="lg:col-span-4 bg-card border rounded-xl shadow-sm p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm text-muted-foreground">Rata Skor</div>
                                </div>
                                <div className="text-2xl font-semibold">{scoreSeries.length ? `${scoreSeries[scoreSeries.length - 1]!.count}` : "-"}</div>
                            </div>
                            <div className="mt-2">
                                <AttendanceLine data={scoreSeries} />
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">Pertumbuhan: {scoreGrowth}%</div>
                        </div>
                    </div>

                    {/* Kompetensi Kepribadian */}
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-6">
                            Kompetensi Kepribadian
                        </h3>
                        {personalityScores.length === 0 ? (
                            <p className="text-muted-foreground italic">Belum ada data kompetensi kepribadian.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {personalityScores.map((item) => (
                                    <div key={item.id}>
                                        <Label htmlFor={`p-${item.id}`} className="text-sm font-medium mb-2 block">
                                            {item.name}
                                        </Label>
                                        <Input
                                            id={`p-${item.id}`}
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.score}
                                            onChange={(e) => handlePersonalityChange(item.id, e.target.value)}
                                            className="rounded-lg"
                                            placeholder="1-100"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Kompetensi Kejuruan */}
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-6">
                            Kompetensi Kejuruan
                        </h3>
                        {technicalScores.length === 0 ? (
                            <p className="text-muted-foreground italic">Belum ada data kompetensi kejuruan.</p>
                        ) : (
                            <div className="space-y-4">
                                {technicalScores.map((item) => (
                                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                        <div>
                                            <Label className="text-sm font-medium">{item.name}</Label>
                                        </div>
                                        <div>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={item.score}
                                                onChange={(e) => handleTechnicalChange(item.id, e.target.value)}
                                                className="rounded-lg"
                                                placeholder="1-100"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label className="text-sm font-medium mb-2 block">
                                    Total Nilai
                                </Label>
                                <div className="text-3xl font-bold">{totalNilai}</div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium mb-2 block">
                                    Rata-rata
                                </Label>
                                <div className="text-3xl font-bold">{rataRata}</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={upsertMutation.isPending}
                            className="bg-destructive hover:bg-red-700 text-white rounded-full px-8 cursor-pointer transition-colors"
                        >
                            {upsertMutation.isPending ? "Menyimpan..." : "Simpan Nilai"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="rounded-full px-8 cursor-pointer"
                        >
                            Batal
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}
