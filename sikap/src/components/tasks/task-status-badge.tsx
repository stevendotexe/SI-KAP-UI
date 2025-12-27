import * as React from "react"

export type TaskStatusType = "todo" | "in_progress" | "submitted" | "approved" | "rejected"

export interface TaskStatusBadgeConfig {
  bg: string
  text: string
  label: string
}

/**
 * Returns the badge configuration for a given task status.
 * Use this to get consistent styling across all task views.
 */
export function getTaskStatusBadgeConfig(status: string): TaskStatusBadgeConfig {
  switch (status) {
    case "todo":
      return {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Belum Dikerjakan",
      }
    case "in_progress":
      return {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Sedang Dikerjakan",
      }
    case "submitted":
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Menunggu Review",
      }
    case "approved":
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Disetujui",
      }
    case "rejected":
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Ditolak",
      }
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: status,
      }
  }
}

interface TaskStatusBadgeProps {
  status: string
  className?: string
}

/**
 * A reusable badge component for displaying task status.
 * Can be used directly when you want a consistent badge across the app.
 */
export function TaskStatusBadge({ status, className = "" }: TaskStatusBadgeProps) {
  const config = getTaskStatusBadgeConfig(status)
  
  return (
    <span
      className={`inline-flex items-center rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-medium ${className}`}
    >
      {config.label}
    </span>
  )
}






