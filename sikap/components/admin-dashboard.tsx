"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BarChart3 } from "lucide-react"
import Link from "next/link"

export function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview Sistem & Pengelolaan</p>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rata-rata Rating Siswa (Harian)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="text-2xl font-bold">8.2</div>
                <p className="text-xs text-muted-foreground">dari 5 rata-rata minggu ini</p>
              </div>
              <div className="text-xs text-muted-foreground">Sen-Min</div>
            </div>
            <MiniLineChart
              id="rating-chart"
              values={[3.2, 3.8, 3.6, 4.1, 3.9, 4.2, 4.0]}
              min={0}
              max={5}
              strokeClassName="text-primary"
              showDots
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Kehadiran rata-rata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="text-2xl font-bold">91%</div>
                <p className="text-xs text-muted-foreground">kehadiran rata-rata mingguan</p>
              </div>
              <div className="text-xs text-muted-foreground">Sen-Min</div>
            </div>
            <MiniLineChart
              id="attendance-chart"
              values={[86, 90, 88, 92, 94, 91, 93]}
              min={0}
              max={100}
              strokeClassName="text-primary"
              showDots
            />
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Jumlah Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">siswa aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">mentor aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Laporan Diserahkan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">487</div>
            <p className="text-xs text-muted-foreground">bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manajemen User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/students">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                Manajemen Siswa
              </Button>
            </Link>
            <Link href="/mentors">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                Manajemen Mentor
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Laporan & Analitika
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/reports">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                Lihat Semua Laporan
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                Lihat Analitika
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type MiniLineChartProps = {
  values: number[]
  min: number
  max: number
  id: string
  height?: number
  strokeClassName?: string
  showDots?: boolean
}

function MiniLineChart({
  values,
  min,
  max,
  id,
  height = 140,
  strokeClassName = "text-primary",
  showDots = false,
}: MiniLineChartProps) {
  const width = 100
  const viewHeight = 40
  const margin = 4
  const availableHeight = viewHeight - margin * 2

  const toY = (value: number) => {
    const clamped = Math.min(Math.max(value, min), max)
    const normalized = (clamped - min) / Math.max(max - min, 1)
    return viewHeight - margin - normalized * availableHeight
  }

  const stepX = values.length > 1 ? width / (values.length - 1) : width
  const points = values
    .map((v, i) => `${(i * stepX).toFixed(2)},${toY(v).toFixed(2)}`)
    .join(" ")

  // Build area polygon for a subtle fill under the line
  const areaPoints = `${points} ${width.toFixed(2)},${(viewHeight - margin).toFixed(2)} 0,${(viewHeight - margin).toFixed(2)}`

  return (
    <svg viewBox={`0 0 ${width} ${viewHeight}`} className="w-full" style={{ height }} aria-labelledby={`${id}-title`}>
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Baseline */}
      <g className="text-muted-foreground/30">
        <line x1="0" y1={viewHeight - margin} x2={width} y2={viewHeight - margin} stroke="currentColor" strokeWidth="0.5" />
      </g>

      {/* Area fill */}
      <g className={strokeClassName}>
        <polygon points={areaPoints} fill={`url(#${id}-grad)`} />
      </g>

      {/* Line */}
      <g className={strokeClassName}>
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </g>

      {/* Dots */}
      {showDots && (
        <g className={strokeClassName}>
          {values.map((v, i) => (
            <circle key={`${id}-dot-${i}`} cx={(i * stepX).toFixed(2)} cy={toY(v).toFixed(2)} r="1.5" fill="currentColor" />
          ))}
        </g>
      )}
    </svg>
  )
}
