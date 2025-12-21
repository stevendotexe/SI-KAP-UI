"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  FileUploadField,
  type FileUploadValue,
} from "@/components/ui/file-upload-field";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/trpc/react";
import { Send, ChevronLeft, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UnggahTugasPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = Number(params.id);

  // Form state
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<FileUploadValue[]>([]);

  // Track if initial data has been loaded
  const initializedRef = useRef(false);

  // Fetch task detail to check status
  const {
    data: task,
    isLoading: isLoadingTask,
    error,
  } = api.tasks.detail.useQuery(
    {
      taskId,
    },
    {
      enabled: !isNaN(taskId),
    },
  );

  const utils = api.useUtils();

  // tRPC mutation for submitting task
  const submitTask = api.tasks.submit.useMutation({
    onSuccess: async () => {
      // Invalidate query cache to ensure fresh data
      await utils.tasks.detail.invalidate({ taskId });
      // Navigate back to task detail page
      router.push(`/siswa/tugas/${taskId}`);
    },
    onError: (error) => {
      alert(`Gagal mengirim tugas: ${error.message}`);
    },
  });

  const isPending = submitTask.isPending;

  // Pre-load existing files only once when task data is first available
  useEffect(() => {
    if (initializedRef.current) return;
    if (!task) return;

    initializedRef.current = true;

    if (task.submission?.files && task.submission.files.length > 0) {
      setAttachments(
        task.submission.files.map((f) => ({
          url: f.url,
          filename: f.filename ?? undefined,
        })),
      );
    }
    if (task.submission?.note) {
      setNotes(task.submission.note);
    }
  }, [task]);

  // Validate task ID
  if (isNaN(taskId)) {
    return (
      <div className="bg-muted/30 m-0 min-h-screen p-0">
        <div className="w-full max-w-none space-y-6 p-0 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
          <div className="bg-card rounded-2xl border p-4 shadow-sm md:p-6">
            <p className="text-center text-red-600">ID tugas tidak valid</p>
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
    );
  }

  // Form submission
  const handleSubmit = async () => {
    // Validate that at least one file is uploaded
    if (attachments.length === 0) {
      alert("Harap unggah file tugas terlebih dahulu");
      return;
    }

    const file = attachments[0];
    if (!file?.url) {
      alert("File tidak valid");
      return;
    }

    // Submit task with file url and filename
    submitTask.mutate({
      taskId,
      fileUrl: file.url,
      fileName: file.filename ?? undefined,
      notes: notes.trim() ?? undefined,
    });
  };

  // Clear notes handler
  const handleClearNotes = () => {
    if (isPending) return;
    setNotes("");
  };

  // Check if task can be uploaded (todo, in_progress, or rejected status)
  const canUpload = (status: string) => {
    return (
      status === "todo" || status === "in_progress" || status === "rejected"
    );
  };

  // Loading state while fetching task
  if (isLoadingTask) {
    return (
      <div className="bg-muted/30 m-0 min-h-screen p-0">
        <div className="w-full max-w-none space-y-6 p-5 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
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
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Unggah Tugas
              </h1>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner />
            <p className="text-muted-foreground mt-4">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - prevents upload form from rendering when task cannot be loaded
  if (error || !task) {
    // Determine error message based on tRPC error code
    const errorCode = error?.data?.code;
    let errorMessage = "Gagal memuat detail tugas";

    if (errorCode === "NOT_FOUND") {
      errorMessage = "Tugas tidak ditemukan";
    } else if (errorCode === "FORBIDDEN") {
      errorMessage = "Anda tidak memiliki akses ke tugas ini";
    }

    return (
      <div className="bg-muted/30 m-0 min-h-screen p-0">
        <div className="w-full max-w-none space-y-6 p-0 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
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
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Unggah Tugas
              </h1>
            </div>
          </div>
          <div className="bg-card rounded-2xl border p-4 shadow-sm md:p-6">
            <p className="text-center text-red-600">{errorMessage}</p>
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
    );
  }

  // Check if task status allows upload
  if (task && !canUpload(task.status)) {
    return (
      <div className="bg-muted/30 m-0 min-h-screen p-0">
        <div className="w-full max-w-none space-y-6 p-0 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
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
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Unggah Tugas
              </h1>
            </div>
          </div>
          <div className="bg-card rounded-2xl border p-4 shadow-sm md:p-6">
            <p className="text-center text-amber-600">
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
    );
  }

  return (
    <div className="bg-muted/30 m-0 min-h-screen p-0">
      <div className="m-0 w-full max-w-none space-y-6 p-0 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
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
            <h1 className="text-2xl font-semibold sm:text-3xl">Unggah Tugas</h1>
            <p className="text-muted-foreground">
              {task?.title ??
                "Unggah hasil pengerjaan tugas Anda pada form di bawah ini"}
            </p>
          </div>
        </div>

        {/* Late Submission Warning */}
        {task?.isLate && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Pengumpulan Terlambat
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Tenggat waktu tugas ini sudah lewat. Tugas yang dikirim akan
                dicatat sebagai terlambat.
              </p>
            </div>
          </div>
        )}

        {/* Rejected Task Info */}
        {task?.status === "rejected" && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-50 p-4 dark:bg-red-950/30">
            <RefreshCw className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Upload Ulang Tugas
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Tugas sebelumnya ditolak oleh mentor. Silakan perbaiki dan
                unggah ulang.
              </p>
              {task.submission?.note && (
                <div className="mt-2 rounded bg-red-100 p-2 text-sm text-red-800 dark:bg-red-900/50 dark:text-red-200">
                  <span className="font-medium">Catatan mentor: </span>
                  {task.submission.note}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card */}
        <section className="bg-card mt-6 rounded-2xl border p-6 shadow-sm">
          {/* Judul area tugas */}
          <h2 className="text-base font-semibold sm:text-lg">
            {task?.status === "rejected"
              ? "Form Upload Ulang Tugas"
              : "Form Unggah Tugas"}
          </h2>

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
              <label className="text-sm font-medium">Catatan (Opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => !isPending && setNotes(e.target.value)}
                placeholder="Tambahkan catatan untuk tugas Anda"
                className="bg-card disabled:bg-muted/50 disabled:text-muted-foreground h-32 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none sm:h-36"
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
                className="border-destructive text-destructive hover:bg-destructive/10 h-9 rounded-md px-5"
                title="Bersihkan catatan"
              >
                Bersihkan
              </Button>
            )}
            <Button
              variant="destructive"
              className="h-9 rounded-md px-5"
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
  );
}
