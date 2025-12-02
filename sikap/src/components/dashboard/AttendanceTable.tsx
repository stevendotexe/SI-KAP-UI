"use client"
import React from "react";

type Row = { no: number; name: string; major?: string; status: "Hadir" | "Tidak Hadir" | "Izin"; date: string };

export default function AttendanceTable({ rows }: { rows: Row[] }) {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    return rows.filter((r) => (q ? r.name.toLowerCase().includes(q.toLowerCase()) : true));
  }, [rows, q]);

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const pageRows = filtered.slice(start, start + perPage);

  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">Tidak ada data kehadiran.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          list="attendanceNames"
          className="border rounded-(--radius-sm) px-3 py-2 text-sm w-full sm:w-64"
          placeholder="Cari Nama Siswa"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <datalist id="attendanceNames">
          {rows.map((r, i) => (
            <option key={i} value={r.name} />
          ))}
        </datalist>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="text-left py-2 px-2">No</th>
              <th className="text-left py-2 px-2">Nama Siswa</th>
              <th className="text-left py-2 px-2">Jurusan</th>
              <th className="text-left py-2 px-2">Status Kehadiran</th>
              <th className="text-left py-2 px-2">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"}>
                <td className="py-2 px-2">{r.no}</td>
                <td className="py-2 px-2">{r.name}</td>
                <td className="py-2 px-2">{r.major ?? "-"}</td>
                <td className="py-2 px-2">
                  <span
                    className={`inline-flex items-center justify-center rounded-(--radius-sm) px-2 py-0.5 text-xs ${
                      r.status === "Hadir"
                        ? "bg-green-100 text-green-800"
                        : r.status === "Izin"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-2 px-2">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded-(--radius-sm) border disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </button>
          <button
            className="px-3 py-1 rounded-(--radius-sm) border disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
