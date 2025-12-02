"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function TambahSiswaPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nama: "",
        nis: "",
        tempatLahir: "",
        tanggalLahir: "",
        jenisKelamin: "",
        semester: "",
        kompetensiKeahlian: "",
        asalSekolah: "",
        alamat: "",
        noTelp: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log(formData);
        router.back();
    };

    return (
        <main className="min-h-screen bg-muted text-foreground">
            <div className="max-w-[800px] mx-auto px-6 py-8">
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
                        <h1 className="text-2xl font-semibold">Tambahkan Siswa</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Isi Data Siswa
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-card border rounded-xl shadow-sm p-8">
                    <h3 className="text-lg font-semibold mb-6">Identitas Pribadi Siswa</h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nama */}
                            <div>
                                <Label htmlFor="nama" className="text-sm font-medium mb-2 block">
                                    Nama
                                </Label>
                                <Input
                                    id="nama"
                                    placeholder="Rafif Zharif"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama: e.target.value })
                                    }
                                    className="rounded-lg"
                                />
                            </div>

                            {/* NIS */}
                            <div>
                                <Label htmlFor="nis" className="text-sm font-medium mb-2 block">
                                    NIS
                                </Label>
                                <Input
                                    id="nis"
                                    placeholder="234658594"
                                    value={formData.nis}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nis: e.target.value })
                                    }
                                    className="rounded-lg"
                                />
                            </div>

                            {/* Tempat Lahir */}
                            <div>
                                <Label htmlFor="tempatLahir" className="text-sm font-medium mb-2 block">
                                    Tempat Lahir
                                </Label>
                                <Input
                                    id="tempatLahir"
                                    placeholder="Bandung"
                                    value={formData.tempatLahir}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tempatLahir: e.target.value })
                                    }
                                    className="rounded-lg"
                                />
                            </div>

                            {/* Tanggal Lahir */}
                            <div>
                                <Label htmlFor="tanggalLahir" className="text-sm font-medium mb-2 block">
                                    Tanggal Lahir
                                </Label>
                                <Input
                                    id="tanggalLahir"
                                    type="date"
                                    value={formData.tanggalLahir}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tanggalLahir: e.target.value })
                                    }
                                    className="rounded-lg"
                                />
                            </div>

                            {/* Jenis Kelamin */}
                            <div>
                                <Label htmlFor="jenisKelamin" className="text-sm font-medium mb-2 block">
                                    Jenis Kelamin
                                </Label>
                                <Select
                                    value={formData.jenisKelamin}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, jenisKelamin: value })
                                    }
                                >
                                    <SelectTrigger className="rounded-lg">
                                        <SelectValue placeholder="Laki-laki" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="laki-laki">Laki-laki</SelectItem>
                                        <SelectItem value="perempuan">Perempuan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Semester */}
                            <div>
                                <Label htmlFor="semester" className="text-sm font-medium mb-2 block">
                                    Semester
                                </Label>
                                <Input
                                    id="semester"
                                    placeholder="6"
                                    type="number"
                                    value={formData.semester}
                                    onChange={(e) =>
                                        setFormData({ ...formData, semester: e.target.value })
                                    }
                                    className="rounded-lg"
                                />
                            </div>

                            {/* Kompetensi Keahlian */}
                            <div>
                                <Label htmlFor="kompetensiKeahlian" className="text-sm font-medium mb-2 block">
                                    Kompetensi Keahlian
                                </Label>
                                <Select
                                    value={formData.kompetensiKeahlian}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, kompetensiKeahlian: value })
                                    }
                                >
                                    <SelectTrigger className="rounded-lg">
                                        <SelectValue placeholder="Teknik Komputer & jaringan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tkj">Teknik Komputer & jaringan</SelectItem>
                                        <SelectItem value="rpl">Rekayasa Perangkat Lunak</SelectItem>
                                        <SelectItem value="mm">Multimedia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Asal Sekolah */}
                            <div>
                                <Label htmlFor="asalSekolah" className="text-sm font-medium mb-2 block">
                                    Asal Sekolah
                                </Label>
                                <Input
                                    id="asalSekolah"
                                    placeholder="SMK 1 Tasikmalaya"
                                    value={formData.asalSekolah}
                                    onChange={(e) =>
                                        setFormData({ ...formData, asalSekolah: e.target.value })
                                    }
                                    className="rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Alamat - Full Width */}
                        <div>
                            <Label htmlFor="alamat" className="text-sm font-medium mb-2 block">
                                Alamat
                            </Label>
                            <Input
                                id="alamat"
                                placeholder=""
                                value={formData.alamat}
                                onChange={(e) =>
                                    setFormData({ ...formData, alamat: e.target.value })
                                }
                                className="rounded-lg"
                            />
                        </div>

                        {/* No Telp - Full Width */}
                        <div>
                            <Label htmlFor="noTelp" className="text-sm font-medium mb-2 block">
                                No telp
                            </Label>
                            <Input
                                id="noTelp"
                                placeholder=""
                                value={formData.noTelp}
                                onChange={(e) =>
                                    setFormData({ ...formData, noTelp: e.target.value })
                                }
                                className="rounded-lg"
                            />
                        </div>

                        {/* Submit Button */}
                        <div>
                            <Button
                                type="submit"
                                className="bg-destructive hover:bg-red-700 text-white rounded-full px-8 cursor-pointer transition-colors"
                            >
                                Tambahkan
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
