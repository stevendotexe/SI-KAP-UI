import React from "react"
// hapus import yang tidak digunakan untuk menghindari lint warnings
import BackButton from "@/components/students/BackButton"
import ReportDetailClient from "@/components/students/ReportDetailClient"

type ReportDetail = {
  week: number
  title: string
  date: string
  mentor: string
  student: string
  reviewed: boolean
  score?: number
  activities: string
  challenges: string
  plans: string
}

const DATA: Record<number, ReportDetail> = {
  1: {
    week: 1,
    title: "Penyiapan Awal & Orientasi",
    date: "2025-06-20",
    mentor: "Ahsan Nur Ilham",
    student: "Rafif Zharif",
    reviewed: true,
    score: 82,
    activities: "Minggu ini saya menyelesaikan proses onboarding, menyiapkan lingkungan pengembangan, dan mengikuti sesi orientasi.",
    challenges: "Awalnya ada beberapa kendala saat menyiapkan lingkungan, tetapi tim TI membantu menyelesaikannya dengan cepat.",
    plans: "Minggu depan saya berencana mulai mengerjakan desain skema basis data.",
  },
  2: {
    week: 2,
    title: "Perancangan & Implementasi Basis Data",
    date: "2025-06-27",
    mentor: "Ahsan Nur Ilham",
    student: "Rafif Zharif",
    reviewed: false,
    activities: "Minggu ini saya merancang skema basis data dan mulai mengimplementasikannya di PostgreSQL.",
    challenges: "Menemukan normalisasi yang tepat pada tabel relasi membutuhkan beberapa kali iterasi.",
    plans: "Minggu depan saya akan mulai membuat API untuk CRUD data utama.",
  },
  3: {
    week: 3,
    title: "Pengembangan API",
    date: "2025-07-04",
    mentor: "Ahsan Nur Ilham",
    student: "Rafif Zharif",
    reviewed: true,
    score: 84,
    activities: "Minggu ini saya membangun endpoint API untuk autentikasi serta data siswa.",
    challenges: "Pengaturan keamanan JWT dan refresh token memerlukan pengujian tambahan.",
    plans: "Minggu depan fokus ke integrasi frontend.",
  },
  4: {
    week: 4,
    title: "Integrasi Frontend",
    date: "2025-07-11",
    mentor: "Ahsan Nur Ilham",
    student: "Rafif Zharif",
    reviewed: false,
    activities: "Minggu ini saya mengintegrasikan komponen UI dengan API dan melakukan perbaikan tampilan.",
    challenges: "Perbedaan versi library menyebabkan beberapa error build yang berhasil diselesaikan.",
    plans: "Minggu depan akan dilakukan pengujian end-to-end.",
  },
}

export default async function Page({ params }: { params: Promise<{ id: string; week: string }> }) {
  const { id, week } = await params
  const w = Number(week)
  const report = DATA[w] ?? DATA[1]
  const STUDENT_NAMES: Record<string, string> = {
    "STD-001": "Alya Putri",
    "STD-002": "Bagus Pratama",
    "STD-003": "Citra Dewi",
    "STD-004": "Dwi Santoso",
    "STD-005": "Eka Ramadhan",
  }
  const displayStudent = STUDENT_NAMES[id] ?? report.student

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="bg-card border rounded-xl shadow-sm p-6">
          <div className="mb-4"><BackButton hrefFallback={`/mentor/laporan`} /></div>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xl font-semibold">{report.title}</div>
              <div className="text-sm text-muted-foreground">Minggu {report.week} • {report.date}</div>
              <div className="mt-4">
                <div className="text-sm">Mentor</div>
                <div className="text-lg font-semibold">{report.mentor}</div>
                <div className="mt-2 inline-flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-(--radius-md) text-xs ${report.reviewed ? "bg-green-100 text-green-800" : "bg-green-100 text-green-800"}`}>{report.reviewed ? "Direview" : "Diserahkan"}</span>
                  <span className="text-xs text-muted-foreground">Diserahkan pada {report.date}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">Siswa</div>
              <div className="text-lg font-semibold">{displayStudent}</div>
              {report.reviewed && report.score != null && (
                <div className="mt-2 text-right"><span className="text-2xl font-semibold">{report.score}</span><span className="text-sm text-muted-foreground">/100</span></div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-secondary rounded-xl p-4 border">
            <div className="text-sm font-medium mb-2">Detail Laporan</div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Aktivitas Minggu Ini</div>
                <div className="text-muted-foreground">{report.activities}</div>
              </div>
              <div>
                <div className="font-medium">Tantangan & Solusi</div>
                <div className="text-muted-foreground">{report.challenges}</div>
              </div>
              <div>
                <div className="font-medium">Rencana Minggu Depan</div>
                <div className="text-muted-foreground">{report.plans}</div>
              </div>
              {/* tombol gambar dipindah ke komponen klien */}
            </div>
          </div>
          {report.reviewed ? (
            <div className="mt-6 bg-secondary rounded-xl p-4 border">
              <div className="text-sm font-medium mb-2">Umpan Balik Mentor</div>
              <div className="text-muted-foreground text-sm">Awal yang bagus! Penyiapan sudah lengkap dan siap memulai pekerjaan pengembangan.</div>
            </div>
          ) : null}

          <ReportDetailClient id={(await params).id} week={report.week} reviewed={report.reviewed} />
        </div>
      </div>
    </main>
  )
}
