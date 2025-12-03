"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/trpc/react"
import { useParams } from "next/navigation"
import { ChevronLeft, FileText, Image as ImageIcon } from "lucide-react"
import { formatFileSize } from "@/lib/file-utils"
import Link from "next/link"
import { getTaskStatusBadgeConfig } from "@/components/tasks/task-status-badge"

export default function DetailTugasSiswaPage() {
  const params = useParams()
  const taskId = Number(params.id)

  // Validate task ID
  if (isNaN(taskId)) {
    return (
      <div className="min-h-screen bg-muted/30 p-0 m-0">
        <div className="w-full max-w-none p-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
          <div className="rounded-2xl border bg-card shadow-sm p-4 md:p-6">
            <p className="text-red-600 text-center">ID tugas tidak valid</p>
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

  // Fetch task detail with tRPC
  const { data, isLoading, error } = api.tasks.detail.useQuery({
    taskId,
  })

  // Helper function to format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Tidak ditentukan"
    const d = new Date(date)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Check if task can be uploaded (only todo or in_progress status)
  const canUpload = (status: string) => {
    return status === "todo" || status === "in_progress"
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
                Detail Tugas
              </h1>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner />
            <p className="mt-4 text-muted-foreground">
              Memuat detail tugas...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state - use error.data?.code for reliable tRPC error handling
  if (error || !data) {
    // Determine error message based on tRPC error code
    const errorCode = error?.data?.code
    let errorMessage = "Gagal memuat detail tugas"

    if (errorCode === "NOT_FOUND") {
      errorMessage = "Tugas tidak ditemukan"
    } else if (errorCode === "FORBIDDEN") {
      errorMessage = "Anda tidak memiliki akses ke tugas ini"
    }

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
                Detail Tugas
              </h1>
            </div>
          </div>
          <div className="rounded-2xl border bg-card shadow-sm p-4 md:p-6">
            <p className="text-red-600 text-center">
              {errorMessage}
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

  const badge = getTaskStatusBadgeConfig(data.status)

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
        {/* Header: back button + title */}
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
            <h1 className="text-2xl sm:text-3xl font-semibold">{data.title}</h1>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full ${badge.bg} ${badge.text} px-3 py-1 text-xs font-medium`}
              >
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Task Description Card */}
        <section className="mt-6">
          <div className="rounded-[20px] border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="font-semibold">Deskripsi Tugas</h3>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-foreground/90">
              {data.description ?? "Tidak ada deskripsi"}
            </p>

            {/* Task Attachments */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Lampiran Tugas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.attachments.map((file) => (
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
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-semibold">Tenggat waktu</h3>
              <p className="mt-2 text-sm text-destructive font-medium">
                {formatDate(data.dueDate)}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {canUpload(data.status) ? (
                <Button
                  variant="destructive"
                  className="h-9 px-4"
                  asChild
                >
                  <Link href={`/siswa/tugas/${taskId}/unggah-tugas`}>
                    <span className="mr-2 text-lg leading-none">＋</span>
                    Unggah tugas
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  disabled
                  className="h-9 px-4 opacity-60 pointer-events-none"
                  title="Tugas sudah diserahkan"
                >
                  <span className="mr-2 text-lg leading-none">＋</span>
                  Unggah tugas
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Submission Section - only show if task has been submitted */}
        {data.submission && (data.status === "submitted" || data.status === "approved" || data.status === "rejected") && (
          <section className="mt-4">
            <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
              <h3 className="font-semibold">Detail Pengumpulan</h3>

              <div className="mt-4 space-y-5">
                {/* Submission note */}
                {data.submission.note && (
                  <div>
                    <div className="font-semibold text-sm">Catatan</div>
                    <p className="text-sm mt-1 text-foreground/90 whitespace-pre-wrap">
                      {data.submission.note}
                    </p>
                  </div>
                )}

                {/* Submitted date */}
                {data.submission.submittedAt && (
                  <div>
                    <div className="font-semibold text-sm">Tanggal Pengumpulan</div>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {formatDate(data.submission.submittedAt)}
                    </p>
                  </div>
                )}

                {/* File attachments */}
                <div>
                  <div className="font-semibold text-sm mb-2">Lampiran</div>
                  {data.submission.files && data.submission.files.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.submission.files.map((file) => (
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
        )}
      </div>
    </div>
  )
}

