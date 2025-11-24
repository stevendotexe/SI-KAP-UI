import type React from "react"

interface CardGridProps {
  children: React.ReactNode
  columns?: number
}

export function CardGrid({ children, columns = 3 }: CardGridProps) {
  const gridClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }[columns] || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

  return <div className={`grid ${gridClass} gap-4`}>{children}</div>
}
