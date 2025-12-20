"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

type Info = {
  userId: string;
  name: string;
  email: string;
  sekolah: string;
  jurusan?: string;
  mulai: string;
  selesai: string;
  mesh: string;
  alamat: string;
  nis: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  noHp: string;
  semester: number;
  cohort: string;
};

export default function StudentInfo({ info }: { info: Info }) {
  const getInitialState = (i: Info) => ({
    name: i.name,
    nis: i.nis,
    birthPlace: i.tempatLahir,
    birthDate: i.tanggalLahir,
    gender: i.jenisKelamin,
    semester: i.semester,
    school: i.sekolah === "-" ? "" : i.sekolah,
    cohort: i.cohort,
    address: i.alamat === "-" ? "" : i.alamat,
    phone: i.noHp,
    email: i.email,
    major:
      (i.jurusan ?? "").toUpperCase() === "RPL" ||
      (i.jurusan ?? "").toUpperCase() === "TKJ"
        ? i.jurusan!
        : "",
    startDate: i.mulai || "",
    endDate: i.selesai || "",
  });

  const [form, setForm] = useState(getInitialState(info));
  const [error, setError] = useState<string>("");
  const utils = api.useUtils();
  const updateMutation = api.students.update.useMutation({
    onSuccess: () => {
      void utils.students.detail.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    if (!form.name.trim()) {
      setError("Nama wajib diisi");
      return false;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Email tidak valid");
      return false;
    }
    if (form.phone && !/^[0-9+\-() ]{6,}$/.test(form.phone)) {
      setError("Nomor telepon tidak valid");
      return false;
    }
    setError("");
    return true;
  }

  function save() {
    if (!validate()) return;
    updateMutation.mutate({
      userId: info.userId,
      name: form.name,
      email: form.email,
      school: form.school || null,
      cohort: form.cohort || null,
      phone: form.phone || null,
      address: form.address || null,
      nis: form.nis || null,
      birthPlace: form.birthPlace || null,
      birthDate: form.birthDate ? new Date(form.birthDate) : null,
      gender: form.gender || null,
      semester: form.semester ? Number(form.semester) : null,
      major: form.major || null,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
    });
  }

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold">Informasi Siswa</h2>
      {error && <p className="text-destructive mb-3 text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-sm font-semibold">Nama</div>
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">NIS</div>
          <Input
            value={form.nis}
            onChange={(e) => update("nis", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Tempat Lahir</div>
          <Input
            value={form.birthPlace}
            onChange={(e) => update("birthPlace", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Tanggal Lahir</div>
          <Input
            type="date"
            value={form.birthDate}
            onChange={(e) => update("birthDate", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Jenis Kelamin</div>
          <Select
            value={form.gender}
            onValueChange={(v) => update("gender", v)}
          >
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="laki-laki">Laki-laki</SelectItem>
              <SelectItem value="perempuan">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Semester</div>
          <Input
            type="number"
            value={form.semester}
            onChange={(e) => update("semester", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Sekolah</div>
          <Input
            value={form.school}
            onChange={(e) => update("school", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Tahun</div>
          <Input
            value={form.cohort}
            onChange={(e) => update("cohort", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Kompetensi Keahlian</div>
          <Select value={form.major} onValueChange={(v) => update("major", v)}>
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Pilih Kompetensi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RPL">
                Rekayasa Perangkat Lunak (RPL)
              </SelectItem>
              <SelectItem value="TKJ">
                Teknik Komputer dan Jaringan (TKJ)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Tanggal Mulai</div>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Tanggal Selesai</div>
          <Input
            type="date"
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1 text-sm font-semibold">Alamat</div>
          <Input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">No Telp</div>
          <Input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Email</div>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant="destructive"
          onClick={save}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setForm(getInitialState(info))}
        >
          Bersihkan
        </Button>
      </div>
    </div>
  );
}
