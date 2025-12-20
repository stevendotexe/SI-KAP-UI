import React from "react";
export const revalidate = 0;
import StudentDetailHeader from "@/components/students/StudentDetailHeader";
import ClientSection from "@/components/students/ClientSection";
import {
  type Report,
  type StudentTask,
} from "@/components/students/StudentReportTable";
import { createTRPCContext } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";
import Link from "next/link";
import { headers } from "next/headers";

type SeriesPoint = { period: string; count: number };

// Map backend status to UI labels
function mapBackendStatusToUI(status: string | null | undefined): string {
  if (status === "active") return "Aktif";
  if (status === "completed") return "Lulus";
  if (status === "canceled") return "Non-Aktif";
  return "Aktif";
}

// Format date to YYYY-MM-DD
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let studentData: Awaited<
    ReturnType<ReturnType<typeof createCaller>["students"]["detail"]>
  > | null = null;
  let errorMessage: string | null = null;

  try {
    const ctx = await createTRPCContext({ headers: await headers() });
    const caller = createCaller(ctx);
    studentData = await caller.students.detail({ userId: id });
  } catch (err) {
    errorMessage =
      err instanceof Error
        ? err.message
        : "Terjadi kesalahan saat memuat data siswa";
  }

  // Error state
  if (errorMessage || !studentData) {
    return (
      <main className="bg-muted text-foreground min-h-screen">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <div className="bg-card rounded-xl border p-6 text-center shadow-sm">
            <div className="text-destructive mb-2 font-medium">
              Gagal memuat data siswa
            </div>
            <div className="text-muted-foreground mb-4 text-sm">
              {errorMessage ?? "Siswa tidak ditemukan"}
            </div>
            <Link
              href="/mentor/siswa"
              className="bg-destructive hover:bg-destructive/90 inline-block rounded-lg px-4 py-2 text-sm text-white"
            >
              Kembali ke Daftar Siswa
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const {
    profile,
    stats,
    attendance,
    reports: backendReports,
    tasks: backendTasks,
  } = studentData;

  // Map data for components
  const name = profile.name;
  const code = profile.code;
  const status = mapBackendStatusToUI(profile.active ? "active" : "canceled");
  const mentor = profile.mentorName ?? "Belum ditugaskan";
  const totalReports = backendReports.length;
  const avgScore = Math.round(stats.averageScore);

  // Map reports for StudentReportTable
  const reports: Report[] = backendReports.map((r, index) => ({
    id: r.id,
    week: index + 1,
    title: r.title ?? "Laporan",
    description: "",
    date: formatDate(r.submittedAt),
    score: Number(r.score ?? 0),
    reviewed: r.reviewStatus === "approved" || r.reviewStatus === "rejected",
  }));

  const tasks: StudentTask[] = (backendTasks ?? []).map((t) => ({
    id: t.id,
    title: t.title ?? "Tugas",
    date: formatDate(t.dueDate),
    status: t.status as any,
  }));

  // Create score series from reports
  const scoreSeries: SeriesPoint[] =
    backendReports.length > 0
      ? backendReports.map((r, index) => ({
          period: `M${index + 1}`,
          count: Number(r.score ?? 0),
        }))
      : [
          { period: "M1", count: 0 },
          { period: "M2", count: 0 },
          { period: "M3", count: 0 },
          { period: "M4", count: 0 },
        ];

  // Create attendance series from attendance data
  const attendanceSeries: SeriesPoint[] = [
    { period: "M1", count: attendance.percent },
    { period: "M2", count: attendance.percent },
    { period: "M3", count: attendance.percent },
    { period: "M4", count: attendance.percent },
  ];

  // Map info object
  const info = {
    userId: profile.userId,
    name: name,
    email: profile.email,
    sekolah: profile.school ?? "-",
    jurusan: profile.major ?? profile.cohort ?? "-",
    mulai: formatDate(profile.startDate),
    selesai: formatDate(profile.endDate),
    mesh: attendance.percent >= 80 ? "Masuk" : "Kurang",
    alamat: profile.address ?? "-",
    tempatLahir: profile.birthPlace ?? "-",
    tanggalLahir: formatDate(profile.birthDate),
    jenisKelamin: profile.gender ?? "-",
    noHp: profile.phone ?? "-",
    semester: profile.semester ?? 0,
    nis: profile.nis ?? "-",
    cohort: profile.cohort ?? "-",
  };

  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <StudentDetailHeader
          name={name}
          code={code}
          status={status}
          totalReports={totalReports}
          avgScore={avgScore}
          mentor={mentor}
        />

        <ClientSection
          scoreSeries={scoreSeries}
          attendanceSeries={attendanceSeries}
          reports={reports}
          tasks={tasks}
          info={info}
        />
      </div>
    </main>
  );
}
