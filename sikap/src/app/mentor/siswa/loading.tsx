"use client"

import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Memuat daftar siswa...
        </div>
      </div>
    </main>
  )
}

