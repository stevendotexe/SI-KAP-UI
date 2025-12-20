"use client";

import * as React from "react";
import { Pie, PieChart as RechartsPieChart, Cell, Label } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Item = { name: string; value: number };

const COLORS: Record<string, string> = {
  present: "var(--chart-1)", // green/teal
  absent: "var(--chart-5)", // red/orange
  excused: "var(--chart-4)", // yellow
  late: "var(--chart-2)", // cyan
};

const LABELS: Record<string, string> = {
  present: "Hadir",
  absent: "Tidak Hadir",
  excused: "Izin",
  late: "Terlambat",
};

const chartConfig = {
  present: {
    label: "Hadir",
    color: "var(--chart-1)",
  },
  absent: {
    label: "Tidak Hadir",
    color: "var(--chart-5)",
  },
  excused: {
    label: "Izin",
    color: "var(--chart-4)",
  },
  late: {
    label: "Terlambat",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function DashboardPieChart({ data }: { data: Item[] }) {
  const total = React.useMemo(
    () => data.reduce((s, d) => s + d.value, 0),
    [data],
  );

  if (!data.length || total === 0) {
    return (
      <div className="text-muted-foreground flex h-64 w-full items-center justify-center text-sm">
        Tidak ada data
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <RechartsPieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          strokeWidth={2}
          stroke="var(--background)"
          label={({ name, value }) =>
            `${name && LABELS[name] ? LABELS[name] : (name ?? "")}: ${value}`
          }
          labelLine={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={COLORS[entry.name] || "var(--chart-3)"}
            />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-2xl font-bold"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 20}
                      className="fill-muted-foreground text-xs"
                    >
                      Total
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
}
