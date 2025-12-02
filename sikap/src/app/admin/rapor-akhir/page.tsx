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
import { Search, Pencil } from "lucide-react";

// Dummy data
const students = [
    {
        id: 1,
        name: "Rafif Zharif",
        code: "STD-001",
        school: "SMK 13 Tasikmalaya",
        cohort: "2024",
        status: "Completed",
        hasReport: true,
        totalScore: 850,
        average: 85,
    },
    {
        id: 2,
        name: "Ahmad Fauzi",
        code: "STD-002",
        school: "SMK 1 Tasikmalaya",
        cohort: "2024",
        status: "Completed",
        hasReport: true,
        totalScore: 920,
        average: 92,
    },
    {
        id: 3,
        name: "Siti Aisyah",
        code: "STD-003",
        school: "SMK 13 Tasikmalaya",
        cohort: "2024",
        status: "Completed",
        hasReport: false,
        totalScore: 0,
        average: 0,
    },
    {
        id: 4,
        name: "Budi Santoso",
        code: "STD-004",
        school: "SMK 2 Tasikmalaya",
        cohort: "2024",
        status: "Active",
        hasReport: false,
        totalScore: 0,
        average: 0,
    },
];

export default function RaporAkhirPage() {
    const [search, setSearch] = useState("");
    const [filterCohort, setFilterCohort] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    const filtered = students.filter((s) => {
        const matchSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.code.toLowerCase().includes(search.toLowerCase());
        const matchCohort = filterCohort === "all" || s.cohort === filterCohort;
        const matchStatus = filterStatus === "all" || s.status === filterStatus;
        return matchSearch && matchCohort && matchStatus;
    });

    return (
        <main className="min-h-screen bg-muted text-foreground">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Rapor Akhir</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Kelola nilai rapor akhir siswa PKL
                    </p>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama atau kode siswa"
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
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px] rounded-full bg-background">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="Completed">Selesai</SelectItem>
                            <SelectItem value="Active">Aktif</SelectItem>
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
                                        Total Nilai
                                    </th>
                                    <th className="text-left text-sm font-medium px-4 py-3">
                                        Rata-rata
                                    </th>
                                    <th className="text-left text-sm font-medium px-4 py-3">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((student, index) => (
                                    <tr
                                        key={student.id}
                                        className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                                    >
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {student.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm">{student.code}</td>
                                        <td className="px-4 py-3 text-sm">{student.school}</td>
                                        <td className="px-4 py-3 text-sm">{student.cohort}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === "Completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-blue-100 text-blue-700"
                                                    }`}
                                            >
                                                {student.status === "Completed" ? "Selesai" : "Aktif"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {student.totalScore}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {student.average}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/rapor-akhir/${student.id}`}>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="hover:bg-muted cursor-pointer"
                                                >
                                                    <Pencil className="w-4 h-4" />
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
