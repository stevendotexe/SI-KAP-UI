"use client"

import React from "react"
import { FieldSet, FieldGroup, Field, FieldTitle, FieldContent } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { STUDENTS } from "@/lib/reports-data"

type ScoreMap = Record<string, number | undefined>

const kategori = {
  "Kompetensi Kepribadian": ["Disiplin","Kerja sama","Inisiatif","Kerajinan","Tanggung jawab"],
  "Kompetensi Kejuruan": [
    "Penerapan KSLH",
    "Merakit Komputer",
    "Menginstalasi sistem operasi",
    "Perawatan komputer",
    "Perbaikan peripheral",
    "Menginstal software jaringan",
    "Perbaikan software jaringan",
  ],
} as const

export default function Page() {
  const [nama, setNama] = React.useState("")
  const [scores, setScores] = React.useState<ScoreMap>({})
  const [error, setError] = React.useState<string | null>(null)

  const total = Object.values(scores).reduce((s, v) => s + (v ?? 0), 0)
  const count = Object.values(scores).filter((v) => typeof v === "number").length
  const rata = count ? Math.round(total / count) : 0

  function setScore(key: string, v: string) {
    const n = Number(v)
    setScores((prev) => ({ ...prev, [key]: Number.isInteger(n) && n >= 1 && n <= 100 ? n : undefined }))
  }

  function submit() {
    // Validasi dasar
    if (!nama.trim()) {
      setError("Nama siswa wajib diisi")
      return
    }
    const invalid = Object.entries(scores).some(([_, v]) => !v || v < 1 || v > 100)
    if (invalid) {
      setError("Semua skor harus diisi dan berada pada rentang 1-100")
      return
    }
    setError(null)
    alert("Penilaian rapor akhir berhasil disubmit")
  }

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold">Rapor Akhir</h1>
        <p className="text-sm text-muted-foreground">Input penilaian akhir siswa</p>

        <div className="bg-card border rounded-xl shadow-sm p-4 mt-4">
          <FieldSet>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldTitle>Cari Nama Siswa</FieldTitle>
                <FieldContent>
                  <Input list="studentsList" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Cari nama siswa" />
                  <datalist id="studentsList">
                    {STUDENTS.map((s) => (
                      <option key={s.id} value={s.student} />
                    ))}
                  </datalist>
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-4 mt-6">
          {Object.entries(kategori).map(([kat, list]) => (
            <div key={kat} className="mb-6">
              <div className="text-sm font-medium mb-3">{kat}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((item) => (
                  <div key={item} className="flex items-center justify-between gap-3 p-3 rounded-(--radius-sm) border">
                    <span className="text-sm">{item}</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={100}
                      placeholder="1-100"
                      value={scores[item] ?? ""}
                      onChange={(e) => setScore(item, e.target.value)}
                      className="w-24 text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-(--radius-sm) border p-3">
              <div className="text-sm text-muted-foreground">Total Nilai</div>
              <div className="text-lg font-semibold">{total}</div>
            </div>
            <div className="rounded-(--radius-sm) border p-3">
              <div className="text-sm text-muted-foreground">Rata-rata</div>
              <div className="text-lg font-semibold">{rata}</div>
            </div>
          </div>
          {error && <div className="text-destructive text-sm mt-3">{error}</div>}
          <div className="mt-4 flex justify-end">
            <Button variant="destructive" onClick={submit}>Submit</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
