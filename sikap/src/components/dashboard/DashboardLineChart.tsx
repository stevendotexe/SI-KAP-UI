"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Point = { period: string; count: number };

interface DashboardLineChartProps {
  data: Point[];
  height?: number;
  color?: string;
  xAxisLabel?: string; // Optional label like "Minggu" shown before numbers
  valueLabel?: string; // Label for the value in tooltip (e.g., "Nilai", "Kehadiran")
  valueSuffix?: string; // Suffix for value (e.g., "%", " poin")
}

const BULAN_INDONESIA = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

// Convert period string to Indonesian human-readable format
// For week format, just return index-based label
function formatPeriodLabel(period: string, index: number): string {
  // Handle ISO week format: return just the index + 1
  if (period.includes("-W") || period.includes('"W"')) {
    return String(index + 1);
  }

  // Handle month format: "2025-06" -> "Jun"
  const parts = period.split("-");
  if (parts.length >= 2) {
    const month = parseInt(parts[1]!, 10);
    if (month >= 1 && month <= 12) {
      return BULAN_INDONESIA[month - 1]!;
    }
  }

  return period;
}

export default function DashboardLineChart({
  data,
  height = 120,
  color = "var(--chart-1)",
  xAxisLabel,
  valueLabel = "Nilai",
  valueSuffix = "",
}: DashboardLineChartProps) {
  if (!data.length) {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center text-sm"
        style={{ height }}
      >
        Tidak ada data
      </div>
    );
  }

  // Pre-format data with index-based labels and formatted display value
  const formattedData = data.map((item, index) => ({
    ...item,
    label: formatPeriodLabel(item.period, index),
    displayValue: `${item.count}${valueSuffix}`,
  }));

  // Dynamic chart config based on valueLabel
  const chartConfig = {
    count: {
      label: valueLabel,
      color: color,
    },
  } satisfies ChartConfig;

  return (
    <div>
      {xAxisLabel && (
        <div className="text-muted-foreground mb-1 text-xs">{xAxisLabel}</div>
      )}
      <ChartContainer
        config={chartConfig}
        className="w-full"
        style={{ height }}
      >
        <LineChart
          data={formattedData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 10 }}
          />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(value) =>
                  `${value?.toString() ?? ""}${valueSuffix}`
                }
              />
            }
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5, fill: color }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
