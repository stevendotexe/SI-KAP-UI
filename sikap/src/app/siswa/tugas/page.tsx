"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DaftarTugasSiswaPage() {
  const tasks = [
    {
      id: "t1",
      title: "Buatkan high-fidelity wireframe",
      desc: "Gunakan Figma/Sketch untuk layar utama",
      due: "20 Desember 2025",
    },
    {
      id: "t2",
      title: "Buatkan high-fidelity wireframe",
      desc: "Gunakan Figma/Sketch untuk layar utama",
      due: "20 Desember 2025",
    },
  ]

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 m-0">
        <main className="space-y-6 p-5 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-semibold">Daftar Tugas</h1>
              <p className="text-muted-foreground">
                Tugas yang diberikan Mentor kepada Anda
              </p>
            </div>

            {/* tombol dipindahkan ke detail-tugas */}
          </div>

          {/* Cards */}
          <section className="space-y-6">
            {tasks.map((t) => (
              <article
                key={t.id}
                className="rounded-2xl border bg-card shadow-sm p-5 md:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-muted-foreground">{t.desc}</p>
                    <p className="text-destructive font-semibold">
                      Tenggat waktu : {t.due}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <Button variant="destructive" className="h-9 px-4" asChild>
                      <Link href="/siswa/tugas/detail-tugas">Lihat Detail</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}
