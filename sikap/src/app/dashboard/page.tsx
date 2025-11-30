"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogIn, LogOut, RefreshCcw, FileText } from "lucide-react" // removed Camera, Image
import { useRef, useState, useEffect } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog"

export default function DashboardPage() {
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

	// NEW: timestamps (HH:MM:SS)
	const [masukAt, setMasukAt] = useState("")
	const [keluarAt, setKeluarAt] = useState("")
	// NEW: saved flags
	const [isMasukSaved, setIsMasukSaved] = useState(false)
	const [isKeluarSaved, setIsKeluarSaved] = useState(false)
	// ===== Izin states (+ref) =====
	const [izinOpen, setIzinOpen] = useState(false)
	const [izinReason, setIzinReason] = useState("")
	const [izinFileName, setIzinFileName] = useState("")
	const [isIzinSaved, setIsIzinSaved] = useState(false)
	const izinFileInputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		// set initial client time after mount
		setNow(new Date())
		const id = setInterval(() => setNow(new Date()), 1000)
		return () => clearInterval(id)
	}, [])

	// helper to format current time for stamps (client-only usage remains fine)
	const formatTs = () =>
		new Intl.DateTimeFormat("id-ID", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		}).format(new Date())

	async function startCamera() {
		// stop previous stream if any
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

	function stopCamera() {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop())
			streamRef.current = null
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null
		}
	}

	// Geolocation helper
	function getCoords(): Promise<{ latitude: number; longitude: number }> {
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) return reject(new Error("Geolocation tidak didukung"))
			navigator.geolocation.getCurrentPosition(
				(pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
				(err) => reject(err),
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
			)
		})
	}

	// Reverse geocoding helper (OpenStreetMap Nominatim)
	async function reverseGeocode(lat: number, lon: number): Promise<string> {
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
				{ headers: { "Accept-Language": "id" } }
			)
			if (!res.ok) throw new Error("reverse geocode gagal")
			const data = await res.json()
			return data?.display_name || "Alamat tidak ditemukan"
		} catch {
			return "Alamat tidak ditemukan"
		}
	}

	// Add: set location helper used by both upload handlers
	async function setLocationFor(which: "masuk" | "keluar") {
		try {
			const { latitude, longitude } = await getCoords()
			const addr = await reverseGeocode(latitude, longitude)
			const label = `${addr} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
			if (which === "masuk") setMasukLocation(label)
			else setKeluarLocation(label)
		} catch {
			if (which === "masuk") setMasukLocation("Lokasi tidak tersedia")
			else setKeluarLocation("Lokasi tidak tersedia")
		}
	}

	function capturePhoto() {
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

		// keep which context is active before closing dialog
		const forWhich = cameraOpenFor

		canvas.toBlob(async (blob) => {
			if (!blob || !forWhich) return
			const fileName = `capture-${Date.now()}.png`
			if (forWhich === "masuk") setMasukImageName(fileName)
			else setKeluarImageName(fileName)

			// NEW: stamp time immediately after capture
			if (forWhich === "masuk") setMasukAt(formatTs())
			else setKeluarAt(formatTs())

			// close camera quickly
			setCameraOpenFor(null)
			stopCamera()

			// then get geolocation and reverse-geocode
			try {
				const { latitude, longitude } = await getCoords()
				const addr = await reverseGeocode(latitude, longitude)
				const label = `${addr} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
				if (forWhich === "masuk") setMasukLocation(label)
				else setKeluarLocation(label)
			} catch {
				const fallback = "Lokasi tidak tersedia"
				if (forWhich === "masuk") setMasukLocation(fallback)
				else setKeluarLocation(fallback)
			}

			// TODO: convert blob to File if you need to upload immediately:
			// const file = new File([blob], fileName, { type: "image/png" })
			// upload file...
		}, "image/png")
	}

	// Mock persist helper (replace with real API call)
	async function saveAttendance(which: "masuk" | "keluar") {
		// TODO: call your backend API here with imageName, location, timestamp, etc.
		// await fetch("/api/attendance", { method: "POST", body: JSON.stringify(payload) })
		return Promise.resolve()
	}

	// reset helpers
	const handleResetMasuk = () => {
		setMasukImageName("")
		setMasukLocation("")
		setMasukAt("") // NEW
		setIsMasukSaved(false) // NEW
		if (masukInputRef.current) masukInputRef.current.value = ""
		if (cameraOpenFor === "masuk") {
			setCameraOpenFor(null)
			stopCamera()
		}
	}
	const handleResetKeluar = () => {
		setKeluarImageName("")
		setKeluarLocation("")
		setKeluarAt("") // NEW
		setIsKeluarSaved(false) // NEW
		if (keluarInputRef.current) keluarInputRef.current.value = ""
		if (cameraOpenFor === "keluar") {
			setCameraOpenFor(null)
			stopCamera()
		}
	}
	// Reset izin
	const handleResetIzin = () => {
		setIzinReason("") // hanya hapus isi paragraf
		// jangan hapus lampiran
		// setIzinFileName("")
		// if (izinFileInputRef.current) izinFileInputRef.current.value = ""
		setIsIzinSaved(false)
	}
	// Simpan izin (mock)
	const handleSaveIzin = async () => {
		// TODO: kirim ke backend { alasan: izinReason, lampiran: izinFileName }
		setIsIzinSaved(true)
		setIzinOpen(false)
	}

	// Actions: catat jam
	const handleCatatMasuk = async () => {
		const ts = formatTs()
		setMasukAt(ts)
		await saveAttendance("masuk")
		setIsMasukSaved(true)
	}
	const handleCatatKeluar = async () => {
		const ts = formatTs()
		setKeluarAt(ts)
		await saveAttendance("keluar")
		setIsKeluarSaved(true)
	}

	return (
		<div className="min-h-screen bg-muted/30 p-0 m-0">
			<div className="w-full max-w-none p-0 m-0">
				<main className="space-y-6 p-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
					<section className="p-0"> {/* was: rounded-2xl bg-card p-6 border */}
						<h1 className="text-2xl sm:text-3xl font-semibold">Selamat datang, Siswa!</h1>
						<p className="text-muted-foreground mt-1">ID Siswa: 010101</p>

						{/* Reordered containers: Absensi first on mobile, Stats after */}
						<div className="mt-6 flex flex-col gap-6">
							{/* Absensi */}
							<div className="order-1 md:order-2">
								<div className="rounded-2xl border bg-card p-6">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
										<div>
											<h2 className="text-lg font-semibold">Form absensi</h2>
											<p className="text-sm text-muted-foreground mt-1">Pilih status kehadiran anda</p>
											<p className="text-xs text-muted-foreground">Pengisian absensi masuk hanya dapat dilakukan antara 07:00:00 hingga 07:59:59</p>
											<p className="text-xs text-muted-foreground">Pengisian absensi keluar hanya dapat dilakukan antara 15:00:00 hingga 15:59:59</p>
										</div>
										{/* suppress hydration diff on this dynamic node */}
										<div className="text-sm mt-4 sm:mt-0" suppressHydrationWarning>
											{now
												? new Intl.DateTimeFormat("id-ID", {
														weekday: "long",
														day: "numeric",
														month: "long",
														year: "numeric",
												  }).format(now)
												: "—"}
											<br />
											<span className="text-muted-foreground">
												{now
													? new Intl.DateTimeFormat("id-ID", {
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
											<h3 className="text-xl font-semibold">Absen Masuk</h3>
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
														setMasukAt(formatTs()) // NEW: stamp at upload time
														await setLocationFor("masuk")
													} else {
														setMasukImageName("")
														setMasukLocation("")
														setMasukAt("") // NEW
													}
												}}
											/>
											<div
												className={`mt-4 flex items-center gap-2 ${
													masukImageName && !isMasukSaved ? "justify-between md:justify-start w-full" : ""
												}`}
											>
												<Button
													variant={(isMasukSaved || isIzinSaved) ? "outline" : "destructive"}
													disabled={isMasukSaved || isIzinSaved}
													className={`h-9 rounded-md px-5 inline-flex items-center gap-2 ${
														(isMasukSaved || isIzinSaved)
															? "bg-muted text-muted-foreground border hover:bg-muted cursor-not-allowed"
															: ""
													}`}
													onClick={() => {
														setCameraOpenFor("masuk")
														setTimeout(startCamera, 0)
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
														title="Reset absen masuk"
													>
														Reset
													</Button>
												)}

												{/* Tombol Izin */}
												{!masukImageName && (
													<Button
														type="button"
														variant={isIzinSaved ? "outline" : "secondary"}
														className={`h-9 rounded-md px-5 inline-flex items-center gap-2 ${
															isIzinSaved ? "bg-muted text-muted-foreground border cursor-not-allowed" : ""
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
														File terpilih: {masukImageName}
													</p>
													{masukLocation && (
														<p className="mt-1 text-xs text-muted-foreground">
															Lokasi: {masukLocation}
														</p>
													)}
													{!isMasukSaved && (
														<Button
															type="button"
															variant="destructive"
															onClick={handleCatatMasuk}
															className="mt-3 w-full h-10 rounded-md px-5 inline-flex items-center justify-center gap-2 shadow-sm"
														>
															<LogIn className="w-4 h-4" />
															<span className="text-sm font-semibold">Catat Jam Masuk</span>
														</Button>
													)}
												</>
											)}
										</div>

										{/* Keluar */}
										<div className="rounded-2xl border bg-card p-6">
											<h3 className="text-xl font-semibold">Absen Keluar</h3>
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
														setKeluarAt(formatTs()) // NEW: stamp at upload time
														await setLocationFor("keluar")
													} else {
														setKeluarImageName("")
														setKeluarLocation("")
														setKeluarAt("") // NEW
													}
												}}
											/>
											<div
												className={`mt-4 flex items-center gap-2 ${
													keluarImageName && !isKeluarSaved ? "justify-between md:justify-start w-full" : ""
												}`}
											>
												<Button
													variant={(!isMasukSaved || isKeluarSaved || isIzinSaved) ? "outline" : "destructive"}
													disabled={!isMasukSaved || isKeluarSaved || isIzinSaved}
													title={!isMasukSaved ? "Lakukan absen masuk terlebih dahulu" : "Ambil Foto"}
													className={`h-9 rounded-md px-5 inline-flex items-center gap-2 ${
														(!isMasukSaved || isKeluarSaved || isIzinSaved)
															? "bg-muted text-muted-foreground border hover:bg-muted cursor-not-allowed"
															: ""
													}`}
													onClick={() => {
														if (!isMasukSaved) return
														setCameraOpenFor("keluar")
														setTimeout(startCamera, 0)
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
														title="Reset absen keluar"
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
													{!isKeluarSaved && (
														<Button
															type="button"
															variant="destructive"
															onClick={handleCatatKeluar}
															disabled={!isMasukSaved} // blokir catat keluar bila belum absen masuk
															className="mt-3 w-full h-10 rounded-md px-5 inline-flex items-center justify-center gap-2 shadow-sm disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
														>
															<LogOut className="w-4 h-4" />
															<span className="text-sm font-semibold">Catat Jam Keluar</span>
														</Button>
													)}
												</>
											)}
										</div>
									</div>
								</div>
							</div>

							{/* Stats */}
							<div className="order-2 md:order-1">
								<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									{[
										{ title: "Ditugaskan", value: "2", sub: "Minggu ini" },
										{ title: "Menunggu tinjauan", value: "1", sub: "Menunggu respon mentor" },
										{ title: "Laporan Terkirim", value: "3", sub: "Minggu ini" },
										{ title: "Skor Rata-Rata", value: "8.5", sub: "Dari 10" },
									].map((card) => (
										<div key={card.title} className="rounded-2xl border bg-card p-5 shadow-sm">
											<div className="text-sm font-semibold text-foreground">{card.title}</div> {/* was text-muted-foreground */}
											<div className="mt-2 text-3xl font-semibold">{card.value}</div>
											<div className="mt-1 text-xs text-muted-foreground">{card.sub}</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</section>
				</main>
			</div>

			{/* Camera Dialog */}
			<Dialog
				open={cameraOpenFor !== null}
				onOpenChange={(open) => {
					if (!open) {
						setCameraOpenFor(null)
						stopCamera()
					}
				}}
			>
				<DialogContent className="sm:max-w-md rounded-sm">
					<DialogHeader>
						<DialogTitle>Ambil Foto {cameraOpenFor === "masuk" ? "Masuk" : "Keluar"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="relative bg-black rounded-sm overflow-hidden">
							<video ref={videoRef} className="w-full h-auto" playsInline />
						</div>
						<canvas ref={canvasRef} className="hidden" />
						<div className="flex items-center justify-between gap-3">
							<Button
								variant="outline"
								className="h-9"
								onClick={() => {
									setUseFrontCamera((prev) => !prev)
									// restart with the other facing mode
									setTimeout(startCamera, 0)
								}}
								title="Ganti Kamera"
							>
								<RefreshCcw className="mr-2 h-4 w-4" />
								Ganti Kamera
							</Button>
							<div className="flex items-center gap-2">
								<Button variant="outline" className="h-9" onClick={() => { setCameraOpenFor(null); stopCamera() }}>
									Batal
								</Button>
								<Button variant="destructive" className="h-9" onClick={capturePhoto}>
									Ambil Foto
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter />
				</DialogContent>
			</Dialog>

			{/* ===== Dialog Form Izin ===== */}
			<Dialog open={izinOpen} onOpenChange={(o) => { if (!o) setIzinOpen(false) }}>
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
									// pill with light gray border, solid (no dashed), icon + at left
									className="w-full sm:w-auto h-9 rounded-full border border-border bg-card text-foreground px-4 py-0 inline-flex items-center justify-start"
									onClick={() => izinFileInputRef.current?.click()}
									disabled={isIzinSaved}
								>
									Unggah Lampiran
								</Button>

								<div
									// make it full width on mobile to match the button
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
							onClick={handleSaveIzin}
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
