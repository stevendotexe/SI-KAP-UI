"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react" // + useState

export default function DetailTugasSiswaPage() {
  const subtitle = "Minggu 1 - 2025-09-08"
  const desc =
    "Buat desain high-fidelity untuk halaman utama aplikasi menggunakan Figma dengan menampilkan elemen-elemen utama seperti header, navigasi, konten utama, dan footer. Pastikan tata letak, warna, tipografi, serta jarak antar elemen sesuai dengan prinsip desain yang baik dan konsisten dengan style guide yang telah ditetapkan."

  const [isMarkedDone, setIsMarkedDone] = useState(false) // NEW

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
        {/* Header: back button + title + subtitle */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => history.back()}
            aria-label="Kembali"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold">Detail Tugas</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Card */}
        <section className="mt-6">
          <div className="rounded-[20px] border bg-card p-6 sm:p-8 shadow-sm">
            <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
              {desc}
            </p>

            <div className="mt-6">
              <h3 className="font-semibold">Tenggat waktu</h3>
              <p className="mt-2 text-sm">20 November 2025</p>
            </div>

            <div className="mt-3 flex items-center gap-3"> {/* NEW wrapper */}
              {!isMarkedDone && (
                <Button
                  variant="destructive"
                  className="h-9 px-4"
                  asChild
                >
                  <Link href="/daftar-tugas-siswa/detail-tugas/upload-tugas">
                    <span className="mr-2 text-lg leading-none">＋</span>
                    Unggah tugas
                  </Link>
                </Button>
              )}
              {isMarkedDone && (
                <Button
                  variant="destructive"
                  disabled
                  className="h-9 px-4 opacity-60 pointer-events-none"
                  title="Sudah ditandai selesai"
                >
                  <span className="mr-2 text-lg leading-none">＋</span>
                  Upload tugas
                </Button>
              )}

              {!isMarkedDone && (
                <Button
                  variant="outline"
                  className="h-9 px-4 border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => setIsMarkedDone(true)}
                >
                  Tandai Selesai
                </Button>
              )}
              {isMarkedDone && (
                <span className="text-sm font-medium text-muted-foreground">
                  Ditandai selesai
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
