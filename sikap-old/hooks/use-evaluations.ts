"use client"

import { useState, useCallback } from "react"
import { evaluationStore } from "@/lib/data-store"

export function useEvaluations() {
  const [evaluations] = useState(() => evaluationStore.getAll())

  const getById = useCallback((id: string) => evaluationStore.getById(id), [])
  const getByStudentId = useCallback((studentId: string) => evaluationStore.getByStudentId(studentId), [])
  const getByMentorId = useCallback((mentorId: string) => evaluationStore.getByMentorId(mentorId), [])
  const search = useCallback((query: string) => evaluationStore.search(query), [])

  return {
    evaluations,
    getById,
    getByStudentId,
    getByMentorId,
    search,
  }
}
