"use client"

import { useState, useCallback } from "react"
import { studentStore } from "@/lib/data-store"

export function useStudents() {
  const [students] = useState(() => studentStore.getAll())

  const getById = useCallback((id: string) => studentStore.getById(id), [])
  const getByMentorId = useCallback((mentorId: string) => studentStore.getByMentorId(mentorId), [])
  const search = useCallback((query: string) => studentStore.search(query), [])

  return {
    students,
    getById,
    getByMentorId,
    search,
  }
}
