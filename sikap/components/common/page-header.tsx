"use client"

import { Button } from "@/components/ui/button"
import type React from "react"

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  children?: React.ReactNode
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-2">{description}</p>}
      </div>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
      {children}
    </div>
  )
}
