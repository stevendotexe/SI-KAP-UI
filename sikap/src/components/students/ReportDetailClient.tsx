"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldGroup, FieldSet, FieldTitle } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

type Props = {
  id: string
  reportId: number
  reviewed: boolean
}

export default function ReportDetailClient({ id, reportId, reviewed }: Props) {
  const [score, setScore] = React.useState<string>("")
  const [desc, setDesc] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const router = useRouter()

  const img = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'>
      <rect x='0' y='0' width='800' height='400' rx='16' fill='white' />
      <text x='24' y='32' font-size='20' fill='black'>Dokumentasi Laporan #${reportId}</text>
      <circle cx='120' cy='280' r='14' fill='rgb(16,185,129)' />
      <circle cx='240' cy='180' r='14' fill='rgb(99,102,241)' />
      <circle cx='360' cy='220' r='14' fill='rgb(245,158,11)' />
      <circle cx='480' cy='140' r='14' fill='rgb(239,68,68)' />
      <rect x='80' y='330' width='640' height='20' fill='rgb(229,231,235)' />
    </svg>`
  )

  const numericScore = Number(score)
  const klasifikasi = !numericScore
    ? ""
    : numericScore >= 90
    ? "Sangat Baik"
    : numericScore >= 80
    ? "Baik"
    : numericScore >= 70
    ? "Cukup"
    : numericScore >= 60
    ? "Kurang"
    : "Buruk"

  function submit() {
    if (!desc.trim()) {
      alert("Deskripsi ulasan wajib diisi")
      return
    }
    if (!score || isNaN(numericScore) || numericScore < 1 || numericScore > 100) {
      alert("Skor harus dipilih dalam rentang 1-100")
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      router.push(`/mentor/siswa/${id}`)
    }, 400)
  }

  return (
    <div>
      <div className="mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" className="rounded-full w-fit">Tampilkan Gambar</Button>
          </DialogTrigger>
          <DialogContent className="rounded-none max-w-3xl">
            <img src={img} alt={`Gambar Laporan #${reportId}`} className="max-w-full h-auto" />
          </DialogContent>
        </Dialog>
      </div>

      {!reviewed && (
        <div className="mt-6 bg-secondary rounded-xl p-4 border">
          <div className="text-sm font-medium mb-3">Tulis Review</div>
          <FieldSet>
            <FieldGroup>
              <Field orientation="vertical" className="sm:col-span-2">
                <FieldTitle>Deskripsi dari Mentor</FieldTitle>
                <FieldContent>
                  <textarea
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm"
                    placeholder="Tuliskan umpan balik, evaluasi, dan catatan untuk siswa"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Skor (1-100)</FieldTitle>
                <FieldContent>
                  <Select value={score} onValueChange={setScore}>
                    <SelectTrigger className="min-w-[240px]">
                      <SelectValue placeholder="Pilih skor" />
                    </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 100 }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                  {klasifikasi && (
                    <div className="text-xs text-muted-foreground mt-2">Klasifikasi: {klasifikasi}</div>
                  )}
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
          <div className="mt-3 flex justify-end">
            <Button variant="destructive" onClick={submit} disabled={submitting} className="inline-flex items-center gap-2">
              {submitting && <Spinner className="size-4" />} Review
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
