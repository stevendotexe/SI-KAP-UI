"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/trpc/react"
import { Spinner } from "@/components/ui/spinner"

// Select (shadcn new structure)
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

// Helper: safely extract YYYY-MM-DD from birthDate (handles both Date object and string)
function extractDateString(birthDate: unknown): string {
  if (!birthDate) return ""
  // If it's already a YYYY-MM-DD string, use it directly
  if (typeof birthDate === "string") {
    // Validate it's a proper date string format
    const dateRegex = /^\d{4}-\d{2}-\d{2}/
    if (dateRegex.test(birthDate)) {
      return birthDate.slice(0, 10)
    }
  }
  // Fallback: try to parse as Date (for backwards compatibility)
  try {
    const dateObj = new Date(birthDate as string | number | Date)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().slice(0, 10)
    }
  } catch {
    // ignore parse errors
  }
  return ""
}

export default function BiodataSiswaPage() {
  const [nama, setNama] = useState("")
  const [namaError, setNamaError] = useState<string | null>(null)
  const namaInputRef = useRef<HTMLInputElement>(null)
  const [nis, setNis] = useState("")
  const [tempatLahir, setTempatLahir] = useState("")
  const [dob, setDob] = useState<string>("")
  const [gender, setGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki")
  const [semester, setSemester] = useState("")
  const [kompetensi, setKompetensi] = useState<
    "Teknik Komputer dan Jaringan" | "Rekayasa Perangkat Lunak"
  >("Teknik Komputer dan Jaringan")
  const [asalSekolah, setAsalSekolah] = useState("")
  const [alamat, setAlamat] = useState("")
  const [noTelp, setNoTelp] = useState("")

  // tRPC query for fetching profile
  const profileQuery = api.students.me.useQuery()

  // tRPC mutation for updating profile
  const updateMutation = api.students.updateProfile.useMutation({
    onSuccess: () => {
      alert("Profil berhasil diperbarui!")
      void profileQuery.refetch()
    },
    onError: (err) => {
      alert(`Gagal memperbarui profil: ${err.message}`)
    },
  })

  // Populate form fields from query data
  useEffect(() => {
    if (profileQuery.data) {
      setNama(profileQuery.data.name ?? "")
      setNis(profileQuery.data.nis ?? "")
      setTempatLahir(profileQuery.data.birthPlace ?? "")
      // Use extractDateString to handle birthDate as plain YYYY-MM-DD string
      setDob(extractDateString(profileQuery.data.birthDate))
      setGender(
        (profileQuery.data.gender as "Laki-laki" | "Perempuan") ?? "Laki-laki"
      )
      setSemester(
        profileQuery.data.semester ? String(profileQuery.data.semester) : ""
      )
      setKompetensi(
        (profileQuery.data.major as
          | "Teknik Komputer dan Jaringan"
          | "Rekayasa Perangkat Lunak") ?? "Teknik Komputer dan Jaringan"
      )
      setAsalSekolah(profileQuery.data.school ?? "")
      setAlamat(profileQuery.data.address ?? "")
      setNoTelp(profileQuery.data.phone ?? "")
      // Clear any previous validation errors when data loads
      setNamaError(null)
    }
  }, [profileQuery.data])

  // deteksi perubahan dari loaded data
  const isDirty =
    nama !== (profileQuery.data?.name ?? "") ||
    nis !== (profileQuery.data?.nis ?? "") ||
    tempatLahir !== (profileQuery.data?.birthPlace ?? "") ||
    dob !== extractDateString(profileQuery.data?.birthDate) ||
    gender !== ((profileQuery.data?.gender as "Laki-laki" | "Perempuan") ?? "Laki-laki") ||
    semester !== (profileQuery.data?.semester ? String(profileQuery.data.semester) : "") ||
    kompetensi !==
      ((profileQuery.data?.major as
        | "Teknik Komputer dan Jaringan"
        | "Rekayasa Perangkat Lunak") ?? "Teknik Komputer dan Jaringan") ||
    asalSekolah !== (profileQuery.data?.school ?? "") ||
    alamat !== (profileQuery.data?.address ?? "") ||
    noTelp !== (profileQuery.data?.phone ?? "")

  const handleReset = () => {
    // Reset to loaded profile data
    if (profileQuery.data) {
      setNama(profileQuery.data.name ?? "")
      setNis(profileQuery.data.nis ?? "")
      setTempatLahir(profileQuery.data.birthPlace ?? "")
      // Use extractDateString to handle birthDate as plain YYYY-MM-DD string
      setDob(extractDateString(profileQuery.data.birthDate))
      setGender(
        (profileQuery.data.gender as "Laki-laki" | "Perempuan") ?? "Laki-laki"
      )
      setSemester(
        profileQuery.data.semester ? String(profileQuery.data.semester) : ""
      )
      setKompetensi(
        (profileQuery.data.major as
          | "Teknik Komputer dan Jaringan"
          | "Rekayasa Perangkat Lunak") ?? "Teknik Komputer dan Jaringan"
      )
      setAsalSekolah(profileQuery.data.school ?? "")
      setAlamat(profileQuery.data.address ?? "")
      setNoTelp(profileQuery.data.phone ?? "")
    } else {
      setNama("")
      setNis("")
      setTempatLahir("")
      setDob("")
      setGender("Laki-laki")
      setSemester("")
      setKompetensi("Teknik Komputer dan Jaringan")
      setAsalSekolah("")
      setAlamat("")
      setNoTelp("")
    }
    // Clear validation errors on reset
    setNamaError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that name is not empty
    if (!nama.trim()) {
      setNamaError("Nama tidak boleh kosong")
      namaInputRef.current?.focus()
      return
    }
    setNamaError(null)
    
    // Convert dob string to Date for API contract (server expects Date type)
    // Using UTC midnight to avoid local timezone shifts
    let birthDateValue: Date | undefined
    if (dob) {
      // Parse as UTC to avoid timezone issues: "YYYY-MM-DD" -> UTC midnight
      const [year, month, day] = dob.split("-").map(Number)
      birthDateValue = new Date(Date.UTC(year!, month! - 1, day!))
    }
    
    updateMutation.mutate({
      name: nama.trim(),
      nis: nis || undefined,
      birthPlace: tempatLahir || undefined,
      birthDate: birthDateValue,
      gender: gender || undefined,
      semester: semester ? Number(semester) : undefined,
      school: asalSekolah || undefined,
      major: kompetensi || undefined,
      address: alamat || undefined,
      phone: noTelp || undefined,
    })
  }

  // Loading state
  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // Error state
  if (profileQuery.isError) {
    return (
      <div className="min-h-screen bg-muted/30 p-0 m-0">
        <div className="w-full max-w-none p-0 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
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
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-5 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
        
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold">Biodata</h1>
          <p className="text-muted-foreground">Silahkan isi biodata anda</p>
        </div>

        {/* Card */}
        <section className="mt-6 rounded-2xl border bg-card p-6">
          <h2 className="text-base sm:text-lg font-semibold">
            Identitas Pribadi Siswa
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Nama */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input
                  ref={namaInputRef}
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value.replace(/[^\p{L}\s]/gu, ""))
                    // Clear error when user starts typing
                    if (namaError) setNamaError(null)
                  }}
                  placeholder="Rafif Zharif"
                  className={`h-10 px-4 ${namaError ? "border-destructive" : ""}`}
                  disabled={updateMutation.isPending}
                />
                {namaError && (
                  <p className="text-xs text-destructive">{namaError}</p>
                )}
              </div>

              {/* NIS */}
              <div className="space-y-2">
                <label className="text-sm font-medium">NIS</label>
                <Input
                  value={nis}
                  onChange={(e) =>
                    setNis(e.target.value.replace(/[^\d]/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="234658594"
                  className="h-10 px-4"
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* Tempat lahir */}
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

              {/* Tanggal lahir */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Lahir</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Kelamin</label>

                <Select
                  value={gender}
                  onValueChange={(v) =>
                    setGender(v as "Laki-laki" | "Perempuan")
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="w-full h-10 rounded-full border bg-background px-4 text-sm text-muted-foreground">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-xl">
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Semester */}
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

              {/* Kompetensi */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Kompetensi Keahlian</label>

                <Select
                  value={kompetensi}
                  onValueChange={(v) =>
                    setKompetensi(
                      v as
                        | "Teknik Komputer dan Jaringan"
                        | "Rekayasa Perangkat Lunak"
                    )
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="w-full h-10 rounded-full border bg-background px-4 text-sm text-muted-foreground">
                    <SelectValue placeholder="Pilih kompetensi" />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-xl">
                    <SelectItem value="Teknik Komputer dan Jaringan">
                      Teknik Komputer dan Jaringan
                    </SelectItem>
                    <SelectItem value="Rekayasa Perangkat Lunak">
                      Rekayasa Perangkat Lunak
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Asal sekolah */}
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

              {/* Alamat */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="h-10 px-4"
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* No telp */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">No telp</label>
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
              {isDirty && ( // hanya tampil jika ada perubahan
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="h-9 px-6 border-destructive text-destructive hover:bg-destructive/10"
                  disabled={updateMutation.isPending}
                >
                  Bersihkan
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
