"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/trpc/react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import BackButton from "@/components/students/BackButton"
import { formatFileSize } from "@/lib/file-utils"
import { sanitizeHtml } from "@/lib/sanitize-html"
import { FileText, Image as ImageIcon, File as FileIcon, Download, CheckCircle2, XCircle, Clock } from "lucide-react"

// Format date to Indonesian locale
function formatDate(date: Date | string | null): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

// Get file type icon based on mime type
function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <FileIcon className="size-5" />
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-5" />
  if (mimeType === "application/pdf") return <FileText className="size-5" />
  return <FileIcon className="size-5" />
}

// Map report type to Indonesian label
function getReportTypeLabel(type: string): string {
  switch (type) {
    case "daily": return "Harian"
    case "weekly": return "Mingguan"
    case "monthly": return "Bulanan"
    default: return type
  }
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
          <CheckCircle2 className="size-4" /> Disetujui
        </span>
      )
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
          <XCircle className="size-4" /> Ditolak
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
          <Clock className="size-4" /> Menunggu Review
        </span>
      )
  }
}

// Review form component (client-side interactive)
function ReviewForm({ reportId, onSuccess }: { reportId: number; onSuccess: () => void }) {
  const [notes, setNotes] = React.useState("")
  const [score, setScore] = React.useState("")
  const [status, setStatus] = React.useState<"approved" | "rejected">("approved")
  const [error, setError] = React.useState<string | null>(null)

  const reviewMutation = api.reports.review.useMutation({
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      setError(err.message || "Gagal menyimpan review. Silakan coba lagi.")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!notes.trim() || notes.trim().length < 10) {
      setError("Catatan review minimal 10 karakter")
      return
    }

    const scoreNum = Number(score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setError("Nilai harus berupa angka antara 0-100")
      return
    }

    reviewMutation.mutate({
      reportId,
      notes: notes.trim(),
      score: scoreNum,
      status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Status Review</label>
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="approved"
              checked={status === "approved"}
              onChange={() => setStatus("approved")}
              className="size-4"
            />
            <span className="text-sm">Disetujui</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="rejected"
              checked={status === "rejected"}
              onChange={() => setStatus("rejected")}
              className="size-4"
            />
            <span className="text-sm">Ditolak</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="score" className="block text-sm font-medium mb-2">Nilai (0-100)</label>
        <Input
          id="score"
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Masukkan nilai"
          className="w-32"
          required
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-2">Catatan Review</label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tulis catatan review untuk siswa (minimal 10 karakter)"
          rows={4}
          required
        />
        <div className="text-xs text-muted-foreground mt-1">{notes.length} karakter</div>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <Button 
        type="submit" 
        variant="destructive" 
        disabled={reviewMutation.isPending}
        className="w-full sm:w-auto"
      >
        {reviewMutation.isPending ? (
          <>
            <Spinner className="size-4 mr-2" /> Menyimpan...
          </>
        ) : (
          "Simpan Review"
        )}
      </Button>
    </form>
  )
}

export default function Page() {
  const params = useParams()
  const router = useRouter()
  const reportId = Number(params.id)

  const { data, isLoading, isError, refetch } = api.reports.detail.useQuery(
    { reportId },
    { enabled: !isNaN(reportId) }
  )

  const handleReviewSuccess = React.useCallback(() => {
    refetch()
  }, [refetch])

  if (isNaN(reportId)) {
    return (
      <main className="min-h-screen bg-muted text-foreground">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <BackButton hrefFallback="/mentor/laporan" />
          <div className="mt-4 text-destructive">ID laporan tidak valid.</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <BackButton hrefFallback="/mentor/laporan" />
        
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6">
            <Spinner /> Memuat laporan...
          </div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2 mt-6">
            <div className="text-sm text-destructive">Gagal memuat laporan.</div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        ) : data ? (
          <div className="mt-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{data.title ?? "Laporan Tanpa Judul"}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Laporan {getReportTypeLabel(data.type)}
                </p>
              </div>
              <StatusBadge status={data.reviewStatus} />
            </div>

            {/* Student Info */}
            <div className="bg-card border rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Informasi Siswa</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Nama</div>
                  <div className="text-sm font-medium">{data.student.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm">{data.student.email ?? "-"}</div>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="bg-card border rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Detail Laporan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground">Periode Mulai</div>
                  <div className="text-sm">{formatDate(data.periodStart)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Periode Selesai</div>
                  <div className="text-sm">{formatDate(data.periodEnd)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tanggal Submit</div>
                  <div className="text-sm">{formatDate(data.submittedAt)}</div>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-2">Isi Laporan</div>
                <div 
                  className="prose prose-sm max-w-none text-sm bg-muted/50 rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content) || "<p>Tidak ada konten.</p>" }}
                />
              </div>
            </div>

            {/* Attachments */}
            {data.files.length > 0 && (
              <div className="bg-card border rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  Lampiran ({data.files.length} file)
                </h2>
                <div className="space-y-2">
                  {data.files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="flex-shrink-0 text-muted-foreground">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{file.filename ?? "File"}</div>
                        {file.sizeBytes && (
                          <div className="text-xs text-muted-foreground">{formatFileSize(file.sizeBytes)}</div>
                        )}
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="size-4" /> Unduh
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Review */}
            {data.reviewStatus !== "pending" && (
              <div className="bg-card border rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Review Mentor</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Mentor</div>
                    <div className="text-sm font-medium">{data.mentor?.name ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Nilai</div>
                    <div className="text-lg font-semibold text-primary">{data.score ?? "-"}/100</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tanggal Review</div>
                    <div className="text-sm">{formatDate(data.reviewedAt)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Catatan Review</div>
                  <div className="text-sm bg-muted/50 rounded-lg p-4">
                    {data.reviewNotes ?? "Tidak ada catatan."}
                  </div>
                </div>
              </div>
            )}

            {/* Review Form (if pending) */}
            {data.reviewStatus === "pending" && (
              <div className="bg-card border rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Form Review</h2>
                <ReviewForm reportId={data.id} onSuccess={handleReviewSuccess} />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}

