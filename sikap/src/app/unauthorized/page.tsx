"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-4 rounded-full bg-red-100 p-4">
                        <ShieldX className="h-12 w-12 text-red-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Akses Ditolak
                    </h1>

                    <p className="mt-4 text-gray-600">
                        Anda tidak memiliki akses untuk melihat halaman ini.
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                        Pastikan Anda login dengan akun yang sesuai atau hubungi administrator.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 w-full">
                        <Button
                            asChild
                            variant="destructive"
                            className="w-full"
                        >
                            <Link href="/">Kembali ke Beranda</Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="w-full"
                        >
                            <Link href="/sign-in">Login dengan Akun Lain</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
