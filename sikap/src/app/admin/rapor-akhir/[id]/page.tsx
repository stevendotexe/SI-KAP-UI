"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import AttendanceLine from "@/components/students/AttendanceLine";
import { useMemo } from "react";

type ScoreData = {
    // Kompetensi Kepribadian
    disiplin: number;
    inisiatif: number;
    tanggungJawab: number;
    kerjaSama: number;
    kerajinan: number;
};

type KejuruanItem = {
    id: string;
    name: string;
    score: number;
};

const tkjDefaultItems: KejuruanItem[] = [
    { id: "1", name: "Penerapan KSLH", score: 85 },
    { id: "2", name: "Menginstalasi sistem operasi", score: 90 },
    { id: "3", name: "Perbaikan peripheral", score: 88 },
    { id: "4", name: "Perbaikan software jaringan", score: 86 },
    { id: "5", name: "Merakit Komputer", score: 92 },
    { id: "6", name: "Perawatan komputer", score: 89 },
    { id: "7", name: "Menginstal software jaringan", score: 91 },
];

const rplDefaultItems: KejuruanItem[] = [
    { id: "1", name: "Penerapan KSLH", score: 85 },
    { id: "2", name: "Pemrograman Dasar", score: 88 },
    { id: "3", name: "Basis Data", score: 90 },
    { id: "4", name: "Pemrograman Web", score: 87 },
    { id: "5", name: "Pemrograman Mobile", score: 89 },
    { id: "6", name: "UI/UX Design", score: 86 },
    { id: "7", name: "Testing & Deployment", score: 91 },
];

