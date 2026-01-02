"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2 } from "lucide-react";

interface TaskCardProps {
  t: {
    id: string;
    titleMain: string;
    titleSub?: string;
    description: string;
    date: string;
  };
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export default function TaskCard({ t, onDelete, isDeleting }: TaskCardProps) {
  const daysLeft = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(t.date);
    const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  })();

  const badgeClass =
    daysLeft > 3
      ? "bg-green-100 text-green-800"
      : daysLeft >= 1
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4">
      {/* Responsive layout: stack on mobile, row on larger screens */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold truncate">{t.titleMain}</div>
          {t.titleSub && (
            <div className="text-sm text-muted-foreground truncate">{t.titleSub}</div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            <span className={`px-2 py-1 rounded-md ${badgeClass}`}>
              Tenggat: {t.date}
            </span>
          </div>
        </div>

        {/* Actions - responsive button layout */}
        <div className="flex items-center gap-2 shrink-0">
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(t.id)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
            >
              <Trash2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Hapus</span>
            </Button>
          )}
          <Link href={`/mentor/tugas/${t.id}/monitoring`}>
            <Button variant="destructive" size="sm" className="rounded-full">
              <span className="hidden sm:inline">Detail Tugas</span>
              <span className="sm:hidden">Detail</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
