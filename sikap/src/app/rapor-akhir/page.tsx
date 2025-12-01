"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function RaporAkhirPage() {
  const handleDownload = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) return alert("Element PNG tidak ditemukan!");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = "Rapor_Akhir_Praktik_Kerja_Lapangan.png";
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Gagal membuat PNG");
    }
  };

  return (
    <div className="bg-muted/30 m-0 min-h-screen p-0">
      <div className="m-0 w-full max-w-none p-0">
        <main className="space-y-6 p-0 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Rapor Akhir
              </h1>
              <p className="text-muted-foreground">Laporan akhir kerja Anda</p>
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

              {/* A. Identitas Siswa */}
              <div className="mt-6">
                <div className="font-semibold">A. Identitas Siswa</div>

                <div className="mt-4 grid grid-cols-1 gap-x-20 gap-y-3 text-sm md:grid-cols-2">
                  {/* Kiri */}
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">Nama</div>
                      <div>Rafif Zharif</div>
                    </div>
                    <div>
                      <div className="font-medium">Tempat, tanggal lahir</div>
                      <div>Bandung, 12 september 2005</div>
                    </div>
                    <div>
                      <div className="font-medium">Semester</div>
                      <div>6</div>
                    </div>
                    <div>
                      <div className="font-medium">Asal Sekolah</div>
                      <div>SMK 1 Tasikmalaya</div>
                    </div>
                  </div>

                  {/* Kanan */}
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">NIS</div>
                      <div>234658594</div>
                    </div>
                    <div>
                      <div className="font-medium">Jenis kelamin</div>
                      <div>Laki-laki</div>
                    </div>
                    <div>
                      <div className="font-medium">Kompetensi Keahlian</div>
                      <div>Teknik Komputer & jaringan</div>
                    </div>
                    <div>
                      <div className="font-medium">No telp</div>
                      <div>0812344556677</div>
                    </div>
                  </div>

                  {/* Alamat full width */}
                  <div className="mt-2 md:col-span-2">
                    <div className="font-medium">Alamat</div>
                    <div>Jl Pendidikan No. 20</div>
                  </div>
                </div>
              </div>

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
                        <td className="border-border border px-3 py-2 align-top">
                          <div>91</div>
                          <div>91</div>
                          <div>92</div>
                          <div>92</div>
                          <div>94</div>
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
                        <td className="border-border border px-3 py-2 align-top">
                          <div>92</div>
                          <div>93</div>
                          <div>91</div>
                          <div>93</div>
                          <div>90</div>
                          <div>93</div>
                          <div>93</div>
                        </td>
                      </tr>

                      {/* Total & Rata-rata */}
                      <tr>
                        <td
                          className="border-border border px-3 py-2 font-medium"
                          colSpan={2}
                        >
                          Total Nilai
                        </td>
                        <td className="border-border border px-3 py-2">1105</td>
                      </tr>
                      <tr>
                        <td
                          className="border-border border px-3 py-2 font-medium"
                          colSpan={2}
                        >
                          Rata-rata
                        </td>
                        <td className="border-border border px-3 py-2">92</td>
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
