"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type PieItem = { name: string; value: number }

export default function StatusButtons({ pie, table }: { pie: PieItem[]; table: Array<{ studentName?: string; status?: string }> }) {
  const today = new Date().toISOString().slice(0, 10)
  const statusMap: Record<string, string> = { present: "Hadir", absent: "Tidak Hadir", excused: "Izin" }
  const colors: Record<string, string> = { present: "bg-green-100 text-green-800", absent: "bg-red-100 text-red-800", excused: "bg-yellow-100 text-yellow-800" }

  function namesFor(k: string) {
    const key = statusMap[k] ?? k
    return table.filter((r) => String(r.status).toLowerCase().includes(key.toLowerCase())).map((r) => r.studentName ?? "-")
  }

  return (
    <div className="mt-4 space-y-2">
      {pie.filter((p) => p.name !== "late").map((p) => {
        const label = statusMap[p.name] ?? p.name
        const list = namesFor(p.name)
        return (
          <Dialog key={p.name}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className={`justify-between w-full ${colors[p.name]} hover:opacity-90 rounded-(--radius-sm)`}>
                <span>{label}</span>
                <span className="ml-auto font-medium">{p.value}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{`Daftar Siswa ${label} - ${today}`}</DialogTitle>
              </DialogHeader>
              <ul className="list-disc pl-4 text-sm">
                {list.length ? list.map((n, i) => <li key={i}>{n}</li>) : <li>Tidak ada data</li>}
              </ul>
            </DialogContent>
          </Dialog>
        )
      })}
    </div>
  )
}

