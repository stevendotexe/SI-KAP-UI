"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import AddTaskDialog, { type TaskItem } from "@/components/tasks/AddTaskDialog";
import TaskCard from "@/components/tasks/TaskCard";
import { toast } from "sonner";

export default function Page() {
  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-6 md:py-8">
        <TaskClient />
      </div>
    </main>
  );
}

function TaskClient() {
  const [q, setQ] = React.useState("");
  const [date, setDate] = React.useState("Semua Tanggal");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const utils = api.useUtils();

  const range = React.useMemo(() => {
    if (date === "Semua Tanggal") return {};
    const [year, month] = date.split("-").map(Number);
    if (!year || !month) return {};
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, [date]);

  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
  } = api.tasks.list.useQuery({
    search: q || undefined,
    from: range.from,
    to: range.to,
    limit: 100,
  });

  // Delete mutation
  const deleteMutation = api.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Tugas berhasil dihapus");
      setDeletingId(null);
      void utils.tasks.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus tugas");
      setDeletingId(null);
    },
  });

  const tasks: TaskItem[] =
    tasksData?.items.map((t) => ({
      id: t.id.toString(),
      titleMain: t.title,
      titleSub: t.targetMajor
        ? t.targetMajor.includes(",")
          ? t.targetMajor.split(",").join(" dan ")
          : t.targetMajor
        : "Umum",
      description: t.description,
      date: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "",
      assignedCount: t.assignedCount,
      submittedCount: t.submittedCount,
    })) ?? [];

  const filtered = tasks.filter((t) =>
    date === "Semua Tanggal" ? true : t.date.startsWith(date),
  );

  function onAdd() {
    void refetch();
  }

  function handleDelete(id: string) {
    if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
      setDeletingId(id);
      deleteMutation.mutate({ taskId: parseInt(id) });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tugas</h1>
          <p className="text-muted-foreground text-sm">
            Kelola tugas untuk siswa
          </p>
        </div>
        {/* Pastikan tombol selalu terlihat */}
        <div className="z-10 shrink-0">
          <AddTaskDialog onAdd={onAdd} />
        </div>
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari Judul/Deskripsi Tugas"
        className="h-10"
      />

      <Select value={date} onValueChange={setDate}>
        <SelectTrigger
          className="w-full min-w-[240px] sm:w-fit"
          aria-label="Filter Tanggal"
        >
          <SelectValue placeholder="Semua Tanggal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Semua Tanggal">Semua Tanggal</SelectItem>
          <SelectItem value="2025-06">Juni 2025</SelectItem>
          <SelectItem value="2025-07">Juli 2025</SelectItem>
        </SelectContent>
      </Select>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Memuat tugas...</div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2">
            <div className="text-destructive text-sm">Gagal memuat tugas.</div>
            <button
              className="rounded-(--radius-sm) border px-3 py-1"
              onClick={() => refetch()}
            >
              Coba Lagi
            </button>
            <div className="text-muted-foreground text-xs">
              {error?.message}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground text-sm">Tidak ada tugas.</div>
        ) : (
          filtered.map((t) => (
            <TaskCard
              key={t.id}
              t={t}
              onDelete={handleDelete}
              isDeleting={deletingId === t.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

