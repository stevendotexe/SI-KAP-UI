"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogIn, LogOut } from "lucide-react"
import { useRef, useState } from "react"
import { api } from "@/trpc/react" // <-- TRPC client

export default function DashboardPage() {
	const masukInputRef = useRef<HTMLInputElement | null>(null)
	const keluarInputRef = useRef<HTMLInputElement | null>(null)
	const [masukImageName, setMasukImageName] = useState("")
	const [keluarImageName, setKeluarImageName] = useState("")

	// ambil data dari DB (koneksi ke router calendarEvents)
	const now = new Date()
	const [companyId] = useState<number>(1) // TODO: sesuaikan dengan companyId aktual
	const { data: events, isLoading, isError } = api.calendarEvents.list.useQuery(
		{ companyId, month: now.getMonth() + 1, year: now.getFullYear() },
		{ retry: 1 }
	)
	const eventsCount = typeof events?.length === "number" ? events.length : null

	return (
		<div className="min-h-screen bg-muted/30 p-0 m-0">
			<div className="w-full max-w-none p-0 m-0">
				<main className="space-y-6 p-0 pr-4 sm:pr-6 lg:pr-10">
					<section className="rounded-2xl bg-card p-6 border">
						<h1 className="text-2xl sm:text-3xl font-semibold">Selamat datang, Siswa!</h1>
						<p className="text-muted-foreground mt-1">ID Siswa: 010101</p>

						{/* mitigasi ketika DB gagal */}
						{isError && (
							<div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm px-3 py-2">
								Gagal memuat data dari database. Menampilkan data bawaan.
							</div>
						)}

						{/* Stats */}
						<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{[
								{
									title: "Ditugaskan",
									value: eventsCount != null ? String(eventsCount) : "2",
									sub: "Minggu ini",
									loading: isLoading,
								},
								{ title: "Menunggu tinjauan", value: "1", sub: "Menunggu respon mentor" },
								{ title: "Laporan Terkirim", value: "3", sub: "Minggu ini" },
								{ title: "Skor Rata-Rata", value: "8.5", sub: "Dari 10" },
							].map((card) => (
								<div key={card.title} className="rounded-2xl border bg-card p-5 shadow-sm">
									<div className="text-sm text-muted-foreground">{card.title}</div>
									<div className="mt-2 text-3xl font-semibold">
										{"loading" in card && card.loading ? "…" : card.value}
									</div>
									<div className="mt-1 text-xs text-muted-foreground">{card.sub}</div>
								</div>
							))}
						</div>

						{/* Absensi */}
						<div className="mt-8">
							<div className="rounded-2xl border bg-card p-6">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
									<div>
										<h2 className="text-lg font-semibold">Form absensi</h2>
										<p className="text-sm text-muted-foreground mt-1">Pilih status kehadiran anda</p>
										<p className="text-xs text-muted-foreground">Pengisian absensi hanya dapat dilakukan antara 07:00:00 hingga 07:59:59</p>
									</div>
									<div className="text-sm mt-4 sm:mt-0">Jumat, 21 November 2025<br /><span className="text-muted-foreground">07:05:10</span></div>
								</div>

								<Separator className="my-6" />

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* Masuk */}
									<div className="rounded-2xl border bg-card p-6">
										<h3 className="text-xl font-semibold">Absen Masuk</h3>
										<p className="text-muted-foreground mt-2">--:--:--</p>
										<input
											ref={masukInputRef}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={(e) => {
												const f = e.target.files?.[0]
												setMasukImageName(f ? f.name : "")
											}}
										/>
										<Button
											variant="destructive"
											className="mt-4 h-9 rounded-full px-5 inline-flex items-center gap-2"
											onClick={() => masukInputRef.current?.click()}
										>
											<LogIn className="w-4 h-4" />
											<span className="text-sm font-medium">Masuk</span>
										</Button>
										{masukImageName && (
											<p className="mt-2 text-xs text-muted-foreground break-all">
												File terpilih: {masukImageName}
											</p>
										)}
									</div>

									{/* Keluar */}
									<div className="rounded-2xl border bg-card p-6">
										<h3 className="text-xl font-semibold">Absen Keluar</h3>
										<p className="text-muted-foreground mt-2">--:--:--</p>
										<input
											ref={keluarInputRef}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={(e) => {
												const f = e.target.files?.[0]
												setKeluarImageName(f ? f.name : "")
											}}
										/>
										<Button
											variant="destructive"
											className="mt-4 h-9 rounded-full px-5 inline-flex items-center gap-2"
											onClick={() => keluarInputRef.current?.click()}
										>
											<LogOut className="w-4 h-4" />
											<span className="text-sm font-medium">Keluar</span>
										</Button>
										{keluarImageName && (
											<p className="mt-2 text-xs text-muted-foreground break-all">
												File terpilih: {keluarImageName}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					</section>
				</main>
			</div>
		</div>
	)
}

