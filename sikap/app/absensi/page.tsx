"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type AttendanceStatus = "hadir" | "izin"

interface AttendanceRecord {
  status: AttendanceStatus
  reason?: string
  photoDataUrl?: string
  timestamp: string // ISO string
}

const ALLOWED_START_HOUR = 7 // 07:00 local time (inclusive)
const ALLOWED_END_HOUR = 8   // 08:00 local time (exclusive)

export default function AbsensiPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [status, setStatus] = useState<AttendanceStatus | "">("")
  const [reason, setReason] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [savedRecord, setSavedRecord] = useState<AttendanceRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Redirect non-student or unauthenticated
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/login")
      else if (user.role !== "student") router.push("/dashboard")
    }
  }, [user, isLoading, router])

  // Load existing record from localStorage
  useEffect(() => {
    if (!user) return
    const key = `attendance:${user.id}:${todayKey}`
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (raw) {
      try {
        setSavedRecord(JSON.parse(raw))
      } catch {}
    }
  }, [user, todayKey])

  // Create photo preview
  useEffect(() => {
    if (!photoFile) return setPhotoPreview(null)
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(photoFile)
  }, [photoFile])

  if (isLoading || !user) return null

  // Determine allowed window (07:00:00 - 07:59:59)
  const now = new Date()
  const start = new Date()
  start.setHours(ALLOWED_START_HOUR, 0, 0, 0)
  const end = new Date()
  end.setHours(ALLOWED_END_HOUR, 0, 0, 0)
  const isWithinWindow = now >= start && now < end
  const beforeWindow = now < start
  const afterWindow = now >= end

  const alreadySubmitted = Boolean(savedRecord)
  const autoAbsent = afterWindow && !alreadySubmitted

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setPhotoFile(null)
      return
    }
    // Accept only jpg/png
    if (!/(image\/jpeg|image\/png)/.test(file.type)) {
      alert("Format gambar harus JPG atau PNG")
      e.currentTarget.value = ""
      setPhotoFile(null)
      return
    }
    setPhotoFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || alreadySubmitted || autoAbsent) return

    // Validation
    if (status !== "hadir" && status !== "izin") {
      alert("Silakan pilih status: Hadir atau Izin")
      return
    }
    if (status === "hadir" && !photoFile) {
      alert("Unggah foto kehadiran (JPG/PNG)")
      return
    }
    if (status === "izin" && !reason.trim()) {
      alert("Isi keterangan alasan izin")
      return
    }

    setSubmitting(true)

    // Convert photo to data URL if exists
    let photoDataUrl: string | undefined
    if (status === "hadir" && photoFile) {
      photoDataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result as string)
        fr.onerror = () => reject(new Error("Gagal membaca file"))
        fr.readAsDataURL(photoFile)
      })
    }

    const record: AttendanceRecord = {
      status,
      reason: status === "izin" ? reason.trim() : undefined,
      photoDataUrl,
      timestamp: new Date().toISOString(),
    }

    const key = `attendance:${user.id}:${todayKey}`
    if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(record))
    setSavedRecord(record)
    setSubmitting(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Absensi</h1>
        <p className="text-muted-foreground mt-2">Silahkan isi absensi Anda</p>
      </div>

      {/* Status Hari Ini */}
      <Card>
        <CardHeader>
          <CardTitle>Status Hari Ini</CardTitle>
          <CardDescription>
            {alreadySubmitted
              ? `Anda telah mengisi absensi dengan status ${savedRecord?.status === "hadir" ? "Hadir" : "Izin"} pada pukul ${new Date(savedRecord!.timestamp).toLocaleTimeString()}`
              : autoAbsent
                ? "Anda belum mengisi absensi hingga batas waktu. Status: Tidak Hadir."
                : "Silakan isi absensi sebelum batas waktu."}
          </CardDescription>
        </CardHeader>
      </Card>

  {/* Form + Informasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Absensi */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Form Absensi</CardTitle>
            <CardDescription>Pilih status kehadiran Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pilihan Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="hadir"
                    checked={status === "hadir"}
                    onChange={() => setStatus("hadir")}
                    disabled={alreadySubmitted || !isWithinWindow}
                  />
                  <span>Hadir</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="izin"
                    checked={status === "izin"}
                    onChange={() => setStatus("izin")}
                    disabled={alreadySubmitted || !isWithinWindow}
                  />
                  <span>Izin</span>
                </label>
              </div>
              {status === "hadir" && (
                <div className="space-y-2">
                  <Label htmlFor="photo">Unggah Foto Kehadiran (JPG/PNG)</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    disabled={alreadySubmitted || !isWithinWindow}
                  />
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Pratinjau Foto Kehadiran"
                      className="mt-2 h-40 w-auto rounded border"
                    />
                  )}
                </div>
              )}
              {status === "izin" && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Keterangan Alasan Izin</Label>
                  <Textarea
                    id="reason"
                    placeholder="Tuliskan alasan izin Anda..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={alreadySubmitted || !isWithinWindow}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={alreadySubmitted || !isWithinWindow || submitting}>
                {submitting
                  ? "Menyimpan..."
                  : alreadySubmitted
                    ? "Sudah Terkirim"
                    : afterWindow
                      ? "Lewat Batas Waktu"
                      : beforeWindow
                        ? "Belum Waktu Pengisian"
                        : "Kirim Absensi"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatus("")
                  setReason("")
                  setPhotoFile(null)
                  setPhotoPreview(null)
                }}
                disabled={alreadySubmitted || !isWithinWindow || submitting}
              >
                Reset
              </Button>
            </div>
            </form>
          </CardContent>
        </Card>

        {/* Informasi Absensi */}
        <Card>
          <CardContent className="space-y-2">
            <p className="text-base font-semibold">Batas waktu absensi</p>
            <p className="text-sm text-muted-foreground">Pengisian absensi hanya dapat dilakukan antara 07:00:00 hingga 07:59:59</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
