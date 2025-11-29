"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function DetailLaporanPage() {
  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
        {/* Header: back + title/subtitle + right info */}
        <div className="flex items-start justify-between">
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
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-semibold">
                Penyiapan Awal Orientasi
              </h1>
              <p className="text-muted-foreground">Minggu 1 - 2025-09-08</p>

              {/* Mentor block */}
              <div className="mt-3">
                <div className="text-sm text-muted-foreground">Mentor</div>
                <div className="text-xl font-semibold text-foreground">
                  Ahsan Nur Ilham
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-10">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Siswa</div>
              <div className="text-lg font-semibold">Rafif Zharif</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Skor</div>
              <div className="text-2xl font-semibold">85/100</div>
            </div>
          </div>
        </div>

        {/* Status row */}
        <div className="mt-4 flex items-center gap-4">
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
            Diserahkan
          </span>
          <span className="text-sm text-muted-foreground">
            Diserahkan pada 2025-09-08
          </span>
        </div>

        {/* Detail Laporan card */}
        <section className="mt-6">
          <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
            <h3 className="font-semibold">Detail Laporan</h3>

            <div className="mt-4 space-y-5">
              <div>
                <div className="font-semibold">Aktivitas Minggu Ini</div>
                <p className="text-sm mt-1 text-foreground/90">
                  Minggu ini saya menyelesaikan proses onboarding, menyiapkan lingkungan pengembangan,
                  dan mengikuti sesi orientasi.
                </p>
              </div>

              <div>
                <div className="font-semibold">Tantangan &amp; Solusi</div>
                <p className="text-sm mt-1 text-foreground/90">
                  Awalnya ada beberapa kendala saat penyiapan lingkungan, tetapi tim TI membantu
                  menyelesaikannya dengan cepat.
                </p>
              </div>

              <div>
                <div className="font-semibold">Rencana Minggu Depan</div>
                <p className="text-sm mt-1 text-foreground/90">
                  Minggu depan saya berencana mulai mengerjakan desain skema basis data.
                </p>
              </div>

              <Button variant="destructive" className="h-9 px-4 w-max">
                Tampilkan Gambar
              </Button>
            </div>
          </div>
        </section>

        {/* Umpan balik mentor */}
        <section className="mt-4">
          <div className="rounded-2xl border bg-secondary p-5 sm:p-6">
            <div className="font-semibold">Umpan Balik Mentor</div>
            <p className="text-sm mt-2 text-muted-foreground">
              Awal yang bagus! Penyiapan sudah lengkap dan siap memulai pekerjaan pengembangan.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
