"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export type StudentRow = {
  name: string
  code: string
  school: string
  batch: number | string
  status: "Aktif" | "Non-Aktif" | "Lulus" | "Pindah"
}

export default function StudentTable({ rows }: { rows: StudentRow[] }) {
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="px-4 pt-3">
        <div className="h-1 rounded-t-md bg-destructive" />
      </div>
      <div className="px-4 pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-destructive text-white">
                <th className="text-left py-2 px-3">Nama</th>
                <th className="text-left py-2 px-3">Kode</th>
                <th className="text-left py-2 px-3">Asal Sekolah</th>
                <th className="text-left py-2 px-3">Angkatan</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-transparent" : "bg-muted/20"}>
                  <td className="py-2 px-3">{r.name}</td>
                  <td className="py-2 px-3">{r.code}</td>
                  <td className="py-2 px-3">{r.school}</td>
                  <td className="py-2 px-3">{r.batch}</td>
                  <td className="py-2 px-3">{r.status}</td>
                  <td className="py-2 px-3">
                    <Link href={`/mentor/siswa/${r.code}`}> 
                      <Button variant="destructive" size="sm" className="rounded-full px-4">Detail</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

