"use client";

import React from "react";
import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddRubricDialog from "@/components/rubrics/AddRubricDialog";
import RubricCard from "@/components/rubrics/RubricCard";

export default function RubrikPage() {
  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-6 md:py-8">
        <RubrikClient />
      </div>
    </main>
  );
}

function RubrikClient() {
  const [search, setSearch] = React.useState("");
  const [major, setMajor] = React.useState("all");
  const [category, setCategory] = React.useState<
    "all" | "personality" | "technical"
  >("all");

  const { data, isLoading, isError, error, refetch } =
    api.rubrics.list.useQuery({
      search: search || undefined,
      major: major !== "all" ? major : undefined,
      category: category !== "all" ? category : undefined,
    });

  const rubrics = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rubrik Penilaian</h1>
          <p className="text-muted-foreground text-sm">
            Kelola rubrik untuk kalkulasi skor akhir dan indikator tugas
          </p>
        </div>
        <div className="z-10 shrink-0">
          <AddRubricDialog onSuccess={() => void refetch()} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama rubrik..."
          className="h-10 w-full sm:w-64"
        />

        <Select value={major} onValueChange={setMajor}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filter Jurusan">
            <SelectValue placeholder="Semua Jurusan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jurusan</SelectItem>
            <SelectItem value="RPL">RPL</SelectItem>
            <SelectItem value="TKJ">TKJ</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(v) =>
            setCategory(v as "all" | "personality" | "technical")
          }
        >
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label="Filter Kategori"
          >
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem value="personality">Kepribadian</SelectItem>
            <SelectItem value="technical">Teknis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Memuat rubrik...</div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2">
            <div className="text-destructive text-sm">Gagal memuat rubrik.</div>
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
        ) : rubrics.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            Tidak ada rubrik ditemukan.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rubrics.map((r) => (
              <RubricCard
                key={r.id}
                rubric={r}
                onUpdate={() => void refetch()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
