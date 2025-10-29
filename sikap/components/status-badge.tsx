import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: "submitted" | "pending" | "draft" | "active" | "inactive" | "success" | "warning" | "error"
  label?: string
}

const statusConfig = {
  submitted: { className: "bg-green-100 text-green-800", label: "Submitted" },
  pending: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
  draft: { className: "bg-gray-100 text-gray-800", label: "Draft" },
  active: { className: "bg-blue-100 text-blue-800", label: "Active" },
  inactive: { className: "bg-gray-100 text-gray-800", label: "Inactive" },
  success: { className: "bg-green-100 text-green-800", label: "Success" },
  warning: { className: "bg-yellow-100 text-yellow-800", label: "Warning" },
  error: { className: "bg-red-100 text-red-800", label: "Error" },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge className={config.className}>{label || config.label}</Badge>
}
