import React from "react";
//

import { createTRPCContext } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";
import type { RouterOutputs } from "@/trpc/react";
import { getSession } from "@/server/better-auth/server";
import { headers } from "next/headers";

import StatisticCard from "@/components/dashboard/StatisticCard";
import AttendanceLine from "@/components/students/AttendanceLine";
import PieChart from "@/components/dashboard/PieChart";
import AttendanceTable from "@/components/dashboard/AttendanceTable";
import StatusButtons from "@/components/dashboard/StatusButtons";

type DashboardCounts = RouterOutputs["dashboards"]["getDashboardCounts"];
type SeriesPoint = { period: string; count: number };
type PieItem = RouterOutputs["dashboards"]["getAttendancePieChart"][number];
type AttendanceDetailItem = RouterOutputs["attendances"]["detail"]["items"][number];

export default async function DashboardPage() {
  const session = await getSession();

  let counts: DashboardCounts | null = null;
  let avgScores: SeriesPoint[] = [];
  let avgAttendances: SeriesPoint[] = [];
  let studentGrowth: SeriesPoint[] = [];
  let attendancePie: PieItem[] = [];
  let attendanceDetailItems: AttendanceDetailItem[] = [];
  let loadFailed = false;

  try {
    const ctx = await createTRPCContext({ headers: await headers() });
    const caller = createCaller(ctx);

    const results = await Promise.allSettled([
      caller.dashboards.getDashboardCounts({}),
      caller.dashboards.getAverageStudentScores({ granularity: "month" }),
      caller.dashboards.getAverageStudentAttendances({ granularity: "month" }),
      caller.dashboards.getStudentCountPerPeriod({ granularity: "month" }),
      caller.dashboards.getAttendancePieChart({}),
      caller.attendances.detail({ date: new Date() }),
    ]);

    const allRejected = results.every((r) => r.status === "rejected");
    loadFailed = allRejected;

    const get = <T,>(i: number) => (results[i]?.status === "fulfilled" ? (results[i] as PromiseFulfilledResult<T>).value : undefined);

    const r0 = get<DashboardCounts>(0);
    const r1 = get<SeriesPoint[]>(1);
    const r2 = get<SeriesPoint[]>(2);
    const r3 = get<SeriesPoint[]>(3);
    const r4 = get<PieItem[]>(4);
    const r5 = get<{ items: AttendanceDetailItem[] }>(5);

    counts = r0 ?? counts;
    avgScores = r1 ?? [];
    avgAttendances = r2 ?? [];
    studentGrowth = r3 ?? [];
    attendancePie = r4 ?? [];
    attendanceDetailItems = r5?.items ?? [];
  } catch {
    loadFailed = true;
  }

  // --- tambahkan fallback / dummy data jika API tidak mengembalikan apa-apa ---
  // Fallback removed to show real data
  counts ??= {
    students: 0,
    mentors: 0,
    reports: 0,
    graduates: 0,
    lastUpdated: new Date().toISOString(),
  } as DashboardCounts;

  // Fallback removed

  // Fallback removed

  // Fallback removed

  // Fallback removed

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

  const pieData = attendancePie.map((p) => ({
    name: p.name,
    value: Number(p.value ?? 0),
  }));

  const attendanceList = attendanceDetailItems.map((r, i) => ({
    no: i + 1,
    name: r.student.name,
    major: undefined as string | undefined,
    status: (r.status === 'present' ? 'Hadir' : r.status === 'excused' ? 'Izin' : 'Tidak Hadir'),
    date: r.date,
  }));
  return (
    <main className="min-h-screen bg-muted text-foreground">

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold">
                Selamat Datang, {session?.user?.name ?? "Mentor"}!
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {session?.user?.id ? `MEN-${String(session.user.id).padStart(3, "0")}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* tombol Filter & Sinkron dihilangkan sesuai permintaan */}
            </div>
          </div>
        </header>
        {loadFailed && (
          <div className="mb-4 text-sm text-destructive">Gagal memuat data dashboard. Menampilkan data kosong.</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Baris 1: dua kartu metrik */}
          <div className="lg:col-span-6">
            <StatisticCard title="Rata - Rata Skor Siswa" subtitle="Keseluruhan" value={avgScores.length ? `${Math.round(avgScores[avgScores.length - 1]!.count)}` : "-"}>
              <div className="mt-2"><AttendanceLine data={avgScores} /></div>
              <div className="text-xs text-muted-foreground mt-2">Periode hingga hari ini</div>
            </StatisticCard>
          </div>

          <div className="lg:col-span-6">
            <StatisticCard title="Rata - Rata Kehadiran Siswa" subtitle="Keseluruhan" value={avgAttendances.length ? `${Math.round(avgAttendances[avgAttendances.length - 1]!.count)}%` : "-"}>
              <div className="mt-2"><AttendanceLine data={avgAttendances} /></div>
              <div className="text-xs text-muted-foreground mt-2">Periode hingga hari ini</div>
            </StatisticCard>
          </div>

          {/* Baris 2: pertumbuhan kiri, ringkasan kecil kanan */}
          <div className="lg:col-span-6">
            <StatisticCard title="Pertumbuhan Siswa" subtitle="Seluruh Periode" value={studentGrowth.length ? `${growthPercent}%` : "-"}>
              <div className="mt-2"><AttendanceLine data={studentGrowth} height={256} padding={4} /></div>
              {periodRange && (<div className="text-xs text-muted-foreground mt-2">{periodRange}</div>)}
            </StatisticCard>
          </div>
          <div className="lg:col-span-6">
            <div className="bg-card border rounded-(--radius-xl) shadow-sm p-6 h-full">
              <h3 className="text-sm font-medium mb-4">Diagram Kehadiran Siswa Hari ini</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-64 h-64 flex items-center justify-center">
                  <PieChart data={pieData.filter((p) => p.name !== "late")} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Total Kehadiran</div>
                  <div className="text-lg font-semibold mt-2">{pieData.filter((p) => p.name !== "late").reduce((s, it) => s + Number(it.value ?? 0), 0)}</div>
                  <StatusButtons pie={pieData} table={attendanceList.map((r) => ({ studentName: r.name, status: r.status }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Baris 3: ringkasan kecil lebar penuh */}
          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatisticCard title="Jumlah Siswa" subtitle="Siswa Aktif" value={counts?.students ?? "-"} />
              <StatisticCard title="Laporan Diserahkan" subtitle="Bulan ini" value={counts?.reports ?? "-"} />
              <StatisticCard title="Siswa Lulus" subtitle="Seluruh Periode" value={counts?.graduates ?? "-"} />
            </div>
          </div>

          {/* Baris 4: tabel lebar penuh */}
          <div className="lg:col-span-12">
            <div className="bg-card border rounded-(--radius-xl) shadow-sm p-6">
              <h3 className="text-sm font-medium mb-4">Tabel Kehadiran Siswa Hari ini</h3>
              <AttendanceTable rows={attendanceList} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
