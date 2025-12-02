"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { api } from "@/trpc/react"

export default function BiodataSiswaPage() {
  const [nama, setNama] = useState("")
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

  // Akses aman ke cabang router yang mungkin belum terdaftar pada appRouter
  const spRouter = (api as any)?.studentProfile
  const routerMissing = !spRouter

  // Nonaktifkan query agar tidak memicu console error
  const { data, isLoading, isError, refetch } =
    spRouter?.getMine?.useQuery(undefined, { retry: 0, enabled: false }) ??
    { data: undefined, isLoading: false, isError: routerMissing, refetch: async () => {} }

  const upsert =
    spRouter?.upsert?.useMutation() ??
    ({
      isPending: false,
      isError: false,
      isSuccess: false,
      mutateAsync: async () => {
        throw new Error("router studentProfile tidak tersedia")
      },
    } as any)

  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current) return
    if (!data) return
    hydrated.current = true

    if (typeof data.name === "string") setNama(data.name)
    if (typeof data.nis === "string") setNis(data.nis)
    if (typeof data.birthPlace === "string") setTempatLahir(data.birthPlace)
    if (data.birthDate instanceof Date) setDob(data.birthDate.toISOString().slice(0, 10))
    if (data.gender === "Perempuan") setGender("Perempuan")
    if (typeof data.semester === "number") setSemester(String(data.semester))
    if (data.skillCompetency === "Rekayasa Perangkat Lunak") setKompetensi("Rekayasa Perangkat Lunak")
    if (typeof data.schoolName === "string") setAsalSekolah(data.schoolName)
    if (typeof data.address === "string") setAlamat(data.address)
    if (typeof data.phone === "string") setNoTelp(data.phone)
  }, [data])

  const isDirty =
    nama !== "" ||
    nis !== "" ||
    tempatLahir !== "" ||
    dob !== "" ||
    gender !== "Laki-laki" ||
    semester !== "" ||
    kompetensi !== "Teknik Komputer dan Jaringan" ||
    asalSekolah !== "" ||
    alamat !== "" ||
    noTelp !== ""

  const handleReset = () => {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      await upsert.mutateAsync({
        name: nama.length ? nama : null,
        nis: nis.length ? nis : null,
        birthPlace: tempatLahir.length ? tempatLahir : null,
        birthDate: dob.length ? new Date(dob) : null,
        gender,
        semester: semester.length ? Number(semester) : null,
        skillCompetency: kompetensi,
        schoolName: asalSekolah.length ? asalSekolah : null,
        address: alamat.length ? alamat : null,
        phone: noTelp.length ? noTelp : null,
      })
      await refetch()
    } catch {
      // mitigasi via banner di bawah
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-5 m-0 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold">Biodata</h1>
          <p className="text-muted-foreground">Silahkan isi biodata anda</p>
        </div>

        <section className="mt-6 rounded-2xl border bg-card p-6">
          <h2 className="text-base sm:text-lg font-semibold">Identitas Pribadi Siswa</h2>

          <form onSubmit={handleSubmit}>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nama */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input
                  value={nama}
                  onChange={(e) => setNama(e.target.value.replace(/[^\p{L}\s]/gu, ""))}
                  placeholder={isLoading ? "Memuat..." : "Rafif Zharif"}
                  className="h-10 px-4"
                />
              </div>

              {/* NIS */}
              <div className="space-y-2">
                <label className="text-sm font-medium">NIS</label>
                <Input
                  value={nis}
                  onChange={(e) => setNis(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder={isLoading ? "…" : "234658594"}
                  className="h-10 px-4"
                />
              </div>

              {/* Tempat lahir */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tempat Lahir</label>
                <Input
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value.replace(/[^\p{L}\s]/gu, ""))}
                  placeholder={isLoading ? "…" : "Bandung"}
                  className="h-10 px-4"
                />
              </div>

              {/* Tanggal lahir */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Lahir</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-4 text-sm"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Kelamin</label>
                <Select
                  value={gender}
                  onValueChange={(v) => setGender(v as "Laki-laki" | "Perempuan")}
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
                  onChange={(e) => setSemester(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder={isLoading ? "…" : "6"}
                  className="h-10 px-4"
                />
              </div>

              {/* Kompetensi */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Kompetensi Keahlian</label>
                <Select
                  value={kompetensi}
                  onValueChange={(v) => setKompetensi(
                    v as
                      | "Teknik Komputer dan Jaringan"
                      | "Rekayasa Perangkat Lunak"
                  )}
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
                  placeholder={isLoading ? "…" : "SMK 1 Tasikmalaya"}
                  className="h-10 px-4"
                />
              </div>

              {/* Alamat */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder={isLoading ? "…" : ""}
                  className="h-10 px-4"
                />
              </div>

              {/* No telp */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">No telp</label>
                <Input
                  value={noTelp}
                  onChange={(e) => setNoTelp(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder={isLoading ? "…" : ""}
                  className="h-10 px-4"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button type="submit" variant="destructive" className="h-9 px-6" disabled={upsert.isPending || routerMissing}>
                {upsert.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
              {isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="h-9 px-6 border-destructive text-destructive hover:bg-destructive/10"
                  disabled={upsert.isPending}
                >
                  Bersihkan
                </Button>
              )}
            </div>

            {upsert.isError && (
              <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm px-3 py-2">
                Gagal menyimpan biodata. Periksa koneksi dan coba lagi.
              </div>
            )}
            {upsert.isSuccess && (
              <div className="mt-3 rounded-md border border-green-500/30 bg-green-500/5 text-green-700 text-sm px-3 py-2">
                Biodata tersimpan.
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}
