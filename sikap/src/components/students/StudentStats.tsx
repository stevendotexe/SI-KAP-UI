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
  const hasScoreData = scores.length > 0;
  const hasAttendanceData = attendanceSeries.length > 0;

  const avgScore = hasScoreData
    ? Math.round(scores.reduce((s, p) => s + p.count, 0) / scores.length)
    : 0;
  const minScore = hasScoreData ? Math.min(...scores.map((p) => p.count)) : 0;
  const maxScore = hasScoreData ? Math.max(...scores.map((p) => p.count)) : 0;

  const avgAttendance = hasAttendanceData
    ? Math.round(
        attendanceSeries.reduce((s, a) => s + a.count, 0) /
          attendanceSeries.length,
      )
    : 0;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <div className="text-sm font-medium">Perkembangan Skor Siswa</div>
        {hasScoreData ? (
          <div className="text-muted-foreground text-xs">
            Rata-rata {avgScore} • Tertinggi {maxScore} • Terendah {minScore}
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">Belum ada data</div>
        )}
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
        {hasAttendanceData ? (
          <div className="text-muted-foreground text-xs">
            Rata-rata {avgAttendance}% kehadiran per minggu
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">Belum ada data</div>
        )}
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
