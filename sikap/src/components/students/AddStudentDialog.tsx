"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldGroup, FieldSet, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddStudentDialog() {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    namaLengkap: "",
    nis: "",
    kelas: "",
    jurusan: "",
    tanggalLahir: "",
    alamat: "",
    telepon: "",
    email: "",
    orangTua: "",
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.namaLengkap.trim()) e.namaLengkap = "Wajib diisi"
    if (!/^[0-9]{4,}$/.test(form.nis)) e.nis = "Harus berupa angka minimal 4 digit"
    if (!form.kelas.trim()) e.kelas = "Wajib diisi"
    if (!form.jurusan.trim()) e.jurusan = "Wajib diisi"
    if (!form.tanggalLahir) e.tanggalLahir = "Wajib diisi"
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format email tidak valid"
    if (form.telepon && !/^[0-9+\-() ]{6,}$/.test(form.telepon)) e.telepon = "Format nomor tidak valid"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function submit() {
    if (!validate()) return
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="rounded-full">
          + Tambah Siswa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambahkan Siswa</DialogTitle>
          <DialogDescription>Isi Data Siswa</DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field orientation="vertical">
                <FieldTitle>Nama Lengkap</FieldTitle>
                <FieldContent>
                  <Input
                    placeholder="Nama Lengkap"
                    value={form.namaLengkap}
                    onChange={(e) => update("namaLengkap", e.target.value)}
                    aria-invalid={!!errors.namaLengkap}
                  />
                  {errors.namaLengkap && <span className="text-destructive text-sm">{errors.namaLengkap}</span>}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>NIS</FieldTitle>
                <FieldContent>
                  <Input
                    placeholder="Masukkan NIS"
                    value={form.nis}
                    onChange={(e) => update("nis", e.target.value)}
                    aria-invalid={!!errors.nis}
                  />
                  {errors.nis && <span className="text-destructive text-sm">{errors.nis}</span>}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Kelas</FieldTitle>
                <FieldContent>
                  <Input
                    placeholder="XII RPL 1"
                    value={form.kelas}
                    onChange={(e) => update("kelas", e.target.value)}
                    aria-invalid={!!errors.kelas}
                  />
                  {errors.kelas && <span className="text-destructive text-sm">{errors.kelas}</span>}
                </FieldContent>
              </Field>

            <Field orientation="vertical">
              <FieldTitle>Jurusan</FieldTitle>
              <FieldContent>
                <Select value={form.jurusan} onValueChange={(v) => update("jurusan", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TKJ">TKJ</SelectItem>
                    <SelectItem value="RPL">RPL</SelectItem>
                  </SelectContent>
                </Select>
                {errors.jurusan && <span className="text-destructive text-sm">{errors.jurusan}</span>}
              </FieldContent>
            </Field>

              <Field orientation="vertical">
                <FieldTitle>Tanggal Lahir</FieldTitle>
                <FieldContent>
                  <Input
                    type="date"
                    value={form.tanggalLahir}
                    onChange={(e) => update("tanggalLahir", e.target.value)}
                    aria-invalid={!!errors.tanggalLahir}
                  />
                  {errors.tanggalLahir && <span className="text-destructive text-sm">{errors.tanggalLahir}</span>}
                </FieldContent>
              </Field>

              <Field orientation="vertical" className="sm:col-span-2">
                <FieldTitle>Alamat</FieldTitle>
                <FieldContent>
                  <Input
                    placeholder="Alamat Lengkap"
                    value={form.alamat}
                    onChange={(e) => update("alamat", e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Nomor Telepon</FieldTitle>
                <FieldContent>
                  <Input
                    placeholder="08xxxxxxxxxx"
                    value={form.telepon}
                    onChange={(e) => update("telepon", e.target.value)}
                    aria-invalid={!!errors.telepon}
                  />
                  {errors.telepon && <span className="text-destructive text-sm">{errors.telepon}</span>}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Email</FieldTitle>
                <FieldContent>
                  <Input
                    type="email"
                    placeholder="email@contoh.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <span className="text-destructive text-sm">{errors.email}</span>}
                </FieldContent>
              </Field>

              <Field orientation="vertical" className="sm:col-span-2">
                <FieldTitle>Nama Orang Tua</FieldTitle>
                <FieldContent>
                  <Input
                    placeholder="Nama Orang Tua/Wali"
                    value={form.orangTua}
                    onChange={(e) => update("orangTua", e.target.value)}
                  />
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="destructive" onClick={submit}>Tambahkan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

