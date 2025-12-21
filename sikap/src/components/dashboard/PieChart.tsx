import React from "react";

type Item = { name: string; value: number };

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = ["M", cx, cy, "L", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
  return d;
}

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

const palette = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

export default function PieChart({ data }: { data: Item[] }) {
  const sum = data.reduce((s, d) => s + d.value, 0);
  const total = sum || 1;
  let angle = 0;
  const cx = 50;
  const cy = 50;
  const r = 40;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {data.map((d, i) => {
        const start = angle;
        const sliceAngle = (d.value / total) * 360;
        angle += sliceAngle;
        const end = angle;
        const path = describeArc(cx, cy, r, start, end);
        const color = palette[i % palette.length];
        return <path key={d.name} d={path} fill={color} stroke="transparent" />;
      })}
      <circle cx={cx} cy={cy} r={r - 12} fill="var(--background)" />
      <text x={cx} y={cy} textAnchor="middle" dy="4" className="text-xs font-medium">
        {sum}
      </text>
    </svg>
  );
}