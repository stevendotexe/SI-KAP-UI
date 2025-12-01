"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldGroup, FieldSet, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

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

  function submit() {
    const today = new Date()
    today.setHours(0,0,0,0)
    const d = date ? new Date(date) : null
    if (!titleMain.trim()) { setError("Judul besar wajib diisi"); return }
    if (titleMain.length > 100) { setError("Judul besar maksimal 100 karakter"); return }
    if (titleSub && titleSub.length > 50) { setError("Judul kecil maksimal 50 karakter"); return }
    if (!description.trim()) { setError("Deskripsi tugas wajib diisi"); return }
    if (!d || isNaN(d.getTime())) { setError("Tanggal tenggat wajib dipilih"); return }
    if (d < today) { setError("Tanggal tenggat tidak boleh lampau"); return }
    setError(null)
    onAdd({ id: crypto.randomUUID(), titleMain, titleSub, description, date })
    setOpen(false)
    setTitleMain("")
    setTitleSub("")
    setDescription("")
    setDate("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="rounded-full">+ Tambah Tugas</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Tugas</DialogTitle>
          <DialogDescription>Atur judul besar, judul kecil, deskripsi, dan tanggal tugas.</DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldGroup>
            <Field orientation="vertical">
              <FieldTitle>Judul Besar</FieldTitle>
              <FieldContent>
                <Input value={titleMain} onChange={(e) => setTitleMain(e.target.value)} placeholder="Mis. Implementasi API" aria-invalid={!!error && !titleMain} />
                <div className="text-xs text-muted-foreground mt-1">Maksimal 100 karakter</div>
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldTitle>Judul Kecil</FieldTitle>
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
              <FieldTitle>Tanggal</FieldTitle>
              <FieldContent>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!error && (!date)} />
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        {error && <div className="text-destructive text-sm">{error}</div>}

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="destructive" onClick={submit} disabled={!titleMain || !titleSub || !description || !date}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
