"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type StudentRow = {
  name: string;
  code: string;
  school: string;
  studentId: string;
  batch: number | string;
  status: "Aktif" | "Non-Aktif" | "Lulus" | "Pindah";
};

export default function StudentTable({ rows }: { rows: StudentRow[] }) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="px-4 pt-3">
        <div className="bg-destructive h-1 rounded-t-md" />
      </div>
      <div className="px-4 pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-destructive text-white">
                <th className="px-3 py-2 text-left">Nama</th>
                <th className="px-3 py-2 text-left">Kode</th>
                <th className="px-3 py-2 text-left">Asal Sekolah</th>
                <th className="px-3 py-2 text-left">Angkatan</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={`${i % 2 === 0 ? "bg-transparent" : "bg-muted/20"} hover:bg-muted/50 transition-colors`}
                >
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.code}</td>
                  <td className="px-3 py-2">{r.school}</td>
                  <td className="px-3 py-2">{r.batch}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">
                    <Link href={`/mentor/siswa/${r.studentId}`}>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="hover:bg-destructive/90 cursor-pointer rounded-full px-4 shadow-sm"
                      >
                        Detail
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
