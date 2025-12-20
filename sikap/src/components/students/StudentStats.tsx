"use client";

import React from "react";
import DashboardLineChart from "@/components/dashboard/DashboardLineChart";

type Point = { period: string; count: number };

export default function StudentStats({
  scores,
  attendanceSeries,
}: {
  scores: Point[];
  attendanceSeries: Point[];
}) {
  const avgScore = Math.round(
    scores.reduce((s, p) => s + p.count, 0) / Math.max(1, scores.length),
  );
  const minScore = Math.min(...scores.map((p) => p.count));
  const maxScore = Math.max(...scores.map((p) => p.count));

  const avgAttendance = Math.round(
    attendanceSeries.reduce((s, a) => s + a.count, 0) /
      Math.max(1, attendanceSeries.length),
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <div className="text-sm font-medium">Perkembangan Skor Siswa</div>
        <div className="text-muted-foreground text-xs">
          Rata-rata {avgScore} • Tertinggi {maxScore} • Terendah {minScore}
        </div>
        <div className="text-muted-foreground mt-1 text-xs italic">
          Nilai penilaian mentor per minggu (skala 0-100)
        </div>
        <div className="mt-4">
          <DashboardLineChart
            data={scores}
            height={150}
            color="var(--chart-1)"
            xAxisLabel="Minggu"
            valueLabel="Skor"
            valueSuffix=" poin"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <div className="text-sm font-medium">Tingkat Kehadiran Siswa</div>
        <div className="text-muted-foreground text-xs">
          Rata-rata {avgAttendance}% kehadiran per minggu
        </div>
        <div className="text-muted-foreground mt-1 text-xs italic">
          Persentase hari hadir dalam 7 minggu terakhir
        </div>
        <div className="mt-4">
          <DashboardLineChart
            data={attendanceSeries}
            height={150}
            color="var(--chart-2)"
            xAxisLabel="Minggu"
            valueLabel="Kehadiran"
            valueSuffix="%"
          />
        </div>
      </div>
    </div>
  );
}
