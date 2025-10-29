"use client"

import { useState, useCallback } from "react"
import { mentorStore } from "@/lib/data-store"

export function useMentors() {
  const [mentors] = useState(() => mentorStore.getAll())

  const getById = useCallback((id: string) => mentorStore.getById(id), [])
  const search = useCallback((query: string) => mentorStore.search(query), [])

  return {
    mentors,
    getById,
    search,
  }
}
