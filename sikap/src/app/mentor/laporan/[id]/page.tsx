"use client"

import React from "react"
import { useParams } from "next/navigation"
import { api } from "@/trpc/react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import BackButton from "@/components/students/BackButton"
import { formatFileSize } from "@/lib/file-utils"
import { FileText, Image as ImageIcon, File as FileIcon, Download, CheckCircle2, Clock, ClipboardList } from "lucide-react"
import { SafeHTML } from "@/components/ui/SafeHTML"

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

// Status badge component for task
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
          <CheckCircle2 className="size-4" /> Sudah Direview
        </span>
      )
    case "submitted":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
          <Clock className="size-4" /> Belum Direview
        </span>
      )
    default: // todo, in_progress
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
          <ClipboardList className="size-4" /> Belum Dikerjakan
        </span>
      )
  }
}

// Review form component for task submission
function ReviewForm({ taskId, onSuccess }: { taskId: number; onSuccess: () => void }) {
  const [notes, setNotes] = React.useState("")
  const [score, setScore] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const reviewMutation = api.tasks.review.useMutation({
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

    // Validate score
    const scoreNum = parseInt(score, 10)
    if (!score || isNaN(scoreNum)) {
      setError("Skor wajib diisi")
      return
    }
    if (scoreNum < 1 || scoreNum > 100) {
      setError("Skor harus antara 1-100")
      return
    }

    reviewMutation.mutate({
      taskId,
      status: "approved",
      score: scoreNum,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="score" className="block text-sm font-medium mb-2">
          Skor (1-100) <span className="text-destructive">*</span>
        </label>
        <Input
          id="score"
          type="number"
          min="1"
          max="100"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Masukkan skor 1-100"
          className="rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-2">Catatan Review (opsional)</label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tulis catatan review untuk siswa"
          rows={4}
          className="rounded"
        />
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
          "Setujui Tugas"
        )}
      </Button>
    </form>
  )
}

export default function Page() {
  const params = useParams()
  const taskId = Number(params.id)

  const { data, isLoading, isError, refetch } = api.tasks.detailForMentor.useQuery(
    { taskId },
    { enabled: !isNaN(taskId) }
  )

  const handleReviewSuccess = React.useCallback(() => {
    void refetch()
  }, [refetch])

  if (isNaN(taskId)) {
    return (
      <main className="min-h-screen bg-muted text-foreground">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <BackButton hrefFallback="/mentor/laporan" />
          <div className="mt-4 text-destructive">ID tugas tidak valid.</div>
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
            <Spinner /> Memuat tugas...
          </div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2 mt-6">
            <div className="text-sm text-destructive">Gagal memuat tugas.</div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        ) : data ? (
          <div className="mt-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{data.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.dueDate ? `Deadline: ${formatDate(data.dueDate)}` : "Tanpa deadline"}
                </p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            {/* Task Description */}
            <div className="bg-card border rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Deskripsi Tugas</h2>
              <SafeHTML
                html={data.description || "Tidak ada deskripsi."}
                className="text-sm bg-muted/50 rounded-lg p-4 prose prose-sm max-w-none"
              />
            </div>

            {/* Task Attachments (from mentor) */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="bg-card border rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  Lampiran Tugas ({data.attachments.length} file)
                </h2>
                <div className="space-y-2">
                  {data.attachments.map((file) => (
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

            {/* Submission Section - Only show if submitted or approved */}
            {(data.status === "submitted" || data.status === "approved") && data.submission && (
              <div className="bg-card border rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Submission Siswa</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Tanggal Submit</div>
                    <div className="text-sm">{formatDate(data.submission.submittedAt)}</div>
                  </div>
                </div>

                {data.submission.note && (
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-2">Catatan Siswa</div>
                    <div className="text-sm bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                      {data.submission.note}
                    </div>
                  </div>
                )}

                {data.submission.files && data.submission.files.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">File Submission ({data.submission.files.length} file)</div>
                    <div className="space-y-2">
                      {data.submission.files.map((file) => (
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
              </div>
            )}

            {/* Review Form - Only show if status is submitted */}
            {data.status === "submitted" && (
              <div className="bg-card border rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Form Review</h2>
                <ReviewForm taskId={data.id} onSuccess={handleReviewSuccess} />
              </div>
            )}

            {/* Review Result - Only show if approved */}
            {data.status === "approved" && (
              <div className="bg-card border rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Review Mentor</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-green-600" />
                    <span className="text-sm font-medium">Tugas ini telah disetujui</span>
                  </div>

                  {data.score && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Skor:</span>
                      <span className="text-lg font-bold text-primary">{data.score}/100</span>
                    </div>
                  )}

                  {data.reviewNotes && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Catatan Review:</div>
                      <div className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
                        {data.reviewNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info for not submitted tasks */}
            {(data.status === "todo" || data.status === "in_progress") && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-amber-800 mb-2">Tugas Belum Dikerjakan</h2>
                <div className="text-sm text-amber-700">
                  Siswa belum mengumpulkan tugas ini. Anda akan bisa mereview setelah siswa mengumpulkan tugas.
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}
