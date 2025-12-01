import React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TaskCard({ t }: { t: { id: string; titleMain: string; titleSub?: string; description: string; date: string } }) {
  const daysLeft = (() => {
    const today = new Date()
    today.setHours(0,0,0,0)
    const d = new Date(t.date)
    const diff = Math.floor((d.getTime() - today.getTime()) / (1000*60*60*24))
    return diff
  })()
  const badgeClass = daysLeft > 3 ? "bg-green-100 text-green-800" : daysLeft >= 1 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 flex items-center justify-between">
      <div>
        <div className="text-base font-semibold">{t.titleMain}</div>
        {t.titleSub && <div className="text-sm text-muted-foreground">{t.titleSub}</div>}
        <div className="text-xs text-muted-foreground mt-1">
          <span className={`px-2 py-1 rounded-(--radius-sm) ${badgeClass}`}>Tenggat: {t.date}</span>
        </div>
      </div>
      <Link href={`/mentor/tugas/${t.id}/monitoring`}>
        <Button variant="destructive" size="sm" className="rounded-full">Detail Tugas</Button>
      </Link>
    </div>
  )
}
