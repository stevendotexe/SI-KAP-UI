"use client"

import React from "react"
import { useRouter } from "next/navigation"

export default function BackButton({ hrefFallback, label = "Kembali" }: { hrefFallback?: string; label?: string }) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  return (
    <button
      onClick={() => {
        setPending(true)
        try {
          router.back()
          setTimeout(() => {
            if (hrefFallback) router.push(hrefFallback)
            setPending(false)
          }, 100)
        } catch {
          if (hrefFallback) router.push(hrefFallback)
          setPending(false)
        }
      }}
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-(--radius-md) px-3 py-1.5 text-sm bg-secondary hover:bg-accent transition-colors"
    >
      <span className="inline-block w-0 h-0 border-y-4 border-y-transparent border-r-6 border-r-current" />
      {pending ? "Memuat..." : label}
    </button>
  )
}

