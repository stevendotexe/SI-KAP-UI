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
const mentors = [
  {
    id: 1,
    name: "Ahsan Nur Ilham",
    code: "MEN-001",
    email: "ahsan@gmail.com",
    jumlahSiswa: 7,
    status: "Aktif",
  },
  {
    id: 2,
    name: "Ahsan Nur Ilham",
    code: "MEN-001",
    email: "ahsan@gmail.com",
    jumlahSiswa: 5,
    status: "Aktif",
  },
  {
    id: 3,
    name: "Ahsan Nur Ilham",
    code: "MEN-001",
    email: "ahsan@gmail.com",
    jumlahSiswa: 3,
    status: "Aktif",
  },
  {
    id: 4,
    name: "Ahsan Nur Ilham",
    code: "MEN-001",
    email: "ahsan@gmail.com",
    jumlahSiswa: 8,
    status: "Aktif",
  },
  {
    id: 5,
    name: "Ahsan Nur Ilham",
    code: "MEN-001",
    email: "ahsan@gmail.com",
    jumlahSiswa: 5,
    status: "Aktif",
  },
];

export default function AdminMentorPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = mentors.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Mentor</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar Mentor
            </p>
          </div>
          <Link href="/admin/mentor/tambah">
            <Button className="bg-destructive hover:bg-red-700 text-white rounded-full px-6 cursor-pointer transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Mentor
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

        {/* Filter */}
        <div className="mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] rounded-full bg-background">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Aktif">Aktif</SelectItem>
              <SelectItem value="Nonaktif">Nonaktif</SelectItem>
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
                    Email
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    Jumlah Siswa
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
                {filtered.map((mentor, index) => (
                  <tr
                    key={mentor.id}
                    className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                  >
                    <td className="px-4 py-3 text-sm">{mentor.name}</td>
                    <td className="px-4 py-3 text-sm">{mentor.code}</td>
                    <td className="px-4 py-3 text-sm">{mentor.email}</td>
                    <td className="px-4 py-3 text-sm">{mentor.jumlahSiswa}</td>
                    <td className="px-4 py-3 text-sm">{mentor.status}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/mentor/${mentor.id}`}>
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
