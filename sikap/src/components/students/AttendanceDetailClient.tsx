"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import BackButton from "@/components/students/BackButton"

type Entry = { code: string; name: string; status: "Hadir" | "Tidak Hadir" | "Izin"; checkIn?: string; checkOut?: string; note?: string; proof?: string }

export default function AttendanceDetailClient({ date, initial }: { date: string; initial: Entry[] }) {
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("Semua Status")
  const list = initial
    .filter((e) => (status === "Semua Status" ? true : e.status === status))
    .filter((e) => (q ? (e.name + e.code).toLowerCase().includes(q.toLowerCase()) : true))

  return (
    <div>
      <BackButton hrefFallback="/mentor/kehadiran" />
      <h2 className="text-2xl font-semibold mt-2">Detail Kehadiran</h2>
      <p className="text-sm text-muted-foreground">Senin • {date}</p>

      <div className="mt-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari Berdasarkan Nama atau Kode" className="h-10" />
      </div>

      <div className="mt-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="min-w-[240px] w-full sm:w-fit">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Status">Semua Status</SelectItem>
            <SelectItem value="Hadir">Hadir</SelectItem>
            <SelectItem value="Tidak Hadir">Tidak Hadir</SelectItem>
            <SelectItem value="Izin">Izin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 bg-card border rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-5 gap-2 px-2">
          <div className="text-sm font-medium">Kode</div>
          <div className="text-sm font-medium col-span-2">Nama</div>
          <div className="text-sm font-medium">Presensi</div>
          <div className="text-sm font-medium">Detail</div>
        </div>
        <div className="mt-2 space-y-2">
          {list.map((e, i) => (
            <div key={i} className="grid grid-cols-5 items-center gap-2 px-2 py-2 rounded-md">
              <div className="text-sm">{e.code}</div>
              <div className="text-sm col-span-2">{e.name}</div>
              <div className="text-sm">{e.status}</div>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="rounded-full">Lihat Detail</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-none max-w-3xl">
                    <div className="p-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-sm text-muted-foreground">Check-in</div>
                          <div className="text-sm font-medium">{e.checkIn ?? "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Check-out</div>
                          <div className="text-sm font-medium">{e.checkOut ?? "-"}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Keterangan</div>
                        <div className="text-sm font-medium">{e.note ?? "-"}</div>
                      </div>
                      {e.proof && <img src={e.proof} alt="Bukti Kehadiran" className="max-w-full h-auto" />}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
