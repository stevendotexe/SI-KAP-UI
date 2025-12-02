"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function DetailLaporanPage() {
  const params = useSearchParams()
  const title = params.get("title") ?? "Penyiapan Awal Orientasi"
  const dateStr = params.get("date") ?? "Minggu 1 - 2025-09-08"
  const mentor = params.get("mentor") ?? "Ahsan Nur Ilham"
  const siswa = params.get("siswa") ?? "Rafif Zharif"
  const skor = params.get("skor") ?? "85/100"
  const status = params.get("status") ?? "Diserahkan"
  const submittedAt = params.get("submittedAt") ?? "2025-09-08"

  const aktivitas = params.get("aktivitas") ?? "Minggu ini saya menyelesaikan proses onboarding, menyiapkan lingkungan pengembangan, dan mengikuti sesi orientasi."
  const tantangan = params.get("tantangan") ?? "Awalnya ada beberapa kendala saat penyiapan lingkungan, tetapi tim TI membantu menyelesaikannya dengan cepat."
  const rencana = params.get("rencana") ?? "Minggu depan saya berencana mulai mengerjakan desain skema basis data."

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-5 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-5">
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
                {title}
              </h1>
              <p className="text-muted-foreground">{dateStr}</p>

              {/* Mentor block */}
              <div className="mt-3">
                <div className="text-sm text-muted-foreground">Mentor</div>
                <div className="text-xl font-semibold text-foreground">
                  {mentor}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-10">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Siswa</div>
              <div className="text-lg font-semibold">{siswa}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Skor</div>
              <div className="text-2xl font-semibold">{skor}</div>
            </div>
          </div>
        </div>

        {/* Status row */}
        <div className="mt-4 flex items-center gap-4">
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
            {status}
          </span>
          <span className="text-sm text-muted-foreground">
            Diserahkan pada {submittedAt}
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
                  {aktivitas}
                </p>
              </div>

              <div>
                <div className="font-semibold">Tantangan &amp; Solusi</div>
                <p className="text-sm mt-1 text-foreground/90">
                  {tantangan}
                </p>
              </div>

              <div>
                <div className="font-semibold">Rencana Minggu Depan</div>
                <p className="text-sm mt-1 text-foreground/90">
                  {rencana}
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
