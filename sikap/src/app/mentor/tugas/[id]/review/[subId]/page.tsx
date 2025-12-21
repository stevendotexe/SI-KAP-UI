"use client";

import React from "react";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import BackButton from "@/components/students/BackButton";
import { formatFileSize } from "@/lib/file-utils";
import {
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  CheckCircle2,
  Clock,
  ClipboardList,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Format date to Indonesian locale
function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Get file type icon based on mime type
function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <FileIcon className="size-5" />;
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-5" />;
  if (mimeType === "application/pdf") return <FileText className="size-5" />;
  return <FileIcon className="size-5" />;
}

// Status badge component for task
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
          <CheckCircle2 className="size-4" /> Sudah Direview
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm text-red-800">
          <XCircle className="size-4" /> Ditolak
        </span>
      );
    case "submitted":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
          <Clock className="size-4" /> Butuh Review
        </span>
      );
    default: // todo, in_progress
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">
          <ClipboardList className="size-4" /> Belum Dikerjakan
        </span>
      );
  }
}

// Review form component for task submission
function ReviewForm({
  taskId,
  parentTaskId,
  onSuccess,
}: {
  taskId: number;
  parentTaskId: number;
  onSuccess: () => void;
}) {
  const [notes, setNotes] = React.useState("");
  const [score, setScore] = React.useState<number | "">("");
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const reviewMutation = api.tasks.review.useMutation({
    onSuccess: () => {
      onSuccess();
      router.push(`/mentor/tugas/${parentTaskId}/monitoring`);
    },
    onError: (err) => {
      setError(err.message || "Gagal menyimpan review. Silakan coba lagi.");
    },
  });

  function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (score === "" || score < 0 || score > 100) {
      setError("Nilai harus diisi antara 0-100 untuk menyetujui tugas");
      return;
    }

    reviewMutation.mutate({
      taskId,
      status: "approved",
      notes: notes.trim() || undefined,
      score: Number(score),
    });
  }

  function handleReject(e: React.MouseEvent) {
    e.preventDefault();
    setError(null);

    if (!notes.trim()) {
      setError("Catatan wajib diisi saat menolak tugas");
      return;
    }

    reviewMutation.mutate({
      taskId,
      status: "rejected",
      notes: notes.trim(),
    });
  }

  return (
    <form onSubmit={handleApprove} className="space-y-4">
      <div>
        <label htmlFor="score" className="mb-2 block text-sm font-medium">
          Nilai <span className="text-red-500">*</span>
          <span className="text-muted-foreground ml-1">
            (0-100, wajib untuk approve)
          </span>
        </label>
        <input
          id="score"
          type="number"
          min={0}
          max={100}
          step={1}
          value={score}
          onChange={(e) =>
            setScore(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="Masukkan nilai 0-100"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full max-w-[200px] rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-2 block text-sm font-medium">
          Catatan Review{" "}
          <span className="text-muted-foreground">
            (wajib diisi jika menolak)
          </span>
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tulis catatan review untuk siswa"
          rows={4}
          className="rounded"
        />
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          variant="default"
          disabled={reviewMutation.isPending}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          {reviewMutation.isPending ? (
            <>
              <Spinner className="size-4" /> Menyimpan...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" /> Setujui
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={reviewMutation.isPending}
          onClick={handleReject}
          className="gap-2"
        >
          <XCircle className="size-4" /> Tolak
        </Button>
      </div>
    </form>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string; subId: string }>;
}) {
  const { id, subId } = React.use(params);
  const parentTaskId = Number(id);
  const taskId = Number(subId);

  const { data, isLoading, isError, refetch } =
    api.tasks.detailForMentor.useQuery({ taskId }, { enabled: !isNaN(taskId) });

  const handleReviewSuccess = React.useCallback(() => {
    void refetch();
  }, [refetch]);

  if (isNaN(taskId)) {
    return (
      <main className="bg-muted text-foreground min-h-screen">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <BackButton
            hrefFallback={`/mentor/tugas/${parentTaskId}/monitoring`}
          />
          <div className="text-destructive mt-4">ID tugas tidak valid.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <BackButton hrefFallback={`/mentor/tugas/${parentTaskId}/monitoring`} />

        {isLoading ? (
          <div className="text-muted-foreground mt-6 flex items-center gap-2 text-sm">
            <Spinner /> Memuat tugas...
          </div>
        ) : isError ? (
          <div className="mt-6 flex flex-col items-start gap-2">
            <div className="text-destructive text-sm">Gagal memuat tugas.</div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        ) : data ? (
          <div className="mt-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{data.title}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {data.dueDate
                    ? `Deadline: ${formatDate(data.dueDate)}`
                    : "Tanpa deadline"}
                </p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            {/* Task Description */}
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                Deskripsi Tugas
              </h2>
              <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                {data.description || "Tidak ada deskripsi."}
              </div>
            </div>

            {/* Task Attachments (from mentor) */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="bg-card rounded-xl border p-4 shadow-sm">
                <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                  Lampiran Tugas dari Mentor ({data.attachments.length} file)
                </h2>
                <div className="space-y-2">
                  {data.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="text-muted-foreground shrink-0">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {file.filename ?? "File"}
                        </div>
                        {file.sizeBytes && (
                          <div className="text-muted-foreground text-xs">
                            {formatFileSize(file.sizeBytes)}
                          </div>
                        )}
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
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

            {/* Submission Section - Only show if submitted, approved, or rejected */}
            {(data.status === "submitted" ||
              data.status === "approved" ||
              data.status === "rejected") &&
              data.submission && (
                <div className="bg-card rounded-xl border p-4 shadow-sm">
                  <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                    Submission Siswa
                  </h2>

                  <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Tanggal Submit
                      </div>
                      <div className="text-sm">
                        {formatDate(data.submission.submittedAt)}
                      </div>
                    </div>
                  </div>

                  {data.submission.note && (
                    <div className="mb-4">
                      <div className="text-muted-foreground mb-2 text-xs">
                        Catatan Siswa
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                        {data.submission.note}
                      </div>
                    </div>
                  )}

                  {data.submission.files &&
                    data.submission.files.length > 0 && (
                      <div>
                        <div className="text-muted-foreground mb-2 text-xs">
                          File Submission ({data.submission.files.length} file)
                        </div>
                        <div className="space-y-2">
                          {data.submission.files.map((file) => (
                            <div
                              key={file.id}
                              className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3"
                            >
                              <div className="text-muted-foreground shrink-0">
                                {getFileIcon(file.mimeType)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">
                                  {file.filename ?? "File"}
                                </div>
                                {file.sizeBytes && (
                                  <div className="text-muted-foreground text-xs">
                                    {formatFileSize(file.sizeBytes)}
                                  </div>
                                )}
                              </div>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5"
                                >
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
              <div className="bg-card rounded-xl border p-4 shadow-sm">
                <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                  Form Review
                </h2>
                <ReviewForm
                  taskId={data.id}
                  parentTaskId={parentTaskId}
                  onSuccess={handleReviewSuccess}
                />
              </div>
            )}

            {/* Review Result - Only show if approved */}
            {data.status === "approved" && (
              <div className="bg-card rounded-xl border p-4 shadow-sm">
                <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                  Review Mentor
                </h2>
                <div className="space-y-3">
                  <div className="text-sm">
                    <CheckCircle2 className="mr-1 inline-block size-4 text-green-600" />
                    Tugas ini telah disetujui.
                  </div>
                  {data.review?.score !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        Nilai:
                      </span>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-lg font-bold text-green-800">
                        {data.review.score}
                      </span>
                    </div>
                  )}
                  {data.review?.notes && (
                    <div>
                      <div className="text-muted-foreground mb-1 text-xs">
                        Catatan Mentor
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                        {data.review.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Result - Only show if rejected */}
            {data.status === "rejected" && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-medium text-red-800">
                  Tugas Ditolak
                </h2>
                <div className="text-sm text-red-700">
                  <XCircle className="mr-1 inline-block size-4" />
                  Tugas ini telah ditolak. Siswa dapat mengunggah ulang.
                </div>
              </div>
            )}

            {/* Info for not submitted tasks */}
            {(data.status === "todo" || data.status === "in_progress") && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-medium text-amber-800">
                  Tugas Belum Dikerjakan
                </h2>
                <div className="text-sm text-amber-700">
                  Siswa belum mengumpulkan tugas ini. Anda akan bisa mereview
                  setelah siswa mengumpulkan tugas.
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
