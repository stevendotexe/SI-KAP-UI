"use client"

import React from "react"

type Props = {
  mode: "laporan" | "informasi"
  onModeChange: (m: "laporan" | "informasi") => void
}

export default function StudentFilterTabs({ mode, onModeChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onModeChange("laporan")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          mode === "laporan"
            ? "bg-red-500 text-white"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        }`}
      >
        Laporan
      </button>
      <button
        onClick={() => onModeChange("informasi")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          mode === "informasi"
            ? "bg-red-500 text-white"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        }`}
      >
        Informasi
      </button>
    </div>
  )
}
