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
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";

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
    const [kejuruan, setKejuruan] = useState<"TKJ" | "RPL">("TKJ");
    const [scores, setScores] = useState<ScoreData>({
        disiplin: 85,
        inisiatif: 90,
        tanggungJawab: 88,
        kerjaSama: 92,
        kerajinan: 87,
    });

    const [kejuruanItems, setKejuruanItems] = useState<KejuruanItem[]>(tkjDefaultItems);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemName, setEditingItemName] = useState("");

    const [totalNilai, setTotalNilai] = useState(0);
    const [rataRata, setRataRata] = useState(0);

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

    const handleAddKejuruanItem = () => {
        const newId = (Math.max(...kejuruanItems.map((i) => parseInt(i.id))) + 1).toString();
        setKejuruanItems([
            ...kejuruanItems,
            { id: newId, name: "Kompetensi Baru", score: 0 },
        ]);
    };

    const handleDeleteKejuruanItem = (id: string) => {
        setKejuruanItems(kejuruanItems.filter((item) => item.id !== id));
    };

    const handleStartEditItemName = (item: KejuruanItem) => {
        setEditingItemId(item.id);
        setEditingItemName(item.name);
    };

    const handleSaveItemName = () => {
        if (editingItemId) {
            setKejuruanItems(
                kejuruanItems.map((item) =>
                    item.id === editingItemId ? { ...item, name: editingItemName } : item
                )
            );
            setEditingItemId(null);
            setEditingItemName("");
        }
    };

    const handleCancelEditItemName = () => {
        setEditingItemId(null);
        setEditingItemName("");
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
                    {/* Kejuruan Selector */}
                    <div className="bg-card border rounded-xl shadow-sm p-6">
                        <Label htmlFor="kejuruan" className="text-sm font-medium mb-2 block">
                            Kejuruan
                        </Label>
                        <Select value={kejuruan} onValueChange={(value: "TKJ" | "RPL") => setKejuruan(value)}>
                            <SelectTrigger className="rounded-lg w-full md:w-1/2">
                                <SelectValue placeholder="Pilih kejuruan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TKJ">Teknik Komputer dan Jaringan (TKJ)</SelectItem>
                                <SelectItem value="RPL">Rekayasa Perangkat Lunak (RPL)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

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
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">
                                Kompetensi Kejuruan
                            </h3>
                            <Button
                                type="button"
                                onClick={handleAddKejuruanItem}
                                size="sm"
                                className="bg-destructive hover:bg-red-700 text-white rounded-full cursor-pointer"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Tambah Item
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {kejuruanItems.map((item) => (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div>
                                        {editingItemId === item.id ? (
                                            <div className="space-y-2">
                                                <Input
                                                    value={editingItemName}
                                                    onChange={(e) => setEditingItemName(e.target.value)}
                                                    className="rounded-lg"
                                                    placeholder="Nama kompetensi"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={handleSaveItemName}
                                                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer"
                                                    >
                                                        Simpan
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleCancelEditItemName}
                                                        className="rounded-lg cursor-pointer"
                                                    >
                                                        Batal
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Label className="text-sm font-medium flex-1">{item.name}</Label>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleStartEditItemName(item)}
                                                    className="hover:bg-muted cursor-pointer"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteKejuruanItem(item.id)}
                                                    className="hover:bg-destructive/10 text-destructive cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
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
