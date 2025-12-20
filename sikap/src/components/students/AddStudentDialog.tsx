"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function AddStudentDialog() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    namaLengkap: "",
    nis: "",
    kelas: "",
    jurusan: "",
    tanggalLahir: "",
    tempatLahir: "",
    jenisKelamin: "",
    semester: "",
    asalSekolah: "",
    alamat: "",
    telepon: "",
    email: "",
    password: "",
    tanggalMulai: "",
    tanggalSelesai: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.namaLengkap.trim()) e.namaLengkap = "Wajib diisi";
    if (!/^[0-9]{4,}$/.test(form.nis))
      e.nis = "Harus berupa angka minimal 4 digit";
    if (!form.kelas.trim()) e.kelas = "Wajib diisi";
    if (!form.jurusan.trim()) e.jurusan = "Wajib diisi";
    if (!form.tanggalLahir) e.tanggalLahir = "Wajib diisi";
    if (!form.tempatLahir.trim()) e.tempatLahir = "Wajib diisi";
    if (!form.asalSekolah.trim()) e.asalSekolah = "Wajib diisi";
    if (!form.semester.trim()) e.semester = "Wajib diisi";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Format email tidak valid";
    if (form.telepon && !/^[0-9+\-() ]{6,}$/.test(form.telepon))
      e.telepon = "Format nomor tidak valid";
    if (!form.password || form.password.length < 8)
      e.password = "Minimal 8 karakter";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const utils = api.useUtils();
  const createStudent = api.students.create.useMutation({
    onSuccess: () => {
      toast.success("Siswa berhasil ditambahkan");
      setOpen(false);
      void utils.students.list.invalidate();
      setForm({
        namaLengkap: "",
        nis: "",
        kelas: "",
        jurusan: "",
        tanggalLahir: "",
        tempatLahir: "",
        jenisKelamin: "",
        semester: "",
        asalSekolah: "",
        alamat: "",
        telepon: "",
        email: "",
        password: "",
        tanggalMulai: "",
        tanggalSelesai: "",
      });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function submit() {
    if (!validate()) return;
    createStudent.mutate({
      name: form.namaLengkap,
      email: form.email,
      password: form.password,
      nis: form.nis,
      school: form.asalSekolah,
      major: form.jurusan,
      cohort: form.kelas,
      phone: form.telepon,
      address: form.alamat,
      birthDate: new Date(form.tanggalLahir),
      birthPlace: form.tempatLahir,
      gender: form.jenisKelamin || null,
      semester: Number(form.semester),
      startDate: form.tanggalMulai ? new Date(form.tanggalMulai) : null,
      endDate: form.tanggalSelesai ? new Date(form.tanggalSelesai) : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="rounded-full">
          + Tambah Siswa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambahkan Siswa</DialogTitle>
          <DialogDescription>Isi Data Siswa</DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field orientation="vertical">
                <FieldTitle>Nama Lengkap</FieldTitle>
                <FieldContent>
                  <Input
                    placeholder="Nama Lengkap"
                    value={form.namaLengkap}
                    onChange={(e) => update("namaLengkap", e.target.value)}
                    aria-invalid={!!errors.namaLengkap}
                  />
                  {errors.namaLengkap && (
                    <span className="text-destructive text-sm">
                      {errors.namaLengkap}
                    </span>
                  )}
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
                  {errors.nis && (
                    <span className="text-destructive text-sm">
                      {errors.nis}
                    </span>
                  )}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Tahun</FieldTitle>
                <FieldContent>
                  <Input
                    value={form.kelas}
                    onChange={(e) => update("kelas", e.target.value)}
                    aria-invalid={!!errors.kelas}
                  />
                  {errors.kelas && (
                    <span className="text-destructive text-sm">
                      {errors.kelas}
                    </span>
                  )}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Jurusan</FieldTitle>
                <FieldContent>
                  <Select
                    value={form.jurusan}
                    onValueChange={(v) => update("jurusan", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jurusan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TKJ">TKJ</SelectItem>
                      <SelectItem value="RPL">RPL</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.jurusan && (
                    <span className="text-destructive text-sm">
                      {errors.jurusan}
                    </span>
                  )}
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
                  {errors.tanggalLahir && (
                    <span className="text-destructive text-sm">
                      {errors.tanggalLahir}
                    </span>
                  )}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Tempat Lahir</FieldTitle>
                <FieldContent>
                  <Input
                    placeholder="Kota Kelahiran"
                    value={form.tempatLahir}
                    onChange={(e) => update("tempatLahir", e.target.value)}
                    aria-invalid={!!errors.tempatLahir}
                  />
                  {errors.tempatLahir && (
                    <span className="text-destructive text-sm">
                      {errors.tempatLahir}
                    </span>
                  )}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Jenis Kelamin</FieldTitle>
                <FieldContent>
                  <Select
                    value={form.jenisKelamin}
                    onValueChange={(v) => update("jenisKelamin", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Semester</FieldTitle>
                <FieldContent>
                  <Input
                    type="number"
                    placeholder="6"
                    value={form.semester}
                    onChange={(e) => update("semester", e.target.value)}
                    aria-invalid={!!errors.semester}
                  />
                  {errors.semester && (
                    <span className="text-destructive text-sm">
                      {errors.semester}
                    </span>
                  )}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Tanggal Mulai</FieldTitle>
                <FieldContent>
                  <Input
                    type="date"
                    value={form.tanggalMulai}
                    onChange={(e) => update("tanggalMulai", e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Tanggal Selesai</FieldTitle>
                <FieldContent>
                  <Input
                    type="date"
                    value={form.tanggalSelesai}
                    onChange={(e) => update("tanggalSelesai", e.target.value)}
                  />
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
                <FieldTitle>Asal Sekolah</FieldTitle>
                <FieldContent>
                  <Input
                    placeholder="SMK 1 Tasikmalaya"
                    value={form.asalSekolah}
                    onChange={(e) => update("asalSekolah", e.target.value)}
                    aria-invalid={!!errors.asalSekolah}
                  />
                  {errors.asalSekolah && (
                    <span className="text-destructive text-sm">
                      {errors.asalSekolah}
                    </span>
                  )}
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
                  {errors.telepon && (
                    <span className="text-destructive text-sm">
                      {errors.telepon}
                    </span>
                  )}
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
                  {errors.email && (
                    <span className="text-destructive text-sm">
                      {errors.email}
                    </span>
                  )}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldTitle>Password</FieldTitle>
                <FieldContent>
                  <Input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <span className="text-destructive text-sm">
                      {errors.password}
                    </span>
                  )}
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={createStudent.isPending}
          >
            {createStudent.isPending ? "Menyimpan..." : "Tambahkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
