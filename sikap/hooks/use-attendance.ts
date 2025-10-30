"use client"

import { useState, useCallback, useMemo } from "react"
import { attendanceStore, studentStore } from "@/lib/data-store"

export type AttendanceRecord = {
  id: string
  date: string // YYYY-MM-DD
  studentId: string
  status: "present"
}

export function useAttendance() {
  const [records] = useState<AttendanceRecord[]>(() => attendanceStore.getAll() as any)

  const getByDate = useCallback((date: string) => attendanceStore.getByDate(date), [])
  const getByStudentId = useCallback((studentId: string) => attendanceStore.getByStudentId(studentId), [])

  const totalStudents = useMemo(() => studentStore.getAll().length, [])

  return {
    records,
    getByDate,
    getByStudentId,
    totalStudents,
  }
}


