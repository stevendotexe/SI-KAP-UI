import React from "react";

type Row = { name: string; present?: number; absent?: number; excused?: number; late?: number };

export default function AttendanceTable({ rows }: { rows: Row[] }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">Tidak ada data kehadiran.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground text-xs">
            <th className="text-left py-2">Nama Siswa</th>
            <th className="py-2 text-center">Hadir</th>
            <th className="py-2 text-center">Izin</th>
            <th className="py-2 text-center">Tidak Hadir</th>
            <th className="py-2 text-center">Terlambat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"}>
              <td className="py-2">{r.name}</td>
              <td className="py-2 text-center">
                <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                  {r.present ?? 0}
                </span>
              </td>
              <td className="py-2 text-center">
                <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                  {r.excused ?? 0}
                </span>
              </td>
              <td className="py-2 text-center">
                <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                  {r.absent ?? 0}
                </span>
              </td>
              <td className="py-2 text-center">
                <span className="inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {r.late ?? 0}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}