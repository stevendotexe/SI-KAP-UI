"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { api } from "@/trpc/react";

export default function TambahMentorPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nama: "",
        email: "",
        password: "",
        noTelp: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch the first company to use as companyId
    const { data: companiesData } = api.companies.list.useQuery({
        limit: 1,
        offset: 0,
    });
    const companyId = companiesData?.items[0]?.id;

    const createMentor = api.mentors.create.useMutation({
        onSuccess: () => {
            router.push("/admin/mentor");
        },
        onError: (error) => {
            setErrors({
                submit: error.message || "Gagal menambahkan mentor. Silakan coba lagi.",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setErrors({});

        // Basic validation
        const newErrors: Record<string, string> = {};
        if (!formData.nama.trim()) {
            newErrors.nama = "Nama harus diisi";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email harus diisi";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email tidak valid";
        }
        if (!formData.password) {
            newErrors.password = "Password harus diisi";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password minimal 8 karakter";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!companyId) {
            setErrors({ submit: "Gagal mendapatkan data perusahaan" });
            return;
        }

        createMentor.mutate({
            email: formData.email,
            password: formData.password,
            name: formData.nama,
            phone: formData.noTelp || undefined,
            companyId: companyId,
        });
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
                        <h1 className="text-2xl font-semibold">Tambahkan Mentor</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Isi Data Mentor
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-card border rounded-xl shadow-sm p-8">
                    <h3 className="text-lg font-semibold mb-6">Identitas Pribadi Mentor</h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error message */}
                        {errors.submit && (
                            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                                {errors.submit}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nama */}
                            <div>
                                <Label htmlFor="nama" className="text-sm font-medium mb-2 block">
                                    Nama <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="nama"
                                    placeholder="Ahsan Nur Ilham"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama: e.target.value })
                                    }
                                    className={`rounded-lg ${errors.nama ? "border-destructive" : ""}`}
                                />
                                {errors.nama && (
                                    <p className="text-xs text-destructive mt-1">{errors.nama}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ahsan@example.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className={`rounded-lg ${errors.email ? "border-destructive" : ""}`}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <Label htmlFor="password" className="text-sm font-medium mb-2 block">
                                    Password <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    className={`rounded-lg ${errors.password ? "border-destructive" : ""}`}
                                />
                                {errors.password && (
                                    <p className="text-xs text-destructive mt-1">{errors.password}</p>
                                )}
                            </div>

                            {/* No Telp */}
                            <div>
                                <Label htmlFor="noTelp" className="text-sm font-medium mb-2 block">
                                    No Telp
                                </Label>
                                <Input
                                    id="noTelp"
                                    type="tel"
                                    placeholder="081234567890"
                                    value={formData.noTelp}
                                    onChange={(e) =>
                                        setFormData({ ...formData, noTelp: e.target.value })
                                    }
                                    className="rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <Button
                                type="submit"
                                disabled={createMentor.isPending}
                                className="bg-destructive hover:bg-red-700 text-white rounded-full px-8 cursor-pointer transition-colors disabled:opacity-50"
                            >
                                {createMentor.isPending ? "Menambahkan..." : "Tambahkan"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
