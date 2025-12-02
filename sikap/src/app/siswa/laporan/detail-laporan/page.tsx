"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { api } from "@/trpc/react"

export default function DetailLaporanPage() {
  const params = useSearchParams()
  const idParam = params.get("eventId")
  const eventId = idParam && !Number.isNaN(Number(idParam)) ? Number(idParam) : undefined

  const { data, isLoading, isError, refetch } = api.calendarEvents.detail.useQuery(
    { eventId: eventId as number },
    { enabled: !!eventId, retry: 1 }
  )

  // Safe values (tanpa "??")
  const title = data && typeof data.title === "string" && data.title.length
    ? data.title
    : (params.get("title") && params.get("title")!.length ? params.get("title")! : "Penyiapan Awal Orientasi")

  const mentor = data && typeof data.organizerName === "string" && data.organizerName.length
    ? data.organizerName
    : (params.get("mentor") && params.get("mentor")!.length ? params.get("mentor")! : "Ahsan Nur Ilham")

  const siswa = params.get("siswa") && params.get("siswa")!.length ? params.get("siswa")! : "Rafif Zharif"
  const skor = params.get("skor") && params.get("skor")!.length ? params.get("skor")! : "85/100"
  const status = params.get("status") && params.get("status")!.length ? params.get("status")! : "Diserahkan"
  const submittedAt = params.get("submittedAt") && params.get("submittedAt")!.length ? params.get("submittedAt")! : "2025-09-08"

  function computeDateStr() {
    if (data && data.startDate) {
      const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" })
      const s = fmt.format(new Date(data.startDate))
      const e = data.dueDate ? fmt.format(new Date(data.dueDate)) : s
      return s === e ? s : `${s} — ${e}`
    }
    const p = params.get("date")
    return p && p.length ? p : "Minggu 1 - 2025-09-08"
  }
  const dateStr = computeDateStr()

  const aktivitasParam = params.get("aktivitas")
  const aktivitas = aktivitasParam && aktivitasParam.length
    ? aktivitasParam
    : "Minggu ini saya menyelesaikan proses onboarding, menyiapkan lingkungan pengembangan, dan mengikuti sesi orientasi."

  const tantanganParam = params.get("tantangan")
  const tantangan = tantanganParam && tantanganParam.length
    ? tantanganParam
    : "Awalnya ada beberapa kendala saat penyiapan lingkungan, tetapi tim TI membantu menyelesaikannya dengan cepat."

  const rencanaParam = params.get("rencana")
  const rencana = rencanaParam && rencanaParam.length
    ? rencanaParam
    : "Minggu depan saya berencana mulai mengerjakan desain skema basis data."

  const firstAttachment = data && Array.isArray(data.attachments) && data.attachments.length
    ? data.attachments[0]?.url
    : undefined

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-5 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-5">
        {/* Header */}
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
                {isLoading ? "Memuat..." : title}
              </h1>
              <p className="text-muted-foreground">{dateStr}</p>

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

        {/* Status + mitigasi */}
        <div className="mt-4 flex items-center gap-4">
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
            {status}
          </span>
          <span className="text-sm text-muted-foreground">
            Diserahkan pada {submittedAt}
          </span>
        </div>
        {isError && (
          <div className="rounded-2xl border bg-card p-4 text-sm text-destructive">
            Gagal memuat data dari database. Menampilkan data bawaan.
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => { void refetch() }}
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Detail Laporan */}
        <section className="mt-6">
          <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
            <h3 className="font-semibold">Detail Laporan</h3>

            <div className="mt-4 space-y-5">
              <div>
                <div className="font-semibold">Aktivitas Minggu Ini</div>
                <p className="text-sm mt-1 text-foreground/90">{aktivitas}</p>
              </div>

              <div>
                <div className="font-semibold">Tantangan &amp; Solusi</div>
                <p className="text-sm mt-1 text-foreground/90">{tantangan}</p>
              </div>

              <div>
                <div className="font-semibold">Rencana Minggu Depan</div>
                <p className="text-sm mt-1 text-foreground/90">{rencana}</p>
              </div>

              <Button
                variant="destructive"
                className="h-9 px-4 w-max"
                onClick={() => {
                  if (firstAttachment) window.open(firstAttachment, "_blank")
                }}
                disabled={!firstAttachment}
                title={firstAttachment ? "Buka lampiran" : "Lampiran tidak tersedia"}
              >
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
