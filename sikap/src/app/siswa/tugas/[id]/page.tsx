"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { ChevronLeft, FileText, Image as ImageIcon } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";
import Link from "next/link";
import { getTaskStatusBadgeConfig } from "@/components/tasks/task-status-badge";
import { SafeHTML } from "@/components/ui/SafeHTML";

export default function DetailTugasSiswaPage() {
  const params = useParams();
  const taskId = Number(params.id);

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

  // Fetch task detail with tRPC
  const { data, isLoading, error } = api.tasks.detail.useQuery({
    taskId,
  });

  // Helper function to format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Tidak ditentukan";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Check if task can be uploaded (only todo or in_progress status)
  const canUpload = (status: string) => {
    return status === "todo" || status === "in_progress";
  };

  // Loading state
  if (isLoading) {
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
                Detail Tugas
              </h1>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner />
            <p className="text-muted-foreground mt-4">Memuat detail tugas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - use error.data?.code for reliable tRPC error handling
  if (error || !data) {
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
              onClick={() => history.back()}
              aria-label="Kembali"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Detail Tugas
              </h1>
            </div>
          </div>
          <div className="bg-card rounded-2xl border p-4 shadow-sm md:p-6">
            <p className="text-center text-red-600">{errorMessage}</p>
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

  const badge = getTaskStatusBadgeConfig(data.status);

  return (
    <div className="bg-muted/30 m-0 min-h-screen p-0">
      <div className="w-full max-w-none space-y-6 p-5 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
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
            <h1 className="text-2xl font-semibold sm:text-3xl">{data.title}</h1>
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
          <div className="bg-card rounded-[20px] border p-6 shadow-sm sm:p-8">
            <h3 className="font-semibold">Deskripsi Tugas</h3>
            <SafeHTML
              html={data.description ?? "Tidak ada deskripsi"}
              className="text-foreground/90 mt-2 text-sm leading-relaxed sm:text-base prose prose-sm max-w-none"
            />

            {/* Task Attachments */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 font-semibold">Lampiran Tugas</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {data.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
                    >
                      {file.mimeType?.startsWith("image/") ? (
                        <ImageIcon className="size-8 flex-shrink-0 text-blue-500" />
                      ) : (
                        <FileText className="size-8 flex-shrink-0 text-red-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {file.filename ?? "File"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {file.sizeBytes ? formatFileSize(file.sizeBytes) : ""}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-semibold">Tenggat waktu</h3>
              <p className="text-destructive mt-2 text-sm font-medium">
                {formatDate(data.dueDate)}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {canUpload(data.status) ? (
                <Button variant="destructive" className="h-9 px-4" asChild>
                  <Link href={`/siswa/tugas/${taskId}/unggah-tugas`}>
                    <span className="mr-2 text-lg leading-none">＋</span>
                    Unggah tugas
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  disabled
                  className="pointer-events-none h-9 px-4 opacity-60"
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
        {data.submission &&
          (data.status === "submitted" ||
            data.status === "approved" ||
            data.status === "rejected") && (
            <section className="mt-4">
              <div className="bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
                <h3 className="font-semibold">Detail Pengumpulan</h3>

                <div className="mt-4 space-y-5">
                  {/* Submission note */}
                  {data.submission.note && (
                    <div>
                      <div className="text-sm font-semibold">Catatan</div>
                      <p className="text-foreground/90 mt-1 text-sm whitespace-pre-wrap">
                        {data.submission.note}
                      </p>
                    </div>
                  )}

                  {/* Submitted date */}
                  {data.submission.submittedAt && (
                    <div>
                      <div className="text-sm font-semibold">
                        Tanggal Pengumpulan
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {formatDate(data.submission.submittedAt)}
                      </p>
                    </div>
                  )}

                  {/* File attachments */}
                  <div>
                    <div className="mb-2 text-sm font-semibold">Lampiran</div>
                    {data.submission.files &&
                      data.submission.files.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {data.submission.files.map((file) => (
                          <a
                            key={file.id}
                            href={`https://sikap-storage.rplupiproject.com${file.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
                          >
                            {file.mimeType?.startsWith("image/") ? (
                              <ImageIcon className="size-8 flex-shrink-0 text-blue-500" />
                            ) : (
                              <FileText className="size-8 flex-shrink-0 text-red-500" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {file.filename ?? "File"}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {file.sizeBytes
                                  ? formatFileSize(file.sizeBytes)
                                  : ""}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
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
  );
}
