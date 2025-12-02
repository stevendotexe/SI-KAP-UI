"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldGroup, FieldSet, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RUBRIC_CATEGORIES, RUBRICS_BY_MAJOR } from "@/lib/rubrics"

export type TaskItem = {
  id: string
  titleMain: string
  titleSub: string
  description: string
  date: string
}

export default function AddTaskDialog({ onAdd }: { onAdd: (t: TaskItem) => void }) {
  const [open, setOpen] = React.useState(false)
  const [titleMain, setTitleMain] = React.useState("")
  const [titleSub, setTitleSub] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [date, setDate] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [majors, setMajors] = React.useState<Array<"RPL"|"TKJ"|"Umum">>([])
  const [rubrics, setRubrics] = React.useState<string[]>([])

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    return `${yyyy}-${mm}-${dd}`
  }, [])

  function toggleMajor(m: "RPL"|"TKJ"|"Umum") {
    setMajors((prev) => {
      if (m === "Umum") {
        const next = prev.includes("Umum") ? prev.filter((x) => x !== "Umum") : ["Umum"]
        return next
      }
      if (prev.includes("Umum")) return prev
      return prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    })
  }

  const availableRubrics = React.useMemo(() => {
    if (majors.length === 0) return [] as string[]
    const all: string[] = []
    majors.forEach((m) => {
      if (m === "Umum") return
      const cats = RUBRICS_BY_MAJOR[m]
      Object.values(cats).forEach((list) => list.forEach((i) => { if (!all.includes(i)) all.push(i) }))
    })
    return all
  }, [majors])

  function toggleRubric(r: string) {
    setRubrics((prev) => prev.includes(r) ? prev.filter(x=>x!==r) : [...prev, r])
  }

  function submit() {
    const today = new Date()
    today.setHours(0,0,0,0)
    const d = date ? new Date(date) : null
    if (!titleMain.trim()) { setError("Topik wajib diisi"); return }
    if (titleMain.length > 100) { setError("Judul besar maksimal 100 karakter"); return }
    if (titleSub && titleSub.length > 50) { setError("Judul kecil maksimal 50 karakter"); return }
    if (!description.trim()) { setError("Deskripsi tugas wajib diisi"); return }
    if (majors.length === 0) { setError("Minimal pilih satu jurusan"); return }
    if (availableRubrics.length > 0 && rubrics.length === 0) { setError("Minimal pilih satu rubrik penilaian"); return }
    if (!d || isNaN(d.getTime())) { setError("Tanggal deadline wajib dipilih"); return }
    if (d < today) { setError("Tanggal deadline tidak boleh lebih awal dari hari ini"); return }
    setError(null)
    onAdd({ id: crypto.randomUUID(), titleMain, titleSub, description, date })
    setOpen(false)
    setTitleMain("")
    setTitleSub("")
    setDescription("")
    setDate("")
    setMajors([])
    setRubrics([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="rounded-full">+ Tambah Tugas</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Tugas</DialogTitle>
          <DialogDescription>Atur topik, subtopik, deskripsi, jurusan, rubrik, dan tanggal deadline.</DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldGroup>
            <Field orientation="vertical">
              <FieldTitle>Topik</FieldTitle>
              <FieldContent>
                <Input value={titleMain} onChange={(e) => setTitleMain(e.target.value)} placeholder="Mis. Implementasi API" aria-invalid={!!error && !titleMain} />
                <div className="text-xs text-muted-foreground mt-1">Maksimal 100 karakter</div>
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldTitle>Subtopik</FieldTitle>
              <FieldContent>
                <Input value={titleSub} onChange={(e) => setTitleSub(e.target.value)} placeholder="Mis. Endpoint Auth" aria-invalid={!!error && titleSub.length > 50} />
                <div className="text-xs text-muted-foreground mt-1">Opsional, maksimal 50 karakter</div>
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldTitle>Deskripsi</FieldTitle>
              <FieldContent>
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <button type="button" className="px-2 py-1 rounded-(--radius-sm) border" onClick={() => document.execCommand('bold', false)}>B</button>
                  <button type="button" className="px-2 py-1 rounded-(--radius-sm) border" onClick={() => document.execCommand('italic', false)}><i>I</i></button>
                  <button type="button" className="px-2 py-1 rounded-(--radius-sm) border" onClick={() => document.execCommand('underline', false)}><u>U</u></button>
                </div>
                <div
                  contentEditable
                  role="textbox"
                  aria-multiline
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-24 w-full min-w-0 border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm"
                  onInput={(e) => setDescription((e.target as HTMLElement).innerHTML)}
                />
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Pilih Jurusan</FieldTitle>
              <FieldContent>
                <div className="max-h-[400px] overflow-auto grid grid-cols-2 gap-3">
                  {["RPL","TKJ","Umum"].map((m) => (
                    <label
                      key={m}
                      className={`flex items-center justify-between gap-2 border rounded-(--radius-sm) px-3 py-2 cursor-pointer transition-transform active:scale-[0.98] ${majors.includes(m as any) ? (m === "Umum" ? "ring-1 ring-muted-foreground/40 bg-accent" : "ring-1 ring-primary bg-secondary") : "bg-card"}`}
                    >
                      <span className={`text-sm ${m === "Umum" ? "font-medium text-muted-foreground" : ""}`}>{m}</span>
                      <input
                        type="checkbox"
                        className="size-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={majors.includes("Umum") && m !== "Umum"}
                        checked={majors.includes(m as any)}
                        onChange={() => toggleMajor(m as any)}
                      />
                    </label>
                  ))}
                </div>
              </FieldContent>
            </Field>

            {availableRubrics.length > 0 && (
              <Field orientation="vertical">
                <FieldTitle>Rubrik Penilaian</FieldTitle>
                <FieldContent>
                  <div className="max-h-[500px] overflow-auto grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableRubrics.map((r) => (
                      <label key={r} className={`flex items-center justify-between gap-2 border rounded-(--radius-sm) px-3 py-2 cursor-pointer transition-transform active:scale-[0.98] ${rubrics.includes(r) ? "ring-1 ring-primary bg-secondary" : "bg-card"}`}>
                        <span className="text-sm">{r}</span>
                        <input type="checkbox" className="size-4" checked={rubrics.includes(r)} onChange={() => toggleRubric(r)} />
                      </label>
                    ))}
                  </div>
                </FieldContent>
              </Field>
            )}
            <Field orientation="vertical">
              <FieldTitle>Tanggal Deadline</FieldTitle>
              <FieldContent>
                <Input type="date" min={todayStr} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!error && (!date)} />
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        {error && <div className="text-destructive text-sm">{error}</div>}

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="destructive" onClick={submit} disabled={!titleMain || !description || !date || majors.length === 0 || (availableRubrics.length>0 && rubrics.length===0)}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
