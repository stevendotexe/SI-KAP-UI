"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Biodata = {
  nama: string
  nis: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: "laki-laki" | "perempuan" | ""
  kelas: string
  kompetensi: "Rekayasa Perangkat Lunak" | "Teknik Komputer dan Jaringan" | ""
  asalSekolah: string
  alamat: string
  noTelp: string
}

export default function BiodataPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const storageKey = useMemo(() => (user ? `biodata:${user.id}` : ""), [user])
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")
  const [errors, setErrors] = useState<{ nis?: string; noTelp?: string; tempatLahir?: string }>({})
  const [data, setData] = useState<Biodata>({
    nama: "",
    nis: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "",
    kelas: "",
    kompetensi: "",
    asalSekolah: "",
    alamat: "",
    noTelp: "",
  })

  // Route guard: only students may access, others redirected
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/login")
      else if (user.role !== "student") router.push("/dashboard")
    }
  }, [user, isLoading, router])

  // Initialize from localStorage or sensible defaults
  useEffect(() => {
    if (!user || !storageKey) return
    const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<Biodata>
        setData((prev) => ({
          ...prev,
          ...parsed,
        }))
        return
      } catch {}
    }
    // Defaults when no saved biodata
    setData((prev) => ({
      ...prev,
      nama:
        user.role === "student"
          ? user.name && user.name.toLowerCase() !== "student"
            ? user.name
            : "Ahmad"
          : user.name || "",
      // NIS should start empty (do not prefill from studentId)
      nis: "",
    }))
  }, [user, storageKey])

  if (isLoading || !user || user.role !== "student") return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // Numeric-only for NIS and No Telp
    if (name === "nis" || name === "noTelp") {
      const digitsOnly = value.replace(/\D+/g, "")
      setData((d) => ({ ...d, [name]: digitsOnly }))
      setErrors((prev) => ({
        ...prev,
        [name]: value !== digitsOnly ? "Hanya boleh input angka" : "",
      }))
      return
    }
    // Letters-only for Tempat Lahir (allow spaces)
    if (name === "tempatLahir") {
      // Remove any character that is not a letter or space (Unicode aware)
      const sanitized = value.replace(/[^\p{L}\s]+/gu, "")
      setData((d) => ({ ...d, [name]: sanitized }))
      setErrors((prev) => ({
        ...prev,
        tempatLahir: /\d/.test(value) ? "Hanya boleh input huruf" : "",
      }))
      return
    }
    setData((d) => ({ ...d, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    // Prevent save if there are validation errors
    if (errors.nis || errors.noTelp || errors.tempatLahir) {
      setSavedMsg("Perbaiki input yang tidak valid sebelum menyimpan.")
      setTimeout(() => setSavedMsg(""), 2500)
      return
    }
    setSaving(true)
    try {
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(data))
      }
      setSavedMsg("Biodata berhasil disimpan.")
      setTimeout(() => setSavedMsg(""), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!user) return
    const defaults: Partial<Biodata> = {
      nama:
        user.name && user.name.toLowerCase() !== "student"
          ? user.name
          : "Ahmad",
      // Reset NIS to empty as requested
      nis: "",
      tempatLahir: "",
      tanggalLahir: "",
      jenisKelamin: "",
      kelas: "",
      kompetensi: "",
      asalSekolah: "",
      alamat: "",
      noTelp: "",
    }
    setData((prev) => ({ ...prev, ...defaults }))
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Biodata</h1>
        <p className="text-muted-foreground mt-2">Silahkan isi biodata anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identitas Pribadi Siswa</CardTitle>
          <CardDescription>Isi dan simpan biodata Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama</Label>
                <Input id="nama" name="nama" value={data.nama} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nis">NIS</Label>
                <Input id="nis" name="nis" value={data.nis} onChange={handleChange} inputMode="numeric" pattern="\\d*" required />
                {errors.nis ? (
                  <p className="text-xs text-red-600">{errors.nis}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                <Input id="tempatLahir" name="tempatLahir" value={data.tempatLahir} onChange={handleChange} />
                {errors.tempatLahir ? (
                  <p className="text-xs text-red-600">{errors.tempatLahir}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                <Input id="tanggalLahir" name="tanggalLahir" type="date" value={data.tanggalLahir} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select value={data.jenisKelamin} onValueChange={(v: "laki-laki" | "perempuan") => setData((d) => ({ ...d, jenisKelamin: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas</Label>
                <Input id="kelas" name="kelas" value={data.kelas} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label>Kompetensi Keahlian</Label>
                <Select value={data.kompetensi} onValueChange={(v: "Rekayasa Perangkat Lunak" | "Teknik Komputer dan Jaringan") => setData((d) => ({ ...d, kompetensi: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kompetensi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rekayasa Perangkat Lunak">Rekayasa Perangkat Lunak</SelectItem>
                    <SelectItem value="Teknik Komputer dan Jaringan">Teknik Komputer dan Jaringan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asalSekolah">Asal Sekolah</Label>
                <Input id="asalSekolah" name="asalSekolah" value={data.asalSekolah} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea id="alamat" name="alamat" value={data.alamat} onChange={handleChange} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noTelp">No Telp</Label>
              <Input id="noTelp" name="noTelp" value={data.noTelp} onChange={handleChange} inputMode="numeric" pattern="\\d*" />
              {errors.noTelp ? (
                <p className="text-xs text-red-600">{errors.noTelp}</p>
              ) : null}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
              <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
              {savedMsg && <span className="text-sm text-green-700">{savedMsg}</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
