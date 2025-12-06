"use client";

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { api } from "@/trpc/react"
import { useMemo } from "react"

/**
 * TODO: Backend Integration Required
 * 
 * This page currently displays static final report data. To integrate with backend:
 * 
 * Required Backend Endpoint:
 * - `api.finalReports.myReport.useQuery()` (student-specific procedure)
 *   - Should return final report for logged-in student's active placement
 *   - Returns: {
 *       student: { name, nis, birthPlace, birthDate, gender, semester, school, major, address, phone },
 *       scores: {
 *         personality: Array<{ name, score }>,
 *         technical: Array<{ name, score }>
 *       },
 *       totalScore: number,
 *       averageScore: number
 *     }
 * 
 * Current Limitation:
 * - `finalReports.detail` in `sikap/src/server/api/routers/finalReports.ts` uses
 *   `adminOrMentorProcedure`, blocking student access
 * - No student-facing final report procedures exist
 * 
 * Integration Steps (when endpoint available):
 * 1. Import: `import { api } from "@/trpc/react"` and `import { Spinner } from "@/components/ui/spinner"`
 * 2. Query: `const { data, isLoading, error } = api.finalReports.myReport.useQuery()`
 * 3. Replace hardcoded student identity fields (lines 56-96) with `data?.student` fields
 * 4. Replace hardcoded scores (lines 136-175) with mapped `data?.scores.personality` and `data?.scores.technical`
 * 5. Replace total/average (lines 183-189) with `data?.totalScore` and `data?.averageScore`
 * 6. Add loading state before card: `{isLoading && <Spinner />}`
 * 7. Add error state: `{error && <div>Error loading final report</div>}`
 * 8. Format dates: `new Date(data.student.birthDate).toLocaleDateString('id-ID')`
 * 9. Conditionally render card only when `data` exists
 */

