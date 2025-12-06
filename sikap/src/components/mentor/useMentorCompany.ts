"use client"

import { api } from "@/trpc/react"

export function useMentorCompany() {
  const { data, isLoading, isError, refetch } = api.mentors.me.useQuery()
  const companyId = data?.companyId ?? null
  return { companyId, isLoading, isError, refetch, mentor: data }
}

