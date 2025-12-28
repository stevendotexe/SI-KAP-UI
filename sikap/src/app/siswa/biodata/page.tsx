"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";
import { Lock } from "lucide-react";

// Select (shadcn new structure)
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Helper: safely extract YYYY-MM-DD from birthDate (handles both Date object and string)
function extractDateString(birthDate: unknown): string {
  if (!birthDate) return "";
  // If it's already a YYYY-MM-DD string, use it directly
  if (typeof birthDate === "string") {
    // Validate it's a proper date string format
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (dateRegex.test(birthDate)) {
      return birthDate.slice(0, 10);
    }
  }
  // Fallback: try to parse as Date (for backwards compatibility)
  try {
    const dateObj = new Date(birthDate as string | number | Date);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().slice(0, 10);
    }
  } catch {
    // ignore parse errors
  }
  return "";
}

// Helper: convert major code to display name
function majorToDisplayName(major: string | null | undefined): string {
  if (!major) return "-";
  if (major === "RPL") return "Rekayasa Perangkat Lunak (RPL)";
  if (major === "TKJ") return "Teknik Komputer dan Jaringan (TKJ)";
  // Legacy support for full names
  if (major.includes("Rekayasa") || major.includes("RPL"))
    return "Rekayasa Perangkat Lunak (RPL)";
  if (major.includes("Teknik") || major.includes("TKJ"))
    return "Teknik Komputer dan Jaringan (TKJ)";
  return major;
}

// Helper: convert old full names to abbreviations for backward compatibility
function normalizeMajor(major: string | null | undefined): "TKJ" | "RPL" {
  if (!major) return "TKJ";

  // If already abbreviated, return as-is
  if (major === "RPL" || major === "TKJ") {
    return major;
  }

  // Convert old full names to abbreviations
  if (major === "Rekayasa Perangkat Lunak") return "RPL";
  if (major === "Teknik Komputer dan Jaringan") return "TKJ";

  // Default fallback
  return "TKJ";
}