export default function RaporAkhirPage() {
  const handleDownload = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) return alert("Element PNG tidak ditemukan!");
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(element, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true })
      const link = document.createElement("a")
      link.download = "Rapor_Akhir_Praktik_Kerja_Lapangan.png"
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error(e);
      alert("Gagal membuat PNG");
    }
  };

  const spRouter = (api as any)?.studentProfile
  const reportsRouter = (api as any)?.reports

  // NONAKTIFKAN QUERY: hindari console error studentProfile.getMine dan reports.finalScore
  const { data: profile, isLoading: loadingProfile } =
    spRouter?.getMine?.useQuery(undefined, { retry: 0, enabled: false }) ??
    { data: undefined, isLoading: false }

  const { data: final, isLoading: loadingFinal } =
    reportsRouter?.finalScore?.useQuery(undefined, { retry: 0, enabled: false }) ??
    { data: undefined, isLoading: false }

  // Format tanggal lahir
  const ttl = useMemo(() => {
    const place = typeof profile?.birthPlace === "string" && profile.birthPlace.length ? profile.birthPlace : "Bandung"
    const bdRaw = profile?.birthDate
    const bd = bdRaw ? new Date(String(bdRaw)) : undefined
    const dateStr =
      bd && !isNaN(bd.getTime())
        ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(bd)
        : "12 September 2005"
    return `${place}, ${dateStr}`
  }, [profile])

  // Kompetensi label
  const kompetensi =
    typeof profile?.skillCompetency === "string" && profile.skillCompetency.length
      ? profile.skillCompetency
      : "Teknik Komputer & jaringan"

  // Nilai total & rata-rata (safe)
  const totalNilai = typeof final?.total === "number" ? String(final.total) : "1105"
  const rataRata = typeof final?.avg === "number" ? String(Math.round(final.avg)) : "92"

  return (
    <div className="min-h-screen bg-muted/30 p-0 m-0">
      <div className="w-full max-w-none p-0 m-0">
        <main className="space-y-6 p-5 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-semibold">Rapor Akhir</h1>
              <p className="text-muted-foreground">
                {loadingProfile || loadingFinal ? "Memuat..." : "Laporan akhir kerja Anda"}
              </p>
            </div>
            <Button
              variant="destructive"
              className="h-9 px-4"
              onClick={handleDownload}
            >
              <FileDown className="size-4" />
              <span className="ml-2">Cetak PNG</span>
            </Button>
          </div>

          {/* Card */}
          <section className="mt-4">
            <div
              id="pdf-content"
              className="bg-card rounded-2xl border p-6 shadow-sm"
            >
              {/* Judul di tengah */}
              <div className="text-center font-semibold">
                Rapor Akhir Praktik Kerja Lapangan
              </div>

              {/* MOCK DATA: Replace with api.finalReports.myReport.useQuery() when backend endpoint is available */}
              {/* A. Identitas Siswa */}
              <div className="mt-6">
                <div className="font-semibold">A. Identitas Siswa</div>

                <div className="mt-4 grid grid-cols-1 gap-x-20 gap-y-3 text-sm md:grid-cols-2">
                  {/* Kiri */}
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">Nama</div>
                      <div>{(typeof profile?.name === "string" && profile.name.length) ? profile.name : "Rafif Zharif"}</div>
                    </div>
                    <div>
                      <div className="font-medium">Tempat, tanggal lahir</div>
                      <div>{ttl}</div>
                    </div>
                    <div>
                      <div className="font-medium">Semester</div>
                      <div>{(typeof profile?.semester === "number") ? String(profile.semester) : "6"}</div>
                    </div>
                    <div>
                      <div className="font-medium">Asal Sekolah</div>
                      <div>{(typeof profile?.schoolName === "string" && profile.schoolName.length) ? profile.schoolName : "SMK 1 Tasikmalaya"}</div>
                    </div>
                  </div>

                  {/* Kanan */}
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">NIS</div>
                      <div>{(typeof profile?.nis === "string" && profile.nis.length) ? profile.nis : "234658594"}</div>
                    </div>
                    <div>
                      <div className="font-medium">Jenis kelamin</div>
                      <div>{(profile?.gender === "Perempuan" || profile?.gender === "Laki-laki") ? profile.gender : "Laki-laki"}</div>
                    </div>
                    <div>
                      <div className="font-medium">Kompetensi Keahlian</div>
                      <div>{kompetensi}</div>
                    </div>
                    <div>
                      <div className="font-medium">No telp</div>
                      <div>{(typeof profile?.phone === "string" && profile.phone.length) ? profile.phone : "0812344556677"}</div>
                    </div>
                  </div>

                  {/* Alamat full width */}
                  <div className="mt-2 md:col-span-2">
                    <div className="font-medium">Alamat</div>
                    <div>{(typeof profile?.address === "string" && profile.address.length) ? profile.address : "Jl Pendidikan No. 20"}</div>
                  </div>
                </div>
              </div>

              {/* MOCK SCORES: Replace with data?.scores.personality and data?.scores.technical when backend endpoint is available */}
              {/* B. Penilaian */}
              <div className="mt-6">
                <div className="font-semibold">B. Penilaian</div>

                <div className="no-scroll mt-3 rounded-xl border">
                  <style>{`
                    #pdf-content .no-scroll {
                      overflow: visible;
                      position: relative;
                    }
                    #pdf-content .no-scroll::-webkit-scrollbar {
                      display: none;
                    }
                    #pdf-content .no-scroll {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>
                  <table className="min-w-full text-xs">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="border-border w-20 border px-3 py-2 text-left">
                          No
                        </th>
                        <th className="border-border border px-3 py-2 text-left">
                          Kompetensi yang dilatihkan
                        </th>
                        <th className="border-border w-28 border px-3 py-2 text-left">
                          Nilai
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Bagian 1 */}
                      <tr>
                        <td className="border-border border px-3 py-2 align-top">
                          1
                        </td>
                        <td className="border-border border px-3 py-2">
                          <div className="font-medium">Kepribadian</div>
                          <ol className="mt-1 ml-4 list-decimal space-y-0.5">
                            <li>Disiplin</li>
                            <li>Kerja sama</li>
                            <li>Inisiatif</li>
                            <li>Kerajinan</li>
                            <li>Tanggung jawab</li>
                          </ol>
                        </td>
                        <td className="border border-border px-3 py-2 align-top">
                          <div>{(typeof final?.scores?.personality?.[0] === "number") ? String(final.scores.personality[0]) : "91"}</div>
                          <div>{(typeof final?.scores?.personality?.[1] === "number") ? String(final.scores.personality[1]) : "91"}</div>
                          <div>{(typeof final?.scores?.personality?.[2] === "number") ? String(final.scores.personality[2]) : "92"}</div>
                          <div>{(typeof final?.scores?.personality?.[3] === "number") ? String(final.scores.personality[3]) : "92"}</div>
                          <div>{(typeof final?.scores?.personality?.[4] === "number") ? String(final.scores.personality[4]) : "94"}</div>
                        </td>
                      </tr>

                      {/* Bagian 2 */}
                      <tr>
                        <td className="border-border border px-3 py-2 align-top">
                          2
                        </td>
                        <td className="border-border border px-3 py-2">
                          <div className="font-medium">Kompetensi kejuruan</div>
                          <ol className="mt-1 ml-4 list-decimal space-y-0.5">
                            <li>Penerapan K3LH</li>
                            <li>Merakit Komputer</li>
                            <li>Menginstalasi sistem operasi</li>
                            <li>Perakitan komputer</li>
                            <li>Perbaikan peripheral</li>
                            <li>Menginstal software jaringan</li>
                            <li>Perbaikan software jaringan</li>
                          </ol>
                        </td>
                        <td className="border border-border px-3 py-2 align-top">
                          <div>{(typeof final?.scores?.technical?.[0] === "number") ? String(final.scores.technical[0]) : "92"}</div>
                          <div>{(typeof final?.scores?.technical?.[1] === "number") ? String(final.scores.technical[1]) : "93"}</div>
                          <div>{(typeof final?.scores?.technical?.[2] === "number") ? String(final.scores.technical[2]) : "91"}</div>
                          <div>{(typeof final?.scores?.technical?.[3] === "number") ? String(final.scores.technical[3]) : "93"}</div>
                          <div>{(typeof final?.scores?.technical?.[4] === "number") ? String(final.scores.technical[4]) : "90"}</div>
                          <div>{(typeof final?.scores?.technical?.[5] === "number") ? String(final.scores.technical[5]) : "93"}</div>
                          <div>{(typeof final?.scores?.technical?.[6] === "number") ? String(final.scores.technical[6]) : "93"}</div>
                        </td>
                      </tr>

                      {/* Total & Rata-Rata */}
                      <tr>
                        <td
                          className="border-border border px-3 py-2 font-medium"
                          colSpan={2}
                        >
                          Total Nilai
                        </td>
                        <td className="border border-border px-3 py-2">{totalNilai}</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-3 py-2 font-medium" colSpan={2}>
                          Rata-Rata
                        </td>
                        <td className="border border-border px-3 py-2">{rataRata}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
