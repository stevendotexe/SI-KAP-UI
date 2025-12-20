"use client";

import React from "react";
import StudentFilterTabs from "@/components/students/StudentFilterTabs";
import StudentStats from "@/components/students/StudentStats";
import StudentReportTable, {
  type Report,
  type StudentTask,
} from "@/components/students/StudentReportTable";
import StudentInfo from "@/components/students/StudentInfo";

type SeriesPoint = { period: string; count: number };
type Info = {
  userId: string;
  name: string;
  email: string;
  sekolah: string;
  jurusan?: string;
  mulai: string;
  selesai: string;
  mesh: string;
  alamat: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  noHp: string;
  nis: string;
  semester: number;
  cohort: string;
};

export default function ClientSection({
  scoreSeries,
  attendanceSeries,
  reports,
  tasks = [],
  info,
}: {
  scoreSeries: SeriesPoint[];
  attendanceSeries: SeriesPoint[];
  reports: Report[];
  tasks?: StudentTask[];
  info: Info;
}) {
  const [mode, setMode] = React.useState<"laporan" | "informasi">("laporan");
  const [reviewed, setReviewed] = React.useState<
    "belum" | "sudah" | "belum_dikerjakan"
  >("sudah");

  return (
    <div className="space-y-6">
      <StudentStats scores={scoreSeries} attendanceSeries={attendanceSeries} />

      <div className="flex justify-start">
        <StudentFilterTabs mode={mode} onModeChange={setMode} />
      </div>

      {mode === "laporan" ? (
        <StudentReportTable
          reports={reports}
          tasks={tasks}
          reviewed={reviewed}
          onReviewedChange={setReviewed}
        />
      ) : (
        <StudentInfo info={info} />
      )}
    </div>
  );
}
