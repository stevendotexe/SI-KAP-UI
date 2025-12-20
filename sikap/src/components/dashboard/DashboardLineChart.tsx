"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

type Point = { period: string; count: number };

interface DashboardLineChartProps {
  data: Point[];
  height?: number;
  color?: string;
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

// Convert "YYYY-MM" to Indonesian month abbreviation
function formatPeriodToMonth(period: string): string {
  const parts = period.split("-");
  if (parts.length >= 2) {
    const month = parseInt(parts[1]!, 10);
    if (month >= 1 && month <= 12) {
      return BULAN_INDONESIA[month - 1]!;
    }
  }
  return period;
}

const chartConfig = {
  count: {
    label: "Nilai",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function DashboardLineChart({
  data,
  height = 120,
  color = "var(--chart-1)",
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

  return (
    <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 10 }}
          tickFormatter={formatPeriodToMonth}
        />
        <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator />}
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
  );
}
