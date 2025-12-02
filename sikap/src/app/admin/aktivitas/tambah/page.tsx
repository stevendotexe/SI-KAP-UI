"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, X } from "lucide-react";

export default function TambahAktivitasPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        type: "",
        date: "",
        time: "",
        organizer: "",
        color: "#3b82f6",
        description: "",
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setDocumentFiles((prev) => [...prev, ...files]);
    };

    const removeDocument = (index: number) => {
        setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(formData);
        console.log("Logo:", logoPreview);
        console.log("Documents:", documentFiles);
        router.back();
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
                        <h1 className="text-2xl font-semibold">Tambah Aktivitas</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Isi informasi kegiatan baru
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-card border rounded-xl shadow-sm p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nama Kegiatan */}
                        <div>
                            <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                                Nama Kegiatan
                            </Label>
                            <Input
                                id="name"
                                placeholder="Contoh: Workshop Web Development"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="rounded-lg"
                                required
                            />
                        </div>

                        {/* Tipe Kegiatan */}
                        <div>
                            <Label htmlFor="type" className="text-sm font-medium mb-2 block">
                                Tipe Kegiatan
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, type: value })
                                }
                            >
                                <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Pilih tipe kegiatan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="In-Class">In-Class</SelectItem>
                                    <SelectItem value="Field Trip">Field Trip</SelectItem>
                                    <SelectItem value="Meet & Greet">Meet & Greet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Tanggal */}
                            <div>
                                <Label htmlFor="date" className="text-sm font-medium mb-2 block">
                                    Tanggal
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, date: e.target.value })
                                    }
                                    className="rounded-lg"
                                    required
                                />
                            </div>

                            {/* Waktu */}
                            <div>
                                <Label htmlFor="time" className="text-sm font-medium mb-2 block">
                                    Waktu
                                </Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) =>
                                        setFormData({ ...formData, time: e.target.value })
                                    }
                                    className="rounded-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Penyelenggara */}
                        <div>
                            <Label
                                htmlFor="organizer"
                                className="text-sm font-medium mb-2 block"
                            >
                                Penyelenggara
                            </Label>
                            <Input
                                id="organizer"
                                placeholder="Contoh: PT Teknologi Indonesia"
                                value={formData.organizer}
                                onChange={(e) =>
                                    setFormData({ ...formData, organizer: e.target.value })
                                }
                                className="rounded-lg"
                                required
                            />
                        </div>

                        {/* Color Code */}
                        <div>
                            <Label htmlFor="color" className="text-sm font-medium mb-2 block">
                                Kode Warna
                            </Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="color"
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) =>
                                        setFormData({ ...formData, color: e.target.value })
                                    }
                                    className="w-20 h-10 rounded-lg cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) =>
                                        setFormData({ ...formData, color: e.target.value })
                                    }
                                    className="flex-1 rounded-lg"
                                    placeholder="#3b82f6"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Warna akan digunakan pada kalender
                            </p>
                        </div>

                        {/* Logo Penyelenggara */}
                        <div>
                            <Label htmlFor="logo" className="text-sm font-medium mb-2 block">
                                Logo Penyelenggara
                            </Label>
                            <div className="space-y-3">
                                {logoPreview && (
                                    <div className="relative inline-block">
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="w-32 h-32 object-cover rounded-lg border"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                                            onClick={() => setLogoPreview(null)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                                <div>
                                    <label
                                        htmlFor="logo"
                                        className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span className="text-sm">Upload Logo</span>
                                    </label>
                                    <input
                                        id="logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <Label
                                htmlFor="description"
                                className="text-sm font-medium mb-2 block"
                            >
                                Deskripsi Kegiatan
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Jelaskan detail kegiatan..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="rounded-lg min-h-[120px]"
                                required
                            />
                        </div>

                        {/* Dokumentasi */}
                        <div>
                            <Label
                                htmlFor="documents"
                                className="text-sm font-medium mb-2 block"
                            >
                                Dokumentasi / File Pendukung
                            </Label>
                            <div className="space-y-3">
                                {documentFiles.length > 0 && (
                                    <div className="space-y-2">
                                        {documentFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                        <span className="text-xs font-medium text-blue-700">
                                                            {file.name.split(".").pop()?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {(file.size / 1024).toFixed(2)} KB
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeDocument(index)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div>
                                    <label
                                        htmlFor="documents"
                                        className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span className="text-sm">Upload File</span>
                                    </label>
                                    <input
                                        id="documents"
                                        type="file"
                                        multiple
                                        onChange={handleDocumentUpload}
                                        className="hidden"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Format: PDF, DOC, XLS, JPG, PNG (Max. 10MB per file)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                className="bg-destructive hover:bg-red-700 text-white rounded-full px-8 cursor-pointer transition-colors"
                            >
                                Simpan Aktivitas
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
            </div>
        </main>
    );
}
