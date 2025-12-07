"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Base = {
  id: number
  title: string
  description?: string | null
  dateLabel: string
  timeLabel?: string
}

type EventItem = Base & {
  kind: "event"
  typeLabel?: string
  organizerName?: string | null
  colorHex?: string | null
  attachments?: Array<{ id: number; url: string; filename?: string | null }>
}

type TaskItem = Base & {
  kind: "task"
  status: "todo" | "in_progress" | "submitted" | "approved" | "rejected"
}

export type ActivityTaskCardProps = {
  item: EventItem | TaskItem
  actions?: React.ReactNode
}

export default function ActivityTaskCard({ item, actions }: ActivityTaskCardProps) {
  const badge = (() => {
    if (item.kind === "event") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
          {item.typeLabel ?? "Event"}
        </span>
      )
    }
    const map: Record<TaskItem["status"], { label: string; cls: string }> = {
      todo: { label: "Belum Dikerjakan", cls: "bg-slate-100 text-slate-700" },
      in_progress: { label: "Dalam Proses", cls: "bg-blue-100 text-blue-700" },
      submitted: { label: "Menunggu Review", cls: "bg-yellow-100 text-yellow-700" },
      approved: { label: "Selesai", cls: "bg-green-100 text-green-700" },
      rejected: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
    }
    const s = map[item.status]
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${s.cls}`}>{s.label}</span>
  })()

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold leading-tight">{item.title}</h3>
          {badge}
        </div>
        {item.kind === "event" && item.colorHex && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: item.colorHex ?? undefined }} />
          </div>
        )}
      </div>

      {item.description && (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block">{item.dateLabel}</span>
        </div>
        {item.timeLabel && (
          <div className="flex items-center gap-2">
            <span className="inline-block">{item.timeLabel}</span>
          </div>
        )}
      </div>

      {item.kind === "event" && item.organizerName && (
        <div className="text-sm">
          <div className="text-muted-foreground">Penyelenggara</div>
          <div className="font-medium">{item.organizerName}</div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {item.kind === "event" && item.attachments && item.attachments.length > 0 && item.attachments[0]?.url && (
            <Link href={item.attachments[0].url} target="_blank">
              <Button variant="outline" size="sm" className="rounded-full">Lihat File</Button>
            </Link>
          )}
          {item.kind === "task" && (
            <Link href={`/mentor/tugas/${item.id}/monitoring`}>
              <Button variant="destructive" size="sm" className="rounded-full">Monitoring</Button>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </div>
  )
}

