"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

type Biodata = {
  nama: string
  nis: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  kelas: string
  kompetensi: string
  asalSekolah: string
  alamat: string
  noTelp: string
}

export default function RaportAkhirPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const storageKey = useMemo(() => (user ? `biodata:${user.id}` : ""), [user])
  const [biodata, setBiodata] = useState<Biodata | null>(null)

  // Guard: only students
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/login")
      else if (user.role !== "student") router.push("/dashboard")
    }
  }, [user, isLoading, router])

  // Load biodata
  useEffect(() => {
    if (!user || !storageKey) return
    const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
    const fallbackNama = user.name && user.name.toLowerCase() !== "student" ? user.name : "Ahmad"
    const base: Biodata = {
      nama: fallbackNama,
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
    if (raw) {
      try {
        setBiodata({ ...base, ...(JSON.parse(raw) as Partial<Biodata>) })
        return
      } catch {}
    }
    setBiodata(base)
  }, [user, storageKey])

  if (isLoading || !user || user.role !== "student") return null

  const onExport = () => {
    // Use browser print to export as PDF (user chooses Save as PDF)
    window.print()
  }

  const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })

  return (
    <div className="space-y-6 p-6">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-container { box-shadow: none !important; border: none !important; }
          .print-card { page-break-inside: avoid; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raport Akhir</h1>
          <p className="text-muted-foreground mt-2">laporan akhir kerja anda</p>
        </div>
        <Button onClick={onExport} className="no-print">
          <FileDown className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <Card className="print-container print-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Raport Akhir Praktik Kerja Lapangan</CardTitle>
          <CardDescription>Dicetak: {today}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Identitas */}
          <section>
            <h2 className="font-semibold mb-3">Identitas Siswa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <Field label="Nama" value={biodata?.nama} />
              <Field label="NIS" value={biodata?.nis} />
              <Field label="Tempat, Tanggal Lahir" value={[biodata?.tempatLahir, biodata?.tanggalLahir].filter(Boolean).join(", ")} />
              <Field label="Jenis Kelamin" value={biodata?.jenisKelamin} />
              <Field label="Kelas" value={biodata?.kelas} />
              <Field label="Kompetensi Keahlian" value={biodata?.kompetensi} />
              <Field label="Asal Sekolah" value={biodata?.asalSekolah} />
              <Field label="No Telp" value={biodata?.noTelp} />
            </div>
            <div className="mt-3">
              <Field label="Alamat" value={biodata?.alamat} fullWidth />
            </div>
          </section>

          {/* Penilaian (menggantikan Ringkasan) */}
          <section>
            <h2 className="font-semibold mb-3">Penilaian</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-3 py-2 text-left">No</th>
                    <th className="border border-border px-3 py-2 text-left">Jenis Penilaian</th>
                    <th className="border border-border px-3 py-2 text-left">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2">1</td>
                    <td className="border border-border px-3 py-2">kehadiran</td>
                    <td className="border border-border px-3 py-2">10</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2">2</td>
                    <td className="border border-border px-3 py-2">pengerjaan tugas</td>
                    <td className="border border-border px-3 py-2">9</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2">3</td>
                    <td className="border border-border px-3 py-2">sopan santun</td>
                    <td className="border border-border px-3 py-2">9</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="border border-border px-3 py-2" colSpan={2}>Total Nilai</td>
                    <td className="border border-border px-3 py-2">28</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Tanda tangan */}
          <section className="grid grid-cols-2 gap-6 mt-6">
  <div>
    <p className="mb-16">Siswa,</p>
    <p className="font-semibold">{biodata?.nama || "(Nama)"}</p>
  </div>
  <div className="text-right pr-8">
    <p className="mb-16">Mentor,</p>
    <p className="font-semibold">____________________</p>
  </div>
</section>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value, fullWidth = false }: { label: string; value?: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "col-span-1 md:col-span-2" : undefined}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium min-h-5">{value || "-"}</p>
    </div>
  )
}
