import React from "react";

import { createTRPCContext } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";
import type { RouterOutputs } from "@/trpc/react";
import { headers } from "next/headers";

import StatisticCard from "@/components/dashboard/StatisticCard";
import AttendanceLine from "@/components/students/AttendanceLine";

type DashboardCounts = RouterOutputs["dashboards"]["getDashboardCounts"];
type SeriesPoint = { period: string; count: number };

export default async function AdminDashboardPage() {
  const ctx = await createTRPCContext({ headers: await headers() });
  const caller = createCaller(ctx);

  const [counts, avgScores, avgAttendances, studentGrowth] = (await Promise.all([
    caller.dashboards.getDashboardCounts({}),
    caller.dashboards.getAverageStudentScores({ granularity: "month" }),
    caller.dashboards.getAverageStudentAttendances({ granularity: "month" }),
    caller.dashboards.getStudentCountPerPeriod({ granularity: "month" }),
  ])) as [DashboardCounts, SeriesPoint[], SeriesPoint[], SeriesPoint[]];

  const growthPercent = (() => {
    const first = studentGrowth[0]?.count ?? 0;
    const last = studentGrowth[studentGrowth.length - 1]?.count ?? 0;
    if (!first) return 0;
    return Math.round(((last - first) / first) * 100);
  })();

  const periodRange = (() => {
    const start = studentGrowth[0]?.period ?? "";
    const end = studentGrowth[studentGrowth.length - 1]?.period ?? "";
    return start && end ? `${start} - ${end}` : "";
  })();

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pengelolaan Sistem
          </p>
        </header>

        <div className="space-y-4">
          {/* Baris pertama: Rata-rata Skor & Kehadiran */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatisticCard
              title="Rata - Rata Skor Siswa"
              subtitle="Keseluruhan"
              value={
                avgScores.length
                  ? `${Math.round(avgScores[avgScores.length - 1]!.count)}`
                  : "-"
              }
            >
              <div className="mt-2">
                <AttendanceLine data={avgScores} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {avgScores.length > 0
                  ? `${avgScores[0]?.period} - ${avgScores[avgScores.length - 1]?.period}`
                  : "Periode"}
              </div>
            </StatisticCard>

            <StatisticCard
              title="Rata - Rata Kehadiran Siswa"
              subtitle="Keseluruhan"
              value={
                avgAttendances.length
                  ? `${Math.round(avgAttendances[avgAttendances.length - 1]!.count)}%`
                  : "-"
              }
            >
              <div className="mt-2">
                <AttendanceLine data={avgAttendances} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {avgAttendances.length > 0
                  ? `${avgAttendances[0]?.period} - ${avgAttendances[avgAttendances.length - 1]?.period}`
                  : "Periode"}
              </div>
            </StatisticCard>
          </div>

          {/* Baris kedua: Pertumbuhan Siswa dan 4 kartu kecil dalam grid 2x2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <StatisticCard
                title="Pertumbuhan Siswa"
                subtitle="Periode"
                value={studentGrowth.length ? `${growthPercent}%` : "-"}
              >
                <div className="mt-2">
                  <AttendanceLine data={studentGrowth} />
                </div>
                {periodRange && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {periodRange}
                  </div>
                )}
              </StatisticCard>
            </div>

            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bg-card border rounded-xl shadow-sm p-6">
                <h3 className="text-base font-semibold mb-1">Jumlah Siswa</h3>
                <div className="text-3xl font-bold mb-1">
                  {counts?.students ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground">Siswa Aktif</div>
              </div>

              <div className="bg-card border rounded-xl shadow-sm p-6">
                <h3 className="text-base font-semibold mb-1">Total Mentor</h3>
                <div className="text-3xl font-bold mb-1">
                  {counts?.mentors ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground">Mentor Aktif</div>
              </div>

              <div className="bg-card border rounded-xl shadow-sm p-6">
                <h3 className="text-base font-semibold mb-1">
                  Laporan Diserahkan
                </h3>
                <div className="text-3xl font-bold mb-1">
                  {counts?.reports ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground">Bulan ini</div>
              </div>

              <div className="bg-card border rounded-xl shadow-sm p-6">
                <h3 className="text-base font-semibold mb-1">Siswa Lulus</h3>
                <div className="text-3xl font-bold mb-1">
                  {counts?.graduates ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Periode
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
