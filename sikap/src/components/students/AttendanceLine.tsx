"use client"

import React from "react"

type Point = { period: string; count: number }

function normalize(points: Point[], width: number, height: number, padding = 8) {
  if (!points.length) return { path: "", area: "", coords: [] as { x: number; y: number }[] }
  const values = points.map((p) => p.count)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = (width - padding * 2) / Math.max(1, points.length - 1)
  const coords = points.map((p, i) => {
    const x = padding + i * step
    const y = height - padding - ((p.count - min) / range) * (height - padding * 2)
    return { x, y }
  })
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" ")
  const area = `${coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" ")}`
  return { path, area, coords }
}

export default function AttendanceLine({ data, height = 120, padding = 8 }: { data: Point[]; height?: number; padding?: number }) {
  const w = 320
  const h = height
  const { path, coords } = normalize(data, w, h, padding)
  const [hover, setHover] = React.useState<{ i: number; x: number; y: number } | null>(null)

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    if (!coords.length) return
    let nearest = 0
    let best = Infinity
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - mx)
      if (d < best) {
        best = d
        nearest = i
      }
    })
    setHover({ i: nearest, x: coords[nearest]!.x, y: coords[nearest]!.y })
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full text-primary" style={{ height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      {/* axes */}
      <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} stroke="var(--border)" strokeWidth={1} />
      <line x1={padding} y1={padding} x2={padding} y2={h - padding} stroke="var(--border)" strokeWidth={1} />
      {/* line */}
      {path && (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* points */}
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={2.5} fill="currentColor" />
      ))}
      {/* tooltip */}
      {hover && (
        <g transform={`translate(${hover.x}, ${hover.y - 12})`}>
          <rect x={6} y={-16} rx={6} ry={6} width={80} height={22} fill="var(--popover)" stroke="var(--border)" />
          <text x={16} y={-2} className="text-[10px]" fill="var(--foreground)">
            {data[hover.i]!.period}: {data[hover.i]!.count}
          </text>
        </g>
      )}
    </svg>
  )
}

