"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th key={String(column.key)} className="text-left py-3 px-4 font-medium">
                    {column.label}
                  </th>
                ))}
                {actions && <th className="text-left py-3 px-4 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td key={String(column.key)} className="py-3 px-4">
                        {column.render ? column.render(item[column.key], item) : String(item[column.key])}
                      </td>
                    ))}
                    {actions && <td className="py-3 px-4">{actions(item)}</td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
