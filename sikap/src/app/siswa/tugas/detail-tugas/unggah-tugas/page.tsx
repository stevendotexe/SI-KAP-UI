"use client"

import { Button } from "@/components/ui/button"
import { Send, ChevronLeft, X } from "lucide-react"
import { useRef, useState } from "react"

export default function UnggahTugasPage() {
  const [text, setText] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  // mock save
  async function handleSubmit() {
    if (!text.trim() && !fileName) return
    // Tidak menyimpan data ke API atau storage apa pun untuk saat ini.
    // Submit hanya akan menonaktifkan input & tombol sesuai state in-memory.
    setSubmitted(true)
  }

  // reset handler
  const handleReset = () => {
    if (submitted) return
    setText("") // hanya hapus input paragraf
    // jangan hapus file yang sudah diupload
    // if (fileInputRef.current) fileInputRef.current.value = "" // dihapus
  }

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-5 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
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
            <p className="text-muted-foreground">Unggah hasil pengerjaan tugas Anda pada form di bawah ini</p>
          </div>
        </div>

        {/* Card */}
        <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          {/* Judul area tugas */}
          <h2 className="text-base sm:text-lg font-semibold">Form Unggah Tugas</h2>

          {/* Textarea "Ketik di sini" */}
          <div className="mt-4">
            <textarea
              value={text}
              onChange={(e) => !submitted && setText(e.target.value)}
              placeholder="Ketik deskripsi tugas"
              className="w-full h-32 sm:h-36 rounded-xl border bg-card px-4 py-3 text-sm outline-none disabled:bg-muted/50 disabled:text-muted-foreground"
              disabled={submitted}
            />
          </div>

          {/* Upload + Dropzone */}
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (submitted) return
                const f = e.target.files?.[0] ?? null
                if (f && f.size > MAX_FILE_SIZE) {
                  alert("Ukuran file tidak boleh melebihi 10MB")
                  e.target.value = ""
                  setFileName(null)
                  return
                }
                setFileName(f ? f.name : null)
              }}
              disabled={submitted}
            />
            <Button
              variant="outline"
              className="relative w-full sm:flex-1 min-w-[220px] h-9 px-4 rounded-full justify-between text-left"
              onClick={() => !submitted && fileInputRef.current?.click()}
              disabled={submitted}
            >
              <span>Unggah Lampiran</span>
              <span className="text-xs text-muted-foreground">Max : 10MB</span>
            </Button>

            <div
              className="relative w-full sm:flex-1 min-w-[220px] rounded-full border border-destructive/60 bg-card text-destructive/80 text-sm h-9 px-4 py-2 break-all text-left"
              style={{ borderStyle: "dashed" }}
            >
              {fileName ?? "Belum ada lampiran"}
              {/* Clear file button (X) only when not submitted */}
              {fileName && !submitted && (
                <button
                  type="button"
                  aria-label="Hapus file"
                  onClick={() => {
                    setFileName(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full h-6 w-6 text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Actions: Reset (left) + Send (right) */}
          <div className="mt-8 flex items-center justify-end gap-3">
            {!submitted && (text.trim().length > 0 || !!fileName) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="px-5 h-9 rounded-md border-destructive text-destructive hover:bg-destructive/10"
                title="Bersihkan"
              >
                Bersihkan
              </Button>
            )}
            <Button
              variant="destructive"
              className="px-5 h-9 rounded-md"
              onClick={handleSubmit}
              disabled={submitted || (!text.trim() && !fileName)}
              title={submitted ? "Sudah terkirim" : "Kirim"}
            >
              <Send className="size-4" />
              <span className="ml-2">{submitted ? "Terkirim" : "Kirim"}</span>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
