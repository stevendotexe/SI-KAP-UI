import React from "react";
import { headers } from "next/headers";

import { createTRPCContext } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";
import type { RouterOutputs } from "@/trpc/react";
import { getSession } from "@/server/better-auth/server";

import StatisticCard from "@/components/dashboard/StatisticCard";
import Sparkline from "@/components/dashboard/Sparkline";
import PieChart from "@/components/dashboard/PieChart";
import AttendanceTable from "@/components/dashboard/AttendanceTable";

type DashboardCounts = RouterOutputs["dashboards"]["getDashboardCounts"];
type SeriesPoint = { period: string; count: number };
type PieItem = RouterOutputs["dashboards"]["getAttendancePieChart"][number];
type AttendanceRow = RouterOutputs["dashboards"]["getAttendanceTable"][number];

export default async function DashboardPage() {
  const session = await getSession();

  // deklarasi dengan tipe eksplisit agar lint/typecheck tidak mengeluh
  let counts: DashboardCounts | null = null;
  let avgScores: SeriesPoint[] = [];
  let avgAttendances: SeriesPoint[] = [];
  let studentGrowth: SeriesPoint[] = [];
  let attendancePie: PieItem[] = [];
  let attendanceTable: AttendanceRow[] = [];

  try {
    // buat context server-side trpc dan caller yang bertipe
    const ctx = await createTRPCContext({ headers: headers() });
    const caller = createCaller(ctx);

    const result = (await Promise.all([
      // panggil prosedur lewat caller (jenis dan argumen ter-tipifikasi)
      caller.dashboards.getDashboardCounts({}),
      caller.dashboards.getAverageStudentScores({ granularity: "month" }),
      caller.dashboards.getAverageStudentAttendances({ granularity: "month" }),
      caller.dashboards.getStudentCountPerPeriod({ granularity: "month" }),
      caller.dashboards.getAttendancePieChart({}),
      caller.dashboards.getAttendanceTable({}),
    ])) as [
      DashboardCounts,
      SeriesPoint[],
      SeriesPoint[],
      SeriesPoint[],
      PieItem[],
      AttendanceRow[]
    ];

    // assign hasil ke variabel lokal yang sudah bertipe
    counts = result[0];
    avgScores = result[1] ?? [];
    avgAttendances = result[2] ?? [];
    studentGrowth = result[3] ?? [];
    attendancePie = result[4] ?? [];
    attendanceTable = result[5] ?? [];
  } catch (err) {
    // kemungkinan error: permission / auth / jaringan
    // Tetap lanjut render halaman dengan nilai default (kosong)
    console.error("Gagal memuat dashboard:", err);
  }

  return (
    <main className="min-h-screen p-4 lg:p-8 bg-muted">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-6">
          <h2 className="text-sm text-muted-foreground">Dashboard Mentor</h2>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">
                Selamat Datang, {session?.user?.name ?? "Mentor"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {session?.user?.id ? `ID: ${session.user.id}` : ""}
              </p>
            </div>
            <div className="hidden sm:flex gap-3">
              <div className="bg-card rounded-md border px-4 py-2 text-sm">
                Terakhir sinkron:{" "}
                <span className="font-medium">
                  {String(counts?.lastUpdated ?? new Date().toISOString()).slice(0, 10)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Grid utama */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Kolom kiri: kartu besar */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatisticCard
              title="Rata - Rata Skor Siswa"
              subtitle="Keseluruhan"
              value={
                avgScores.length
                  ? `${Math.round(avgScores[avgScores.length - 1].count)}`
                  : "-"
              }
            >
              <Sparkline data={avgScores} />
            </StatisticCard>

            <StatisticCard
              title="Rata - Rata Kehadiran Siswa"
              subtitle="Keseluruhan"
              value={
                avgAttendances.length
                  ? `${Math.round(avgAttendances[avgAttendances.length - 1].count)}%`
                  : "-"
              }
            >
              <Sparkline data={avgAttendances} />
            </StatisticCard>

            <StatisticCard
              title="Pertumbuhan Siswa"
              subtitle="Seluruh Periode"
              value={
                studentGrowth.length ? `${studentGrowth[studentGrowth.length - 1].count}` : "-"
              }
            >
              <Sparkline data={studentGrowth} />
            </StatisticCard>

            {/* Ringkasan singkat */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">Jumlah Siswa</div>
                  <div className="text-xl font-semibold">{counts?.students ?? "-"}</div>
                </div>
                <div className="bg-card rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">Total Mentor</div>
                  <div className="text-xl font-semibold">{counts?.mentors ?? "-"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">Laporan Diserahkan</div>
                  <div className="text-xl font-semibold">{counts?.reports ?? "-"}</div>
                </div>
                <div className="bg-card rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">Siswa Lulus</div>
                  <div className="text-xl font-semibold">{counts?.graduates ?? "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom kanan: pie + tabel */}
          <div className="space-y-4">
            <div className="bg-card rounded-md border p-4">
              <h3 className="text-sm font-medium mb-2">Diagram Kehadiran</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-40 h-40 mx-auto">
                  <PieChart data={attendancePie} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Total Kehadiran</div>
                  <div className="text-lg font-semibold mt-2">
                    {attendancePie.reduce((s, it) => s + Number(it.value ?? 0), 0)}
                  </div>
                  <div className="mt-3 space-y-2">
                    {attendancePie.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-sm">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{
                            background:
                              p.name === "present"
                                ? "var(--color-chart-1)"
                                : p.name === "absent"
                                ? "var(--color-chart-5)"
                                : p.name === "excused"
                                ? "var(--color-chart-4)"
                                : "var(--color-chart-2)",
                          }}
                        />
                        <span className="capitalize">{p.name}</span>
                        <span className="ml-auto font-medium">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-md border p-4">
              <h3 className="text-sm font-medium mb-3">Tabel Kehadiran</h3>
              <AttendanceTable rows={attendanceTable} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}