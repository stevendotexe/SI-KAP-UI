"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";

// Dummy data
const students = [
  {
    id: 1,
    name: "Rafif Zharif",
    code: "STD-001",
    school: "SMK 13 Tasikmalaya",
    cohort: "2025",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Rafif Zharif",
    code: "STD-001",
    school: "SMK 13 Tasikmalaya",
    cohort: "2025",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Rafif Zharif",
    code: "STD-001",
    school: "SMK 13 Tasikmalaya",
    cohort: "2025",
    status: "Aktif",
  },
  {
    id: 4,
    name: "Rafif Zharif",
    code: "STD-001",
    school: "SMK 13 Tasikmalaya",
    cohort: "2025",
    status: "Aktif",
  },
  {
    id: 5,
    name: "Rafif Zharif",
    code: "STD-001",
    school: "SMK 13 Tasikmalaya",
    cohort: "2025",
    status: "Aktif",
  },
];

export default function AdminSiswaPage() {
  const [search, setSearch] = useState("");
  const [filterCohort, setFilterCohort] = useState("all");
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchCohort = filterCohort === "all" || s.cohort === filterCohort;
    const matchSchool = filterSchool === "all" || s.school === filterSchool;
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchCohort && matchSchool && matchStatus;
  });

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Siswa</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar Siswa PKL
            </p>
          </div>
          <Link href="/admin/siswa/tambah">
            <Button className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Siswa
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Berdasarkan Nama atau ID"
              className="pl-11 rounded-full bg-background border-border"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={filterCohort} onValueChange={setFilterCohort}>
            <SelectTrigger className="w-[180px] rounded-full bg-background">
              <SelectValue placeholder="Semua Angkatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Angkatan</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSchool} onValueChange={setFilterSchool}>
            <SelectTrigger className="w-[180px] rounded-full bg-background">
              <SelectValue placeholder="Semua Sekolah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Sekolah</SelectItem>
              <SelectItem value="SMK 13 Tasikmalaya">
                SMK 13 Tasikmalaya
              </SelectItem>
              <SelectItem value="SMK Negeri 1">SMK Negeri 1</SelectItem>
              <SelectItem value="SMK Negeri 2">SMK Negeri 2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] rounded-full bg-background">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Aktif">Aktif</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
              <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-destructive text-white">
                <tr>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Nama
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Kode
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Asal Sekolah
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Angkatan
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                  >
                    <td className="px-4 py-3 text-sm">{student.name}</td>
                    <td className="px-4 py-3 text-sm">{student.code}</td>
                    <td className="px-4 py-3 text-sm">{student.school}</td>
                    <td className="px-4 py-3 text-sm">{student.cohort}</td>
                    <td className="px-4 py-3 text-sm">{student.status}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/siswa/${student.id}`}>
                        <Button
                          size="sm"
                          className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors"
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
    </main>
  );
}