export default function BiodataSiswaPage() {
  const [nama, setNama] = useState("");
  const [namaError, setNamaError] = useState<string | null>(null);
  const namaInputRef = useRef<HTMLInputElement>(null);
  const [tempatLahir, setTempatLahir] = useState("");
  const [semester, setSemester] = useState("");
  const [asalSekolah, setAsalSekolah] = useState("");
  const [alamat, setAlamat] = useState("");
  const [noTelp, setNoTelp] = useState("");

  // tRPC query for fetching profile
  const profileQuery = api.students.me.useQuery();

  // tRPC mutation for updating profile
  const updateMutation = api.students.updateProfile.useMutation({
    onSuccess: () => {
      alert("Profil berhasil diperbarui!");
      void profileQuery.refetch();
    },
    onError: (err) => {
      alert(`Gagal memperbarui profil: ${err.message}`);
    },
  });

  // Populate form fields from query data
  useEffect(() => {
    if (profileQuery.data) {
      setNama(profileQuery.data.name ?? "");
      setTempatLahir(profileQuery.data.birthPlace ?? "");
      setSemester(
        profileQuery.data.semester ? String(profileQuery.data.semester) : "",
      );
      setAsalSekolah(profileQuery.data.school ?? "");
      setAlamat(profileQuery.data.address ?? "");
      setNoTelp(profileQuery.data.phone ?? "");
      // Clear any previous validation errors when data loads
      setNamaError(null);
    }
  }, [profileQuery.data]);

  // deteksi perubahan dari loaded data (only editable fields)
  const isDirty =
    nama !== (profileQuery.data?.name ?? "") ||
    tempatLahir !== (profileQuery.data?.birthPlace ?? "") ||
    semester !==
    (profileQuery.data?.semester ? String(profileQuery.data.semester) : "") ||
    asalSekolah !== (profileQuery.data?.school ?? "") ||
    alamat !== (profileQuery.data?.address ?? "") ||
    noTelp !== (profileQuery.data?.phone ?? "");

  const handleReset = () => {
    // Reset to loaded profile data
    if (profileQuery.data) {
      setNama(profileQuery.data.name ?? "");
      setTempatLahir(profileQuery.data.birthPlace ?? "");
      setSemester(
        profileQuery.data.semester ? String(profileQuery.data.semester) : "",
      );
      setAsalSekolah(profileQuery.data.school ?? "");
      setAlamat(profileQuery.data.address ?? "");
      setNoTelp(profileQuery.data.phone ?? "");
    } else {
      setNama("");
      setTempatLahir("");
      setSemester("");
      setAsalSekolah("");
      setAlamat("");
      setNoTelp("");
    }
    // Clear validation errors on reset
    setNamaError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that name is not empty
    if (!nama.trim()) {
      setNamaError("Nama tidak boleh kosong");
      namaInputRef.current?.focus();
      return;
    }
    setNamaError(null);

    updateMutation.mutate({
      name: nama.trim(),
      birthPlace: tempatLahir || undefined,
      semester: semester ? Number(semester) : undefined,
      school: asalSekolah || undefined,
      address: alamat || undefined,
      phone: noTelp || undefined,
    });
  };

  // Loading state
  if (profileQuery.isLoading) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Error state
  if (profileQuery.isError) {
    return (
      <div className="bg-muted/30 m-0 min-h-screen p-0">
        <div className="m-0 w-full max-w-none p-0 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
          <div className="p-6 text-center">
            <p className="text-destructive">
              Gagal memuat profil.{" "}
              <button
                onClick={() => void profileQuery.refetch()}
                className="underline"
              >
                Coba lagi
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Locked field values from profile
  const lockedNis = profileQuery.data?.nis ?? "-";
  const lockedDob = extractDateString(profileQuery.data?.birthDate) || "-";
  const lockedGender = profileQuery.data?.gender ?? "-";
  const lockedMajor = majorToDisplayName(profileQuery.data?.major);
  const lockedCohort = profileQuery.data?.cohort ?? "-";

  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Header */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-semibold">Biodata</h1>
          <p className="text-muted-foreground">Silahkan isi biodata anda</p>
        </div>

        {/* Card */}
        <section className="bg-card mt-6 rounded-2xl border p-6">
          <h2 className="text-base font-semibold sm:text-lg">
            Identitas Pribadi Siswa
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Nama - Editable */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input
                  ref={namaInputRef}
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value.replace(/[^\p{L}\s]/gu, ""));
                    if (namaError) setNamaError(null);
                  }}
                  placeholder="Rafif Zharif"
                  className={`h-10 px-4 ${namaError ? "border-destructive" : ""}`}
                  disabled={updateMutation.isPending}
                />
                {namaError && (
                  <p className="text-destructive text-xs">{namaError}</p>
                )}
              </div>

              {/* NIS - Locked */}
              <div className="space-y-2">
                <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                  <Lock className="h-3 w-3" /> NIS
                </label>
                <div className="bg-muted flex h-10 items-center rounded-md border px-4 text-sm opacity-70">
                  {lockedNis}
                </div>
              </div>

              {/* Tempat lahir - Editable */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tempat Lahir</label>
                <Input
                  value={tempatLahir}
                  onChange={(e) =>
                    setTempatLahir(e.target.value.replace(/[^\p{L}\s]/gu, ""))
                  }
                  placeholder="Bandung"
                  className="h-10 px-4"
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* Tanggal lahir - Locked */}
              <div className="space-y-2">
                <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                  <Lock className="h-3 w-3" /> Tanggal Lahir
                </label>
                <div className="bg-muted flex h-10 items-center rounded-md border px-4 text-sm opacity-70">
                  {lockedDob}
                </div>
              </div>

              {/* Gender - Locked */}
              <div className="space-y-2">
                <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                  <Lock className="h-3 w-3" /> Jenis Kelamin
                </label>
                <div className="bg-muted flex h-10 items-center rounded-md border px-4 text-sm opacity-70">
                  {lockedGender}
                </div>
              </div>

              {/* Semester - Editable */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <Input
                  value={semester}
                  onChange={(e) =>
                    setSemester(e.target.value.replace(/[^\d]/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="6"
                  className="h-10 px-4"
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* Kompetensi Keahlian - Locked */}
              <div className="space-y-2">
                <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                  <Lock className="h-3 w-3" /> Kompetensi Keahlian
                </label>
                <div className="bg-muted flex h-10 items-center rounded-md border px-4 text-sm opacity-70">
                  {lockedMajor}
                </div>
              </div>

              {/* Asal sekolah - Editable */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Asal Sekolah</label>
                <Input
                  value={asalSekolah}
                  onChange={(e) => setAsalSekolah(e.target.value)}
                  placeholder="SMK 1 Tasikmalaya"
                  className="h-10 px-4"
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* Tahun (Cohort) - Locked */}
              <div className="space-y-2">
                <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                  <Lock className="h-3 w-3" /> Tahun
                </label>
                <div className="bg-muted flex h-10 items-center rounded-md border px-4 text-sm opacity-70">
                  {lockedCohort}
                </div>
              </div>

              {/* Alamat - Editable */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="h-10 px-4"
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* No telp - Editable */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">No Telp</label>
                <Input
                  value={noTelp}
                  onChange={(e) =>
                    setNoTelp(e.target.value.replace(/[^\d]/g, ""))
                  }
                  inputMode="numeric"
                  className="h-10 px-4"
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>

            {/* Info about locked fields */}
            <p className="text-muted-foreground mt-4 flex items-center gap-1 text-xs">
              <Lock className="h-3 w-3" /> Field dengan ikon kunci hanya dapat
              diubah oleh mentor atau admin.
            </p>

            {/* Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                type="submit"
                variant="destructive"
                className="h-9 px-6"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
              {isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="border-destructive text-destructive hover:bg-destructive/10 h-9 px-6"
                  disabled={updateMutation.isPending}
                >
                  Bersihkan
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
