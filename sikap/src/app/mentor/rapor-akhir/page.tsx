"use client"

import React from "react"
import { FieldSet, FieldGroup, Field, FieldTitle, FieldContent } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { STUDENTS } from "@/lib/reports-data"
import { RUBRIC_CATEGORIES } from "@/lib/rubrics"
import AttendanceLine from "@/components/students/AttendanceLine"

type ScoreMap = Record<string, number | undefined>

const kategori = RUBRIC_CATEGORIES

export default function Page() {
  const [nama, setNama] = React.useState("")
  const [scores, setScores] = React.useState<ScoreMap>({})
  const [error, setError] = React.useState<string | null>(null)
  const selectedStudent = React.useMemo(() => STUDENTS.find((s) => s.student.toLowerCase() === nama.toLowerCase()) || null, [nama])

  const attendanceSeries = React.useMemo(() => {
    const base = selectedStudent ? (selectedStudent.major === "RPL" ? 85 : 82) : 80
    return [0,1,2,3,4,5].map((i) => ({ period: `M${i+1}`, count: Math.max(60, Math.min(98, Math.round(base + (i-3)*2 + (i%2?3:-2)))) }))
  }, [selectedStudent])
  const scoreSeries = React.useMemo(() => {
    const base = selectedStudent ? (selectedStudent.major === "RPL" ? 78 : 75) : 76
    return [0,1,2,3,4,5].map((i) => ({ period: `M${i+1}`, count: Math.max(60, Math.min(98, Math.round(base + (i-3)*2 + (i%2?2:-1)))) }))
  }, [selectedStudent])
  const attGrowth = React.useMemo(() => {
    const first = attendanceSeries[0]?.count ?? 0
    const last = attendanceSeries[attendanceSeries.length-1]?.count ?? 0
    return first ? Math.round(((last-first)/first)*100) : 0
  }, [attendanceSeries])
  const scoreGrowth = React.useMemo(() => {
    const first = scoreSeries[0]?.count ?? 0
    const last = scoreSeries[scoreSeries.length-1]?.count ?? 0
    return first ? Math.round(((last-first)/first)*100) : 0
  }, [scoreSeries])

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

        {selectedStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
            <div className="lg:col-span-4 bg-card border rounded-(--radius-xl) shadow-sm p-4">
              <div className="text-sm font-medium mb-2">Informasi Siswa</div>
              <div className="space-y-1 text-sm">
                <div><span className="text-muted-foreground">Nama:</span> {selectedStudent.student}</div>
                <div><span className="text-muted-foreground">ID:</span> {selectedStudent.id}</div>
                <div><span className="text-muted-foreground">Sekolah:</span> {selectedStudent.school}</div>
                <div><span className="text-muted-foreground">Jurusan:</span> {selectedStudent.major}</div>
                <div><span className="text-muted-foreground">Status:</span> {selectedStudent.state}</div>
                <div><span className="text-muted-foreground">Angkatan:</span> {selectedStudent.batch}</div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-card border rounded-(--radius-xl) shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Rata Kehadiran</div>
                </div>
                <div className="text-2xl font-semibold">{attendanceSeries.length ? `${attendanceSeries[attendanceSeries.length-1]!.count}%` : "-"}</div>
              </div>
              <div className="mt-2">
                <AttendanceLine data={attendanceSeries} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">Pertumbuhan: {attGrowth}%</div>
            </div>

            <div className="lg:col-span-4 bg-card border rounded-(--radius-xl) shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Rata Skor</div>
                </div>
                <div className="text-2xl font-semibold">{scoreSeries.length ? `${scoreSeries[scoreSeries.length-1]!.count}` : "-"}</div>
              </div>
              <div className="mt-2">
                <AttendanceLine data={scoreSeries} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">Pertumbuhan: {scoreGrowth}%</div>
            </div>
          </div>
        )}

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
