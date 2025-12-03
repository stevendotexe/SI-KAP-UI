"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/trpc/react"
import { useParams } from "next/navigation"
import { ChevronLeft, FileText, Image as ImageIcon } from "lucide-react"
import { formatFileSize } from "@/lib/file-utils"

export default function DetailLaporanPage() {
  const params = useParams()
  const reportId = Number(params.id)

  // Validate report ID
  if (isNaN(reportId)) {
    return (
      <div className="min-h-screen bg-muted/30 p-0 m-0">
        <div className="w-full max-w-none p-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
          <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
            <p className="text-red-600 text-center">ID laporan tidak valid</p>
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => history.back()}
                className="h-9 px-4"
              >
                Kembali
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fetch report detail with tRPC
  const { data, isLoading, error } = api.reports.detailMine.useQuery({
    reportId,
  })

  // Helper function to format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return ""
    const d = new Date(date)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          label: "Disetujui",
        }
      case "pending":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          label: "Menunggu Review",
        }
      case "rejected":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          label: "Ditolak",
        }
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          label: status,
        }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-0 m-0">
        <div className="w-full max-w-none p-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
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
                Detail Laporan
              </h1>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner />
            <p className="mt-4 text-muted-foreground">
              Memuat detail laporan...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted/30 p-0 m-0">
        <div className="w-full max-w-none p-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
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
                Detail Laporan
              </h1>
            </div>
          </div>
          <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
            <p className="text-red-600 text-center">
              {error?.message?.includes("NOT_FOUND")
                ? "Laporan tidak ditemukan"
                : "Gagal memuat detail laporan"}
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => history.back()}
                className="h-9 px-4"
              >
                Kembali
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const badge = getStatusBadge(data.reviewStatus)

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
                {data.title ?? "Tanpa Judul"}
              </h1>
              <p className="text-muted-foreground">
                {data.periodStart && data.periodEnd
                  ? `Periode: ${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`
                  : "Periode tidak ditentukan"}
              </p>

              {/* Mentor block */}
              <div className="mt-3">
                <div className="text-sm text-muted-foreground">Mentor</div>
                <div className="text-xl font-semibold text-foreground">
                  {data.mentor?.name ?? "Belum ditugaskan"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-10">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Skor</div>
              <div className="text-2xl font-semibold">
                {data.score !== null ? `${data.score}/100` : "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Status row */}
        <div className="mt-4 flex items-center gap-4">
          <span
            className={`inline-flex items-center rounded-full ${badge.bg} ${badge.text} px-3 py-1 text-xs font-medium`}
          >
            {badge.label}
          </span>
          {data.submittedAt && (
            <span className="text-sm text-muted-foreground">
              Diserahkan pada {formatDate(data.submittedAt)}
            </span>
          )}
        </div>

        {/* Detail Laporan card */}
        <section className="mt-6">
          <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
            <h3 className="font-semibold">Detail Laporan</h3>

            <div className="mt-4 space-y-5">
              <div>
                <div className="font-semibold">Isi Laporan</div>
                <p className="text-sm mt-1 text-foreground/90 whitespace-pre-wrap">
                  {data.content ?? "Tidak ada konten"}
                </p>
              </div>

              {/* File attachments */}
              <div>
                <div className="font-semibold mb-2">Lampiran</div>
                {data.files && data.files.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        {file.mimeType?.startsWith("image/") ? (
                          <ImageIcon className="size-8 text-blue-500 flex-shrink-0" />
                        ) : (
                          <FileText className="size-8 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.filename ?? "File"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.sizeBytes
                              ? formatFileSize(file.sizeBytes)
                              : ""}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada lampiran
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Umpan balik mentor - only show if reviewed */}
        {data.reviewStatus !== "pending" && (
          <section className="mt-4">
            <div className="rounded-2xl border bg-secondary p-5 sm:p-6">
              <div className="font-semibold">Umpan Balik Mentor</div>
              <p className="text-sm mt-2 text-muted-foreground">
                {data.reviewNotes ?? "Belum ada catatan"}
              </p>
              {data.reviewedAt && (
                <p className="text-xs mt-2 text-muted-foreground">
                  Direview pada {formatDate(data.reviewedAt)}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
