import React from "react";

type Point = { period: string; count: number };

function normalize(points: Point[], width: number, height: number) {
  if (!points.length) return { path: "", area: "" };
  const values = points.map((p) => p.count);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p.count - min) / range) * height;
    return { x, y };
  });
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" ");
  const area = `${coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" ")} L ${width} ${height} L 0 ${height} Z`;
  return { path, area };
}

export default function Sparkline({ data }: { data: Point[] }) {
  const w = 240;
  const h = 60;
  const { path, area } = normalize(data, w, h);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill="url(#g)" />}
      {path && (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        />
      )}
    </svg>
  );
}