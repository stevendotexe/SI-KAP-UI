"use client"

import React from "react"
import { Button } from "@/components/ui/button"

type Props = {
  mode: "laporan" | "informasi"
  onModeChange: (m: "laporan" | "informasi") => void
}

export default function StudentFilterTabs({ mode, onModeChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-xl shadow-sm p-3 inline-flex gap-2">
        <Button
          variant={mode === "laporan" ? "destructive" : "secondary"}
          size="sm"
          className="rounded-(--radius-md)"
          onClick={() => onModeChange("laporan")}
        >
          Laporan
        </Button>
        <Button
          variant={mode === "informasi" ? "destructive" : "secondary"}
          size="sm"
          className="rounded-(--radius-md)"
          onClick={() => onModeChange("informasi")}
        >
          Informasi
        </Button>
      </div>
    </div>
  )
}
