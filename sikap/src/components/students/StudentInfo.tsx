import React from "react"

type Info = {
  email: string
  sekolah: string
  jurusan?: string
  mulai: string
  selesai: string
  mesh: string
  alamat: string
}

export default function StudentInfo({ info }: { info: Info }) {
  return (
    <div className="bg-card border rounded-xl shadow-sm p-6">
      <div className="text-sm font-medium mb-4">Informasi Siswa</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="text-sm">Email</div>
          <div className="text-muted-foreground">{info.email}</div>
          <div className="mt-3 text-sm">Jurusan</div>
          <div className="text-muted-foreground">{info.jurusan ?? "-"}</div>
          <div className="mt-3 text-sm">Tanggal Mulai</div>
          <div className="text-muted-foreground">{info.mulai}</div>
          <div className="mt-3 text-sm">Mesh</div>
          <div className="text-muted-foreground">{info.mesh}</div>
        </div>
        <div>
          <div className="text-sm">Sekolah</div>
          <div className="text-muted-foreground">{info.sekolah}</div>
          <div className="mt-3 text-sm">Tanggal Selesai</div>
          <div className="text-muted-foreground">{info.selesai}</div>
          <div className="mt-3 text-sm">Alamat</div>
          <div className="text-muted-foreground">{info.alamat}</div>
        </div>
      </div>
    </div>
  )
}
