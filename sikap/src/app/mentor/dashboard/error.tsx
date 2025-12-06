"use client"

import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex flex-col items-start gap-2">
          <div className="text-sm text-destructive">Terjadi kesalahan memuat dashboard.</div>
          <div className="text-xs text-muted-foreground">{error.message}</div>
          <Button variant="outline" size="sm" onClick={reset}>Coba Lagi</Button>
        </div>
      </div>
    </main>
  )
}

