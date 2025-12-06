"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { api } from "@/trpc/react";
import { FileUploadField, type FileUploadValue } from "@/components/ui/file-upload-field";

export default function TambahAktivitasPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        type: "" as "in_class" | "field_trip" | "meet_greet" | "",
        date: "",
        time: "",
        organizerName: "",
        colorHex: "#3b82f6",
        description: "",
    });
    const [logo, setLogo] = useState<FileUploadValue[]>([]);
    const [documents, setDocuments] = useState<FileUploadValue[]>([]);

    const createMutation = api.calendarEvents.create.useMutation({
        onSuccess: () => {
            router.push("/admin/aktivitas");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Combine date and time into a single Date object
        const dateTime = new Date(`${formData.date}T${formData.time}:00`);

        // Combine logo and documents for attachments
        const allAttachments = [...logo, ...documents];

        createMutation.mutate({
            title: formData.title,
            type: formData.type as "in_class" | "field_trip" | "meet_greet",
            date: dateTime,
            description: formData.description || undefined,
            organizerName: formData.organizerName || undefined,
            organizerLogoUrl: logo.length > 0 ? logo[0]?.url : undefined,
            colorHex: formData.colorHex || undefined,
            placementId: undefined, // Company-wide event
            attachments: allAttachments.length > 0
                ? allAttachments.map(a => ({ url: a.url, filename: a.filename }))
                : undefined,
        });
    };

    const isSubmitting = createMutation.isPending;

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
                            <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                                Nama Kegiatan
                            </Label>
                            <Input
                                id="title"
                                placeholder="Contoh: Workshop Web Development"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
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
                                    setFormData({ ...formData, type: value as typeof formData.type })
                                }
                                required
                            >
                                <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Pilih tipe kegiatan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="in_class">In-Class</SelectItem>
                                    <SelectItem value="field_trip">Field Trip</SelectItem>
                                    <SelectItem value="meet_greet">Meet & Greet</SelectItem>
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
                                htmlFor="organizerName"
                                className="text-sm font-medium mb-2 block"
                            >
                                Penyelenggara
                            </Label>
                            <Input
                                id="organizerName"
                                placeholder="Contoh: PT Teknologi Indonesia"
                                value={formData.organizerName}
                                onChange={(e) =>
                                    setFormData({ ...formData, organizerName: e.target.value })
                                }
                                className="rounded-lg"
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
                                    value={formData.colorHex}
                                    onChange={(e) =>
                                        setFormData({ ...formData, colorHex: e.target.value })
                                    }
                                    className="w-20 h-10 rounded-lg cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={formData.colorHex}
                                    onChange={(e) =>
                                        setFormData({ ...formData, colorHex: e.target.value })
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
                            <Label className="text-sm font-medium mb-2 block">
                                Logo Penyelenggara
                            </Label>
                            <FileUploadField
                                ownerType="calendar_event"
                                ownerId={null}
                                value={logo}
                                onChange={setLogo}
                                label=""
                                description="Upload logo penyelenggara (opsional)"
                                accept="image/*"
                                maxFiles={1}
                            />
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
                            />
                        </div>

                        {/* Dokumentasi */}
                        <div>
                            <Label className="text-sm font-medium mb-2 block">
                                Dokumentasi / File Pendukung
                            </Label>
                            <FileUploadField
                                ownerType="calendar_event"
                                ownerId={null}
                                value={documents}
                                onChange={setDocuments}
                                label=""
                                description="Upload file pendukung (opsional). Format: PDF, DOC, XLS, JPG, PNG (Max. 10MB per file)"
                                multiple
                                maxFiles={5}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                className="bg-destructive hover:bg-red-700 text-white rounded-full px-8 cursor-pointer transition-colors"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner className="mr-2" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Simpan Aktivitas"
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="rounded-full px-8 cursor-pointer"
                                disabled={isSubmitting}
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
