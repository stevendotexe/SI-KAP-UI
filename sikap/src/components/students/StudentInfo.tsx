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
      <h2 className="text-lg font-semibold mb-6">Informasi Siswa</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold mb-1">Email</div>
            <div className="text-sm text-gray-700">{info.email}</div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-1">Tanggal Mulai</div>
            <div className="text-sm text-gray-700">{info.mulai}</div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-1">Mesh</div>
            <div className="text-sm text-gray-700">{info.mesh}</div>
          </div>
        </div>
        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold mb-1">Sekolah</div>
            <div className="text-sm text-gray-700">{info.sekolah}</div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-1">Tanggal Selesai</div>
            <div className="text-sm text-gray-700">{info.selesai}</div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-1">Alamat</div>
            <div className="text-sm text-gray-700">{info.alamat}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
