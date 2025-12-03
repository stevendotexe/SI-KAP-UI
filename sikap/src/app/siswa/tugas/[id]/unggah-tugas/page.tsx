"use client"

import { Button } from "@/components/ui/button"
import { FileUploadField, type FileUploadValue } from "@/components/ui/file-upload-field"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/trpc/react"
import { Send, ChevronLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function UnggahTugasPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = Number(params.id)

  // Form state
  const [notes, setNotes] = useState("")
  const [attachments, setAttachments] = useState<FileUploadValue[]>([])

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

  // Fetch task detail to check status
  const { data: task, isLoading: isLoadingTask, error } = api.tasks.detail.useQuery({
    taskId,
  })

  // Pre-load existing files if any
  useEffect(() => {
    if (task?.submission?.files && task.submission.files.length > 0) {
      setAttachments(task.submission.files.map(f => ({
        url: f.url,
        filename: f.filename ?? undefined,
      })))
    }
    if (task?.submission?.note) {
      setNotes(task.submission.note)
    }
  }, [task])

  // tRPC mutation for submitting task
  const submitTask = api.tasks.submit.useMutation({
    onSuccess: () => {
      // Navigate back to task detail page
      router.push(`/siswa/tugas/${taskId}`)
    },
    onError: (error) => {
      alert(`Gagal mengirim tugas: ${error.message}`)
    },
  })

  const isPending = submitTask.isPending

  // Form submission
  const handleSubmit = async () => {
    // Validate that at least one file is uploaded
    if (attachments.length === 0) {
      alert("Harap unggah file tugas terlebih dahulu")
      return
    }

    const file = attachments[0]
    if (!file?.url) {
      alert("File tidak valid")
      return
    }

    // Submit task with file url and filename
    submitTask.mutate({
      taskId,
      fileUrl: file.url,
      fileName: file.filename || undefined,
      notes: notes.trim() || undefined,
    })
  }

  // Clear notes handler
  const handleClearNotes = () => {
    if (isPending) return
    setNotes("")
  }

  // Check if task can be uploaded
  const canUpload = (status: string) => {
    return status === "todo" || status === "in_progress"
  }

  // Loading state while fetching task
  if (isLoadingTask) {
    return (
      <div className="min-h-screen bg-muted/30 p-0 m-0">
        <div className="w-full max-w-none p-0 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
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
              <h1 className="text-2xl sm:text-3xl font-semibold">Unggah Tugas</h1>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner />
            <p className="mt-4 text-muted-foreground">Memuat...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state - prevents upload form from rendering when task cannot be loaded
  if (error || !task) {
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
              onClick={() => router.back()}
              aria-label="Kembali"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-semibold">Unggah Tugas</h1>
            </div>
          </div>
          <div className="rounded-2xl border bg-card shadow-sm p-4 md:p-6">
            <p className="text-red-600 text-center">
              {errorMessage}
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => router.back()}
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

  // Check if task status allows upload
  if (task && !canUpload(task.status)) {
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
              <h1 className="text-2xl sm:text-3xl font-semibold">Unggah Tugas</h1>
            </div>
          </div>
          <div className="rounded-2xl border bg-card shadow-sm p-4 md:p-6">
            <p className="text-amber-600 text-center">
              Tugas ini sudah diserahkan dan tidak dapat diunggah ulang.
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => router.push(`/siswa/tugas/${taskId}`)}
                className="h-9 px-4"
              >
                Lihat Detail Tugas
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasContent = notes.trim().length > 0 || attachments.length > 0

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
        {/* Header */}
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
            <h1 className="text-2xl sm:text-3xl font-semibold">Unggah Tugas</h1>
            <p className="text-muted-foreground">
              {task?.title ?? "Unggah hasil pengerjaan tugas Anda pada form di bawah ini"}
            </p>
          </div>
        </div>

        {/* Card */}
        <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          {/* Judul area tugas */}
          <h2 className="text-base sm:text-lg font-semibold">Form Unggah Tugas</h2>

          {/* Form fields */}
          <div className="mt-4 space-y-5">
            {/* File upload */}
            <div className="space-y-2">
              <FileUploadField
                ownerType="task"
                ownerId={taskId}
                value={attachments}
                onChange={setAttachments}
                multiple={false}
                accept="image/*,application/pdf"
                label="Lampiran Tugas"
                description="Upload file tugas (max 4.5MB)"
                disabled={isPending}
              />
            </div>

            {/* Textarea notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Catatan (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => !isPending && setNotes(e.target.value)}
                placeholder="Tambahkan catatan untuk tugas Anda"
                className="w-full h-32 sm:h-36 rounded-xl border bg-card px-4 py-3 text-sm outline-none resize-none disabled:bg-muted/50 disabled:text-muted-foreground"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Actions: Clear (left) + Send (right) */}
          <div className="mt-8 flex items-center justify-end gap-3">
            {!isPending && notes.trim().length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearNotes}
                className="px-5 h-9 rounded-md border-destructive text-destructive hover:bg-destructive/10"
                title="Bersihkan catatan"
              >
                Bersihkan
              </Button>
            )}
            <Button
              variant="destructive"
              className="px-5 h-9 rounded-md"
              onClick={handleSubmit}
              disabled={isPending || attachments.length === 0}
              title={isPending ? "Mengirim..." : "Kirim"}
            >
              {isPending ? (
                <>
                  <Spinner className="size-4" />
                  <span className="ml-2">Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span className="ml-2">Kirim</span>
                </>
              )}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

