"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/trpc/react";

type AttendanceSummaryCardProps = {
    /** Link destination for the "Lihat Detail" button */
    detailHref: string;
    /** Role to determine which attendance list to show */
    role: "admin" | "mentor";
};

/**
 * Attendance summary card showing today's attendance summary.
 * Matches the design from the kehadiran page.
 */
export default function AttendanceSummaryCard({ detailHref, role }: AttendanceSummaryCardProps) {
    const { data, isLoading, isError } = api.attendances.list.useQuery({
        limit: 1,
        offset: 0,
    });

    const summary = data?.summary ?? {
        date: new Date().toISOString().slice(0, 10),
        presentCount: 0,
        absentCount: 0,
        total: 0,
        attendancePercent: 0,
    };

    if (isLoading) {
        return (
            <div className="bg-card border rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner /> Memuat ringkasan kehadiran...
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-card border rounded-xl shadow-sm p-6">
                <div className="text-sm text-destructive">Gagal memuat ringkasan kehadiran.</div>
            </div>
        );
    }

    return (
        <div className="bg-card border rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm font-medium">Ringkasan Hari Ini</div>
                    <div className="text-4xl font-semibold mt-2">{summary.presentCount}</div>
                    <div className="text-sm text-muted-foreground mt-2">
                        Siswa hadir dari total {summary.total}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {summary.absentCount} tidak hadir
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-muted-foreground">Tanggal</div>
                    <div className="text-sm font-medium">{summary.date}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Kehadiran: {summary.attendancePercent}%
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <Link href={detailHref}>
                    <Button variant="destructive" size="sm" className="rounded-full">
                        Lihat Detail
                    </Button>
                </Link>
            </div>
        </div>
    );
}
