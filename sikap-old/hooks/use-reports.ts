"use client"

import { useState, useCallback } from "react"
import { reportStore } from "@/lib/data-store"

export function useReports() {
  const [reports] = useState(() => reportStore.getAll())

  const getById = useCallback((id: string) => reportStore.getById(id), [])
  const getByStudentId = useCallback((studentId: string) => reportStore.getByStudentId(studentId), [])
  const search = useCallback((query: string) => reportStore.search(query), [])
  const getByStatus = useCallback((status: string) => reportStore.getByStatus(status), [])

  return {
    reports,
    getById,
    getByStudentId,
    search,
    getByStatus,
  }
}
