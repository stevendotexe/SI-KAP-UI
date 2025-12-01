"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props = {
  onSearchChange?: (q: string) => void
  onFiltersChange?: (f: { batch?: string; school?: string; status?: string }) => void
}

export default function StudentFilters({ onSearchChange, onFiltersChange }: Props) {
  const [q, setQ] = React.useState("")
  const [batch, setBatch] = React.useState("Semua Angkatan")
  const [school, setSchool] = React.useState("Semua Sekolah")
  const [status, setStatus] = React.useState("Semua Status")

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            onSearchChange?.(e.target.value)
          }}
          placeholder="Cari Berdasarkan Nama atau ID"
          className="h-10 rounded-md"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Select value={batch} onValueChange={(v) => { setBatch(v); onFiltersChange?.({ batch: v, school, status }) }}>
          <SelectTrigger className="min-w-[240px] w-full sm:w-fit">
            <SelectValue placeholder="Semua Angkatan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Angkatan">Semua Angkatan</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>

        <Select value={school} onValueChange={(v) => { setSchool(v); onFiltersChange?.({ batch, school: v, status }) }}>
          <SelectTrigger className="min-w-[240px] w-full sm:w-fit">
            <SelectValue placeholder="Semua Sekolah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Sekolah">Semua Sekolah</SelectItem>
            <SelectItem value="SMK 13 Tasikmalaya">SMK 13 Tasikmalaya</SelectItem>
            <SelectItem value="SMK 2 Bandung">SMK 2 Bandung</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => { setStatus(v); onFiltersChange?.({ batch, school, status: v }) }}>
          <SelectTrigger className="min-w-[240px] w-full sm:w-fit">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Status">Semua Status</SelectItem>
            <SelectItem value="Aktif">Aktif</SelectItem>
            <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
            <SelectItem value="Lulus">Lulus</SelectItem>
            <SelectItem value="Pindah">Pindah</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