export default function EditRaporAkhirPage() {
    const params = useParams();
    const router = useRouter();

    const [studentName] = useState("Rafif Zharif");
    const studentMajor: "TKJ" | "RPL" = "TKJ"; // In real app, get from student data
    const [kejuruan] = useState<"TKJ" | "RPL">(studentMajor);
    const [scores, setScores] = useState<ScoreData>({
        disiplin: 85,
        inisiatif: 90,
        tanggungJawab: 88,
        kerjaSama: 92,
        kerajinan: 87,
    });

    const [kejuruanItems, setKejuruanItems] = useState<KejuruanItem[]>(tkjDefaultItems);

    const [totalNilai, setTotalNilai] = useState(0);
    const [rataRata, setRataRata] = useState(0);

    // Mock student data - in real app, fetch based on params.id
    const studentData = {
        name: studentName,
        id: "STD-001",
        school: "SMK 13 Tasikmalaya",
        major: kejuruan,
        status: "Aktif",
        batch: "2024",
    };

    // Generate graph data
    const attendanceSeries = useMemo(() => {
        const base = kejuruan === "RPL" ? 85 : 82;
        return [0, 1, 2, 3, 4, 5].map((i) => ({ period: `M${i + 1}`, count: Math.max(60, Math.min(98, Math.round(base + (i - 3) * 2 + (i % 2 ? 3 : -2)))) }));
    }, [kejuruan]);

    const scoreSeries = useMemo(() => {
        const base = kejuruan === "RPL" ? 78 : 75;
        return [0, 1, 2, 3, 4, 5].map((i) => ({ period: `M${i + 1}`, count: Math.max(60, Math.min(98, Math.round(base + (i - 3) * 2 + (i % 2 ? 2 : -1)))) }));
    }, [kejuruan]);

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

    useEffect(() => {
        // Load appropriate items when kejuruan changes
        setKejuruanItems(kejuruan === "TKJ" ? tkjDefaultItems : rplDefaultItems);
    }, [kejuruan]);

    useEffect(() => {
        const kepribadianTotal = Object.values(scores).reduce((sum, val) => sum + val, 0);
        const kejuruanTotal = kejuruanItems.reduce((sum, item) => sum + item.score, 0);
        const total = kepribadianTotal + kejuruanTotal;
        const itemCount = Object.keys(scores).length + kejuruanItems.length;
        const average = itemCount > 0 ? total / itemCount : 0;
        setTotalNilai(total);
        setRataRata(Math.round(average * 10) / 10);
    }, [scores, kejuruanItems]);

    const handleScoreChange = (field: keyof ScoreData, value: string) => {
        const numValue = parseInt(value) || 0;
        const clampedValue = Math.min(100, Math.max(0, numValue));
        setScores({ ...scores, [field]: clampedValue });
    };

    const handleKejuruanScoreChange = (id: string, value: string) => {
        const numValue = parseInt(value) || 0;
        const clampedValue = Math.min(100, Math.max(0, numValue));
        setKejuruanItems(
            kejuruanItems.map((item) =>
                item.id === id ? { ...item, score: clampedValue } : item
            )
        );
    };





    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Saved scores:", scores);
        console.log("Saved kejuruan items:", kejuruanItems);
        router.push("/admin/rapor-akhir");
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
                    <div>
                        <h1 className="text-2xl font-semibold">Edit Rapor Akhir</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {studentName}
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
                                <div><span className="text-muted-foreground">Nama:</span> {studentData.name}</div>
                                <div><span className="text-muted-foreground">ID:</span> {studentData.id}</div>
                                <div><span className="text-muted-foreground">Sekolah:</span> {studentData.school}</div>
                                <div><span className="text-muted-foreground">Jurusan:</span> {studentData.major}</div>
                                <div><span className="text-muted-foreground">Status:</span> {studentData.status}</div>
                                <div><span className="text-muted-foreground">Angkatan:</span> {studentData.batch}</div>
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

                    {/* Kejuruan Selector - REMOVED, now determined from student data */}

                    {/* Kompetensi Kepribadian */}
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-6">
                            Kompetensi Kepribadian
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="disiplin" className="text-sm font-medium mb-2 block">
                                    Disiplin
                                </Label>
                                <Input
                                    id="disiplin"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={scores.disiplin}
                                    onChange={(e) => handleScoreChange("disiplin", e.target.value)}
                                    className="rounded-lg"
                                    placeholder="1-100"
                                />
                            </div>

                            <div>
                                <Label htmlFor="kerjaSama" className="text-sm font-medium mb-2 block">
                                    Kerja sama
                                </Label>
                                <Input
                                    id="kerjaSama"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={scores.kerjaSama}
                                    onChange={(e) => handleScoreChange("kerjaSama", e.target.value)}
                                    className="rounded-lg"
                                    placeholder="1-100"
                                />
                            </div>

                            <div>
                                <Label htmlFor="inisiatif" className="text-sm font-medium mb-2 block">
                                    Inisiatif
                                </Label>
                                <Input
                                    id="inisiatif"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={scores.inisiatif}
                                    onChange={(e) => handleScoreChange("inisiatif", e.target.value)}
                                    className="rounded-lg"
                                    placeholder="1-100"
                                />
                            </div>

                            <div>
                                <Label htmlFor="kerajinan" className="text-sm font-medium mb-2 block">
                                    Kerajinan
                                </Label>
                                <Input
                                    id="kerajinan"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={scores.kerajinan}
                                    onChange={(e) => handleScoreChange("kerajinan", e.target.value)}
                                    className="rounded-lg"
                                    placeholder="1-100"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="tanggungJawab" className="text-sm font-medium mb-2 block">
                                    Tanggung jawab
                                </Label>
                                <Input
                                    id="tanggungJawab"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={scores.tanggungJawab}
                                    onChange={(e) => handleScoreChange("tanggungJawab", e.target.value)}
                                    className="rounded-lg"
                                    placeholder="1-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kompetensi Kejuruan */}
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-6">
                            Kompetensi Kejuruan
                        </h3>
                        <div className="space-y-4">
                            {kejuruanItems.map((item) => (
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
                                            onChange={(e) => handleKejuruanScoreChange(item.id, e.target.value)}
                                            className="rounded-lg"
                                            placeholder="1-100"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
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
                            className="bg-destructive hover:bg-red-700 text-white rounded-full px-8 cursor-pointer transition-colors"
                        >
                            Simpan Nilai
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
