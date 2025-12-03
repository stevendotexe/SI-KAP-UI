"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogIn, LogOut, RefreshCcw, FileText } from "lucide-react"
import { useRef, useState, useEffect, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    useQuery,
} from "@tanstack/react-query"
import { api } from "@/trpc/react"
import { Spinner } from "@/components/ui/spinner"

// Review status constant aligned with backend enum
const REVIEW_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
} as const

// Reverse geocode fetcher (dipakai oleh hook)
async function fetchReverseGeocode(lat: number, lon: number): Promise<string> {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        { headers: { "Accept-Language": "id" } }
    )
    if (!res.ok) throw new Error("reverse geocode gagal")
    const raw: unknown = await res.json()
    const data = (typeof raw === "object" && raw !== null) ? raw as { display_name?: string } : {}
    return data.display_name ?? "Alamat tidak ditemukan"
}

// Hook umum
function useReverseGeocode(lat?: number, lon?: number) {
    return useQuery({
        queryKey: ["revGeo", lat, lon],
        queryFn: async () => {
            if (lat == null || lon == null) return ""
            return fetchReverseGeocode(lat, lon)
        },
        enabled: lat != null && lon != null,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    })
}

export default function DashboardPage() {
    // Compute week range (Monday to Sunday of current week)
    const weekRange = useMemo(() => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        // Sunday is 0, Monday is 1, etc. We want Monday as start
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday)
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        return { from: startOfWeek, to: endOfWeek }
    }, [])

    // tRPC queries for dashboard stats
    const tasksQuery = api.tasks.listAssigned.useQuery({ limit: 200 })
    const reportsQuery = api.reports.listMine.useQuery({
        limit: 200,
        from: weekRange.from,
        to: weekRange.to,
    })

    // Calculate real-time statistics
    const todoCount = tasksQuery.data?.items?.filter(task => task.status === "todo").length ?? 0
    const pendingReviewCount = reportsQuery.data?.items?.filter(report => report.reviewStatus === REVIEW_STATUS.PENDING).length ?? 0
    const totalReportsCount = reportsQuery.data?.items?.length ?? 0

    const statsLoading = tasksQuery.isLoading || reportsQuery.isLoading
    const statsError = tasksQuery.isError || reportsQuery.isError

    const handleRefetchStats = () => {
        void tasksQuery.refetch()
        void reportsQuery.refetch()
    }

    const masukInputRef = useRef<HTMLInputElement | null>(null)
    const keluarInputRef = useRef<HTMLInputElement | null>(null)
    const [masukImageName, setMasukImageName] = useState("")
    const [keluarImageName, setKeluarImageName] = useState("")
    const [cameraOpenFor, setCameraOpenFor] = useState<"masuk" | "keluar" | null>(null)
    const [useFrontCamera, setUseFrontCamera] = useState(true)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [masukLocation, setMasukLocation] = useState<string>("")
    const [keluarLocation, setKeluarLocation] = useState<string>("")
    const [now, setNow] = useState<Date | null>(null)

    const [masukAt, setMasukAt] = useState("")
    const [keluarAt, setKeluarAt] = useState("")
    const [isMasukSaved, setIsMasukSaved] = useState(false)
    const [isKeluarSaved, setIsKeluarSaved] = useState(false)

    // NEW: koordinat terpisah
    const [masukCoords, setMasukCoords] = useState<{ latitude: number; longitude: number } | null>(null)
    const [keluarCoords, setKeluarCoords] = useState<{ latitude: number; longitude: number } | null>(null)

    // Izin
    const [izinOpen, setIzinOpen] = useState(false)
    const [izinReason, setIzinReason] = useState("")
    const [izinFileName, setIzinFileName] = useState("")
    const [isIzinSaved, setIsIzinSaved] = useState(false)
    const izinFileInputRef = useRef<HTMLInputElement | null>(null)

    // Query reverse geocode
    const masukGeo = useReverseGeocode(masukCoords?.latitude, masukCoords?.longitude)
    const keluarGeo = useReverseGeocode(keluarCoords?.latitude, keluarCoords?.longitude)

    // Sinkronkan hasil query ke label lokasi
    useEffect(() => {
        if (masukCoords && masukGeo.data) {
            setMasukLocation(
                `${masukGeo.data} (${masukCoords.latitude.toFixed(6)}, ${masukCoords.longitude.toFixed(6)})`
            )
        }
    }, [masukCoords, masukGeo.data])

    useEffect(() => {
        if (keluarCoords && keluarGeo.data) {
            setKeluarLocation(
                `${keluarGeo.data} (${keluarCoords.latitude.toFixed(6)}, ${keluarCoords.longitude.toFixed(6)})`
            )
        }
    }, [keluarCoords, keluarGeo.data])

    useEffect(() => {
        setNow(new Date())
        const id = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    const formatTs = () =>
        new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }).format(new Date())

    function stopCamera() {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
    }

    async function startCamera() {
        stopCamera()
        try {
            const constraints: MediaStreamConstraints = {
                video: { facingMode: useFrontCamera ? "user" : "environment" },
                audio: false,
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }
        } catch (err) {
            console.error("Camera error:", err)
        }
    }

    function getCoords(): Promise<{ latitude: number; longitude: number }> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("Geolocation tidak didukung"))
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                (err) => {
                    const message = (err && typeof err === "object" && "message" in err)
                        ? String((err as { message?: string }).message)
                        : "Geolocation error"
                    reject(new Error(message))
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            )
        })
    }

    // UPDATED: hanya set koordinat, geocode via query
    async function setLocationFor(which: "masuk" | "keluar") {
        try {
            const coords = await getCoords()
            if (which === "masuk") {
                setMasukCoords(coords)
            } else {
                setKeluarCoords(coords)
            }
        } catch {
            if (which === "masuk") setMasukLocation("Lokasi tidak tersedia")
            else setKeluarLocation("Lokasi tidak tersedia")
        }
    }

    async function capturePhoto() {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        const w = video.videoWidth || 640
        const h = video.videoHeight || 480
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(video, 0, 0, w, h)

        const forWhich = cameraOpenFor
        if (!forWhich) return

        // ⭐ Ubah toBlob jadi Promise agar bisa await
        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png")
        )
        if (!blob) return

        const fileName = `capture-${Date.now()}.png`

        if (forWhich === "masuk") {
            setMasukImageName(fileName)
            setMasukAt(formatTs())
        } else {
            setKeluarImageName(fileName)
            setKeluarAt(formatTs())
        }

        setCameraOpenFor(null)
        stopCamera()

        try {
            const coords = await getCoords()
            if (forWhich === "masuk") setMasukCoords(coords)
            else setKeluarCoords(coords)
        } catch {
            const fallback = "Lokasi tidak tersedia"
            if (forWhich === "masuk") setMasukLocation(fallback)
            else setKeluarLocation(fallback)
        }
    }

    // State for attendance mutation error
    const [attendanceError, setAttendanceError] = useState<string | null>(null)

    // tRPC mutations for attendance
    const checkInMutation = api.attendances.recordCheckIn.useMutation()
    const checkOutMutation = api.attendances.recordCheckOut.useMutation()

    const handleCatatMasuk = async () => {
        const ts = formatTs()
        setMasukAt(ts)
        setAttendanceError(null)
        try {
            await checkInMutation.mutateAsync({
                timestamp: new Date(),
                latitude: masukCoords?.latitude,
                longitude: masukCoords?.longitude,
                locationNote: masukLocation,
            })
            setIsMasukSaved(true)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan presensi masuk"
            setAttendanceError(message)
            alert(message)
        }
    }

    const handleCatatKeluar = async () => {
        const ts = formatTs()
        setKeluarAt(ts)
        setAttendanceError(null)
        try {
            await checkOutMutation.mutateAsync({
                timestamp: new Date(),
                latitude: keluarCoords?.latitude,
                longitude: keluarCoords?.longitude,
                locationNote: keluarLocation,
            })
            setIsKeluarSaved(true)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan presensi keluar"
            setAttendanceError(message)
            alert(message)
        }
    }

    const handleResetMasuk = () => {
        setMasukImageName("")
        setMasukLocation("")
        setMasukAt("")
        setMasukCoords(null)
        setIsMasukSaved(false)
        if (masukInputRef.current) masukInputRef.current.value = ""
        if (cameraOpenFor === "masuk") {
            setCameraOpenFor(null)
            stopCamera()
        }
    }

    const handleResetKeluar = () => {
        setKeluarImageName("")
        setKeluarLocation("")
        setKeluarAt("")
        setKeluarCoords(null)
        setIsKeluarSaved(false)
        if (keluarInputRef.current) keluarInputRef.current.value = ""
        if (cameraOpenFor === "keluar") {
            setCameraOpenFor(null)
            stopCamera()
        }
    }

    const handleResetIzin = () => {
        setIzinReason("")
        setIsIzinSaved(false)
    }

    const handleSaveIzin = async () => {
        setIsIzinSaved(true)
        setIzinOpen(false)
    }

    return (
        <div className="min-h-screen bg-muted/30 p-0 m-0">
            <div className="w-full max-w-none p-0 m-0">
                <main className="space-y-6 p-5 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
                    <section className="p-0">
                        <h1 className="text-2xl sm:text-3xl font-semibold">Selamat datang, Siswa!</h1>
                        <p className="text-muted-foreground mt-1">ID Siswa: 010101</p>
                        <div className="mt-1 flex flex-col gap-6">
                            {/* NOTE: Attendance form posts to /api/attendance endpoint. Backend implementation may be required. */}
                            <div className="order-1 md:order-2">
                                <div className="rounded-2xl border bg-card p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold">Form presensi</h2>
                                            <p className="text-sm text-muted-foreground mt-1">Pilih status kehadiran anda</p>
                                            <p className="text-xs text-muted-foreground">Pengisian presensi masuk hanya dapat dilakukan antara 07:00:00 hingga 07:59:59</p>
                                            <p className="text-xs text-muted-foreground">Pengisian presensi keluar hanya dapat dilakukan antara 15:00:00 hingga 15:59:59</p>
                                        </div>
                                        <div className="text-sm mt-4 sm:mt-0" suppressHydrationWarning>
                                            {now
                                                ? new Intl.DateTimeFormat("en-GB", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                }).format(now)
                                                : "—"}
                                            <br />
                                            <span className="text-muted-foreground">
                                                {now
                                                    ? new Intl.DateTimeFormat("en-GB", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        second: "2-digit",
                                                        hour12: false,
                                                    }).format(now)
                                                    : "—"}
                                            </span>
                                        </div>
                                    </div>

                                    <Separator className="my-6" />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Masuk */}
                                        <div className="rounded-2xl border bg-card p-6">
                                            <h3 className="text-xl font-semibold">Presensi Masuk</h3>
                                            <p className="text-muted-foreground mt-2">
                                                {masukAt ? <span className="font-semibold text-foreground">{masukAt}</span> : "--:--:--"}
                                            </p>
                                            <input
                                                ref={masukInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const f = e.target.files?.[0]
                                                    if (f) {
                                                        setMasukImageName(f.name)
                                                        setMasukAt(formatTs())
                                                        await setLocationFor("masuk")
                                                    } else {
                                                        setMasukImageName("")
                                                        setMasukLocation("")
                                                        setMasukAt("")
                                                        setMasukCoords(null)
                                                    }
                                                }}
                                            />
                                            <div
                                                className={`mt-4 flex items-center gap-2 ${masukImageName && !isMasukSaved ? "justify-between md:justify-start w-full" : ""
                                                    }`}
                                            >
                                                <Button
                                                    variant={(isMasukSaved || isIzinSaved) ? "outline" : "destructive"}
                                                    disabled={isMasukSaved || isIzinSaved}
                                                    className={`h-9 rounded-md px-5 inline-flex items-center gap-2 ${(isMasukSaved || isIzinSaved)
                                                        ? "bg-muted text-muted-foreground border hover:bg-muted cursor-not-allowed"
                                                        : ""
                                                        }`}
                                                    onClick={() => {
                                                        setCameraOpenFor("masuk")
                                                        setTimeout(() => { void startCamera() }, 0)
                                                    }}
                                                    title={isMasukSaved || isIzinSaved ? "Tidak tersedia" : "Ambil Foto"}
                                                >
                                                    <LogIn className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Masuk</span>
                                                </Button>

                                                {masukImageName && !isMasukSaved && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={handleResetMasuk}
                                                        className="h-9 rounded-md px-5 border-destructive text-destructive hover:bg-destructive/10"
                                                        title="Reset presensi masuk"
                                                    >
                                                        Reset
                                                    </Button>
                                                )}

                                                {!masukImageName && (
                                                    <Button
                                                        type="button"
                                                        variant={isIzinSaved ? "outline" : "secondary"}
                                                        className={`h-9 rounded-md px-5 inline-flex items-center gap-2 ${isIzinSaved ? "bg-muted text-muted-foreground border cursor-not-allowed" : ""
                                                            }`}
                                                        onClick={() => setIzinOpen(true)}
                                                        disabled={isIzinSaved}
                                                        title="Ajukan Izin"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        <span className="text-sm font-medium">Izin</span>
                                                    </Button>
                                                )}
                                            </div>
                                            {masukImageName && (
                                                <>
                                                    <p className="mt-2 text-xs text-muted-foreground break-all">
                                                        Lampiran terpilih: {masukImageName}
                                                    </p>
                                                    {masukLocation && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Lokasi: {masukLocation}
                                                        </p>
                                                    )}
                                                    {masukCoords && masukGeo.isLoading && (
                                                        <p className="mt-1 text-xs text-muted-foreground">Memuat alamat...</p>
                                                    )}
                                                    {masukGeo.isError && (
                                                        <p className="mt-1 text-xs text-destructive">Gagal memuat alamat</p>
                                                    )}
                                                    {!isMasukSaved && (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            onClick={() => { void handleCatatMasuk() }}
                                                            className="mt-3 w-full h-10 rounded-md px-5 inline-flex items-center justify-center gap-2 shadow-sm"
                                                            disabled={checkInMutation.isPending}
                                                        >
                                                            <LogIn className="w-4 h-4" />
                                                            <span className="text-sm font-semibold">
                                                                {checkInMutation.isPending ? "Menyimpan..." : "Catat Jam Masuk"}
                                                            </span>
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Keluar */}
                                        <div className="rounded-2xl border bg-card p-6">
                                            <h3 className="text-xl font-semibold">Presensi Keluar</h3>
                                            <p className="text-muted-foreground mt-2">
                                                {keluarAt ? <span className="font-semibold text-foreground">{keluarAt}</span> : "--:--:--"}
                                            </p>
                                            <input
                                                ref={keluarInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const f = e.target.files?.[0]
                                                    if (f) {
                                                        setKeluarImageName(f.name)
                                                        setKeluarAt(formatTs())
                                                        await setLocationFor("keluar")
                                                    } else {
                                                        setKeluarImageName("")
                                                        setKeluarLocation("")
                                                        setKeluarAt("")
                                                        setKeluarCoords(null)
                                                    }
                                                }}
                                            />
                                            <div
                                                className={`mt-4 flex items-center gap-2 ${keluarImageName && !isKeluarSaved ? "justify-between md:justify-start w-full" : ""
                                                    }`}
                                            >
                                                <Button
                                                    variant={(!isMasukSaved || isKeluarSaved || isIzinSaved) ? "outline" : "destructive"}
                                                    disabled={!isMasukSaved || isKeluarSaved || isIzinSaved}
                                                    title={!isMasukSaved ? "Lakukan presensi masuk terlebih dahulu" : "Ambil Foto"}
                                                    className={`h-9 rounded-md px-5 inline-flex items-center gap-2 ${(!isMasukSaved || isKeluarSaved || isIzinSaved)
                                                        ? "bg-muted text-muted-foreground border hover:bg-muted cursor-not-allowed"
                                                        : ""
                                                        }`}
                                                    onClick={() => {
                                                        if (!isMasukSaved) return
                                                        setCameraOpenFor("keluar")
                                                        setTimeout(() => { void startCamera() }, 0)
                                                    }}
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Keluar</span>
                                                </Button>

                                                {keluarImageName && !isKeluarSaved && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={handleResetKeluar}
                                                        className="h-9 rounded-md px-5 border-destructive text-destructive hover:bg-destructive/10"
                                                        title="Reset presensi keluar"
                                                    >
                                                        Reset
                                                    </Button>
                                                )}
                                            </div>
                                            {keluarImageName && (
                                                <>
                                                    <p className="mt-2 text-xs text-muted-foreground break-all">
                                                        File terpilih: {keluarImageName}
                                                    </p>
                                                    {keluarLocation && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Lokasi: {keluarLocation}
                                                        </p>
                                                    )}
                                                    {keluarCoords && keluarGeo.isLoading && (
                                                        <p className="mt-1 text-xs text-muted-foreground">Memuat alamat...</p>
                                                    )}
                                                    {keluarGeo.isError && (
                                                        <p className="mt-1 text-xs text-destructive">Gagal memuat alamat</p>
                                                    )}
                                                    {!isKeluarSaved && (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            onClick={() => { void handleCatatKeluar() }}
                                                            disabled={!isMasukSaved || checkOutMutation.isPending}
                                                            className="mt-3 w-full h-10 rounded-md px-5 inline-flex items-center justify-center gap-2 shadow-sm disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                                                        >
                                                            <LogOut className="w-4 h-4" />
                                                            <span className="text-sm font-semibold">
                                                                {checkOutMutation.isPending ? "Menyimpan..." : "Catat Jam Keluar"}
                                                            </span>
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="order-2 md:order-1 mt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                                        <div className="text-sm font-semibold text-foreground">Belum Dikerjakan</div>
                                        <div className="mt-2 text-3xl font-semibold">{statsLoading ? "..." : todoCount}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">Minggu ini</div>
                                    </div>
                                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                                        <div className="text-sm font-semibold text-foreground">Menunggu Direview</div>
                                        <div className="mt-2 text-3xl font-semibold">{statsLoading ? "..." : pendingReviewCount}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">Menunggu respon Mentor</div>
                                    </div>
                                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                                        <div className="text-sm font-semibold text-foreground">Laporan Terkirim</div>
                                        <div className="mt-2 text-3xl font-semibold">{statsLoading ? "..." : totalReportsCount}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">Minggu ini</div>
                                    </div>
                                </div>
                                {statsError && (
                                    <div className="mt-4 rounded-2xl border border-destructive bg-destructive/10 p-4">
                                        <p className="text-sm text-destructive">
                                            Gagal memuat data terbaru.{" "}
                                            <button
                                                onClick={handleRefetchStats}
                                                className="underline font-medium"
                                            >
                                                Coba lagi
                                            </button>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            {/* Camera Dialog (tetap) */}
            <Dialog
                open={cameraOpenFor !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCameraOpenFor(null)
                        void stopCamera()
                    }
                }}
            >
                <DialogContent
                    className="w-full max-w sm:max-w-lg rounded-10" // square dialog
                >
                    <DialogHeader>
                        <DialogTitle>Ambil Foto {cameraOpenFor === "masuk" ? "Masuk" : "Keluar"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        {/* Preview area: square corners */}
                        <div className="aspect-video w-full bg-black rounded-none overflow-hidden">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                            />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Controls: make buttons square */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Button
                                variant="outline"
                                className="h-9 rounded-md"
                                onClick={() => {
                                    setUseFrontCamera((prev) => !prev)
                                    setTimeout(() => void startCamera(), 0)
                                }}
                                title="Ganti Kamera"
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Ganti Kamera
                            </Button>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="h-9 rounded-md"
                                    onClick={() => {
                                        setCameraOpenFor(null)
                                        void stopCamera()
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="h-9 rounded-md"
                                    onClick={() => void capturePhoto()}
                                >
                                    Ambil Foto
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter />
                </DialogContent>
            </Dialog>

            {/* Dialog Form Izin (tetap) */}
            <Dialog open={izinOpen} onOpenChange={(o) => { if (!o) { void setIzinOpen(false) } }}>
                <DialogContent className="sm:max-w-lg rounded-sm">
                    <DialogHeader>
                        <DialogTitle>Form Izin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <textarea
                            className="w-full h-32 text-sm p-2 border rounded-sm resize-y outline-none"
                            placeholder="Tulis alasan izin (contoh: sakit, keperluan keluarga, dsb.)"
                            value={izinReason}
                            onChange={(e) => setIzinReason(e.target.value)}
                            disabled={isIzinSaved}
                        />
                        <div className="space-y-2">
                            <input
                                ref={izinFileInputRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    if (isIzinSaved) return
                                    const f = e.target.files?.[0]
                                    setIzinFileName(f ? f.name : "")
                                }}
                                disabled={isIzinSaved}
                            />
                            <div className="mt-2 flex items-center gap-3 flex-wrap">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto h-9 rounded-full border border-border bg-card text-foreground px-4 py-0 inline-flex items-center justify-start"
                                    onClick={() => izinFileInputRef.current?.click()}
                                    disabled={isIzinSaved}
                                >
                                    Unggah Lampiran
                                </Button>

                                <div
                                    className="relative w-full sm:flex-1 min-w-[220px] rounded-full border border-destructive/60 bg-card text-destructive/80 text-sm px-4 py-2"
                                    style={{ borderStyle: "dashed" }}
                                >
                                    {izinFileName ? izinFileName : "Belum ada lampiran"}
                                    {izinFileName && !isIzinSaved && (
                                        <button
                                            type="button"
                                            aria-label="Hapus file"
                                            onClick={() => {
                                                setIzinFileName("")
                                                if (izinFileInputRef.current) izinFileInputRef.current.value = ""
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full h-6 w-6 text-destructive hover:bg-destructive/10"
                                        >
                                            <span className="text-sm leading-none">×</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between mt-4">
                        <div className="flex gap-2">
                            <Button variant="outline" className="h-9 rounded-md" onClick={() => { setIzinOpen(false) }}>
                                Batal
                            </Button>
                            {(izinReason || izinFileName) && !isIzinSaved && (
                                <Button
                                    variant="outline"
                                    className="h-9 rounded-md text-destructive border-destructive hover:bg-destructive/10"
                                    onClick={handleResetIzin}
                                    title="Bersihkan"
                                >
                                    Bersihkan
                                </Button>
                            )}
                        </div>
                        <Button
                            variant="destructive"
                            className="h-9 rounded-md"
                            onClick={() => { void handleSaveIzin() }}
                            disabled={!izinReason || isIzinSaved}
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}