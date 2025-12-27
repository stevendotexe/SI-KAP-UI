"use client";

import React from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import BackButton from "@/components/students/BackButton";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Circle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
} from "lucide-react";
import { Pie, PieChart, Cell, Label, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

// Chart colors for task status
const STATUS_COLORS: Record<string, string> = {
  "Belum Dikerjakan": "hsl(220, 14%, 60%)",
  "Butuh Review": "hsl(45, 93%, 47%)",
  "Sudah Direview": "hsl(142, 71%, 45%)",
};

const chartConfig = {
  "Belum Dikerjakan": {
    label: "Belum Dikerjakan",
    color: STATUS_COLORS["Belum Dikerjakan"],
  },
  "Butuh Review": {
    label: "Butuh Review",
    color: STATUS_COLORS["Butuh Review"],
  },
  "Sudah Direview": {
    label: "Sudah Direview",
    color: STATUS_COLORS["Sudah Direview"],
  },
} satisfies ChartConfig;

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const taskId = Number(id);
  const { data, isLoading, isError, error } = api.tasks.getSubmissions.useQuery(
    { taskId },
  );
  const { data: taskDetail } = api.tasks.detailForMentor.useQuery({ taskId });

  if (isLoading) {
    return (
      <main className="bg-muted text-foreground flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="bg-muted text-foreground min-h-screen p-8">
        <div className="text-destructive">
          Error: {error?.message ?? "Gagal memuat data"}
        </div>
        <BackButton hrefFallback="/mentor/tugas" />
      </main>
    );
  }

  const { task, submissions, stats } = data;

  const pieData = [
    {
      name: "Belum Dikerjakan",
      value: stats.todo + stats.inProgress + stats.rejected,
    },
    { name: "Butuh Review", value: stats.submitted },
    { name: "Sudah Direview", value: stats.approved },
  ].filter((p) => p.value > 0);

  const total = pieData.reduce((acc, p) => acc + p.value, 0);

  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-6 md:py-8">
        <BackButton hrefFallback="/mentor/tugas" />
        <div className="mt-2">
          <h1 className="text-2xl font-semibold">Monitoring: {task.title}</h1>
          <p className="text-muted-foreground text-sm">
            Deadline:{" "}
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString("id-ID", {
                  dateStyle: "long",
                })
              : "-"}
          </p>
        </div>

        {taskDetail?.attachments && taskDetail.attachments.length > 0 && (
          <div className="bg-card mt-4 rounded-xl border p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium">Lampiran Tugas</div>
            <div className="flex flex-wrap gap-2">
              {taskDetail.attachments.map((f) => (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary max-w-[200px] truncate hover:underline"
                >
                  {f.filename ?? "File"}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium">Ringkasan Status</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Siswa</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="bg-border my-2 h-px" />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-slate-500" /> Belum Dikerjakan
                </span>
                <span>{stats.todo + stats.inProgress + stats.rejected}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-yellow-500" /> Butuh Review
                </span>
                <span>{stats.submitted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" /> Sudah
                  Direview
                </span>
                <span>{stats.approved}</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium">Grafik Ringkasan</div>
            <div className="h-48 w-full">
              {pieData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      strokeWidth={2}
                      stroke="var(--background)"
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            STATUS_COLORS[entry.name] ?? "hsl(220, 14%, 50%)"
                          }
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
                                  y={(viewBox.cy ?? 0) + 18}
                                  className="fill-muted-foreground text-xs"
                                >
                                  Siswa
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                  Belum ada data
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card mt-6 overflow-hidden rounded-xl border p-4 shadow-sm">
          <div className="mb-4 text-sm font-medium">Daftar Pengumpulan</div>
          {submissions.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Belum ada pengumpulan tugas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Kode</th>
                    <th className="px-2 py-2 text-left font-medium">
                      Nama Siswa
                    </th>
                    <th className="px-2 py-2 text-left font-medium">Status</th>
                    <th className="px-2 py-2 text-left font-medium">
                      Waktu Submit
                    </th>
                    <th className="px-2 py-2 text-left font-medium">File</th>
                    <th className="px-2 py-2 text-left font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-muted/50 border-b last:border-0"
                    >
                      <td className="px-2 py-2">{sub.studentCode}</td>
                      <td className="px-2 py-2">{sub.studentName}</td>
                      <td className="px-2 py-2">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-2 py-2">
                        {sub.submittedAt
                          ? new Date(sub.submittedAt).toLocaleString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-2 py-2">
                        {sub.files.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {sub.files.map((f) => (
                              <a
                                key={f.id}
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary block max-w-[150px] truncate hover:underline"
                              >
                                {f.filename ?? "File"}
                              </a>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {(sub.status === "submitted" ||
                          sub.status === "approved") && (
                          <Link
                            href={`/mentor/tugas/${taskId}/review/${sub.id}`}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                            >
                              <Eye className="h-3 w-3" />
                              {sub.status === "submitted" ? "Review" : "Lihat"}
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    todo: {
      label: "Belum Dikerjakan",
      cls: "bg-slate-100 text-slate-700 border-slate-200",
      icon: <Circle className="h-3 w-3" />,
    },
    in_progress: {
      label: "Sedang Dikerjakan",
      cls: "bg-blue-100 text-blue-700 border-blue-200",
      icon: <Clock className="h-3 w-3" />,
    },
    submitted: {
      label: "Butuh Review",
      cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <Clock className="h-3 w-3" />,
    },
    approved: {
      label: "Sudah Direview",
      cls: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    rejected: {
      label: "Perlu Perbaikan",
      cls: "bg-red-100 text-red-700 border-red-200",
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100", icon: null };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${s.cls}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}
