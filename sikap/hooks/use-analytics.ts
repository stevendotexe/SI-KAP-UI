"use client"

import { useState } from "react"
import { analyticsStore } from "@/lib/data-store"

export function useAnalytics() {
  const [overview] = useState(() => analyticsStore.getOverview())
  const [reportSubmissionData] = useState(() => analyticsStore.getReportSubmissionData())
  const [scoreDistribution] = useState(() => analyticsStore.getScoreDistribution())
  const [departmentStats] = useState(() => analyticsStore.getDepartmentStats())

  return {
    overview,
    reportSubmissionData,
    scoreDistribution,
    departmentStats,
  }
}
