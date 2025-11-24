"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import type React from "react"

interface ActionButtonsProps {
  primaryAction?: {
    label: string
    onClick?: () => void
    href?: string
    loading?: boolean
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  children?: React.ReactNode
}

export function ActionButtons({ primaryAction, secondaryAction, children }: ActionButtonsProps) {
  return (
    <div className="flex gap-3 pt-4">
      {primaryAction && primaryAction.href ? (
        <Link href={primaryAction.href}>
          <Button disabled={primaryAction.loading}>{primaryAction.loading ? "Loading..." : primaryAction.label}</Button>
        </Link>
      ) : (
        <Button onClick={primaryAction?.onClick} disabled={primaryAction?.loading}>
          {primaryAction?.loading ? "Loading..." : primaryAction?.label}
        </Button>
      )}

      {secondaryAction && secondaryAction.href ? (
        <Link href={secondaryAction.href}>
          <Button variant="outline">{secondaryAction.label}</Button>
        </Link>
      ) : (
        <Button variant="outline" onClick={secondaryAction?.onClick}>
          {secondaryAction?.label}
        </Button>
      )}

      {children}
    </div>
  )
}
