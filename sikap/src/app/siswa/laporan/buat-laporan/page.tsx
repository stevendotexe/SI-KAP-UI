"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileUploadField, type FileUploadValue } from "@/components/ui/file-upload-field"
import { Send, ChevronLeft } from "lucide-react"
import { useState } from "react"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"

type ReportType = "daily" | "weekly" | "monthly"

export default function BuatLaporanPage() {
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState<ReportType | "">("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [attachments, setAttachments] = useState<FileUploadValue[]>([])

  // tRPC mutation
  const createReport = api.reports.create.useMutation({
    onSuccess: () => {
      // Navigate back to reports list
      router.push("/siswa/laporan")
    },
    onError: (error) => {
      alert(`Gagal membuat laporan: ${error.message}`)
    },
  })

  // Form submission
  const handleSubmit = async () => {
    // Validate required fields
    if (!title.trim()) {
      alert("Judul laporan harus diisi")
      return
    }
    if (!content.trim()) {
      alert("Isi laporan harus diisi")
      return
    }
    if (!type) {
      alert("Tipe laporan harus dipilih")
      return
    }

    // Prepare mutation input
    createReport.mutate({
      title: title.trim(),
      content: content.trim(),
      type: type as ReportType,
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      attachments,
    })
  }

  // Clear form handler
  const handleReset = () => {
    if (createReport.isPending) return
    setTitle("")
    setContent("")
    setType("")
    setPeriodStart("")
    setPeriodEnd("")
    // Keep attachments (already uploaded to storage)
  }

  const isPending = createReport.isPending
  const hasContent = title.trim() || content.trim() || type || attachments.length > 0

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
            <h1 className="text-2xl sm:text-3xl font-semibold">Laporan</h1>
            <p className="text-muted-foreground">Buat Laporan</p>
          </div>
        </div>

        {/* Card */}
        <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          {/* Judul area tugas */}
          <h2 className="text-base sm:text-lg font-semibold">Form Laporan</h2>

          {/* Form fields */}
          <div className="mt-4 space-y-5">
            {/* Title field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Judul Laporan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul laporan"
                disabled={isPending}
                className="w-full rounded-xl border bg-card px-4 py-2 text-sm"
              />
            </div>

            {/* Report type selector */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Tipe Laporan <span className="text-red-500">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as ReportType)}
                disabled={isPending}
              >
                <SelectTrigger
                  id="type"
                  className="w-full rounded-xl border bg-card px-4 py-2 text-sm"
                >
                  <SelectValue placeholder="Pilih tipe laporan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Period dates (optional) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Periode Laporan (Opsional)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="periodStart" className="text-xs text-muted-foreground">
                    Tanggal Mulai
                  </Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border bg-card px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="periodEnd" className="text-xs text-muted-foreground">
                    Tanggal Selesai
                  </Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border bg-card px-4 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Content textarea */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">
                Isi Laporan <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan laporan Anda di sini..."
                className="w-full h-32 sm:h-36 rounded-xl border bg-card px-4 py-3 text-sm outline-none resize-none disabled:bg-muted/50 disabled:text-muted-foreground"
                disabled={isPending}
              />
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <FileUploadField
                ownerType="report"
                ownerId={0} // Temporary ID, will be replaced after report creation
                value={attachments}
                onChange={setAttachments}
                multiple={true}
                maxFiles={5}
                accept="image/*,application/pdf"
                label="Lampiran (Opsional)"
                description="Upload file pendukung (max 4.5MB per file)"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Actions: Reset (left) + Send (right) */}
          <div className="mt-8 flex items-center justify-end gap-3">
            {!isPending && hasContent && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="px-5 h-9 rounded-md border-destructive text-destructive hover:bg-destructive/10"
                title="Clear"
              >
                Clear
              </Button>
            )}
            <Button
              variant="destructive"
              className="px-5 h-9 rounded-md"
              onClick={handleSubmit}
              disabled={isPending || !title.trim() || !content.trim() || !type}
              title={isPending ? "Mengirim..." : "Kirim"}
            >
              <Send className="size-4" />
              <span className="ml-2">{isPending ? "Mengirim..." : "Kirim"}</span>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

