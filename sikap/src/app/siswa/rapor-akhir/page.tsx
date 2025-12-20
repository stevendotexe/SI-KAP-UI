"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown } from "lucide-react";
import { api } from "@/trpc/react";
import { useState } from "react";

export default function RaporAkhirPage() {
  const [activeTab, setActiveTab] = useState("daftar-nilai");

  const handleDownload = async (contentId: string, filename: string) => {
    const element = document.getElementById(contentId);
    if (!element) return alert("Element PNG tidak ditemukan!");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Gagal membuat PNG");
    }
  };

  // TODO: Enable these queries when the backend endpoints are ready
  // For now, we disable them to prevent console errors
  const { data: profile, isLoading: loadingProfile } = api.students.me.useQuery(
    undefined,
    {
      retry: 0,
    },
  );

  // TODO: Create a student final report endpoint when needed
  // For now, use placeholder values
  const loadingFinal = false;

  const place =
    typeof profile?.birthPlace === "string" && profile.birthPlace.length
      ? profile.birthPlace
      : "Bandung";
  const bdRaw = profile?.birthDate;
  const bd = bdRaw ? new Date(String(bdRaw)) : undefined;
  const birthDateStr =
    bd && !isNaN(bd.getTime())
      ? new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(bd)
      : "12 September 2005";

  const kompetensi =
    typeof profile?.major === "string" && profile.major.length
      ? profile.major
      : "Teknik Komputer dan Jaringan";

  // Placeholder values - will be replaced when backend endpoint is created
  const totalNilai = "1.102";
  const rataRata = "92";

  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-muted/30 m-0 min-h-screen p-0">
      <div className="m-0 w-full max-w-none p-0">
        <main className="space-y-6 p-5 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Rapor Akhir
              </h1>
              <p className="text-muted-foreground">
                {loadingProfile || loadingFinal
                  ? "Memuat..."
                  : "Laporan akhir kerja Anda"}
              </p>
            </div>
            <Button
              variant="destructive"
              className="h-9 px-4"
              onClick={() => {
                if (activeTab === "daftar-nilai") {
                  void handleDownload(
                    "daftar-nilai-content",
                    "Daftar_Nilai_PKL.png",
                  );
                } else {
                  void handleDownload(
                    "sertifikat-content",
                    "Sertifikat_PKL.png",
                  );
                }
              }}
            >
              <FileDown className="size-4" />
              <span className="ml-2">Cetak PNG</span>
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="daftar-nilai">Daftar Nilai</TabsTrigger>
              <TabsTrigger value="sertifikat">Sertifikat</TabsTrigger>
            </TabsList>

            {/* Tab 1: Daftar Nilai */}
            <TabsContent value="daftar-nilai" className="mt-4">
              <section>
                <div
                  id="daftar-nilai-content"
                  className="relative bg-white p-8 sm:p-12"
                >
                  {/* Decorative corner borders */}
                  <div className="absolute top-0 left-0 h-32 w-32 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 h-32 w-32 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 h-32 w-32 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute right-0 bottom-0 h-32 w-32 border-r-4 border-b-4 border-blue-500"></div>

                  {/* Main border */}
                  <div className="border-2 border-gray-300 p-6 sm:p-8">
                    {/* Header with logos */}
                    <div className="mb-6 grid grid-cols-3 items-center gap-4">
                      {/* Left - Logo SMK placeholder */}
                      <div className="flex justify-start">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                          Logo SMK
                        </div>
                      </div>

                      {/* Center title */}
                      <div className="text-center">
                        <h1 className="text-lg font-bold whitespace-nowrap underline decoration-2 underline-offset-4 sm:text-3xl">
                          DAFTAR NILAI
                        </h1>
                        <p className="mt-2 text-sm">
                          Hasil Praktik Kerja Industri di :
                        </p>
                        <p className="text-sm font-semibold">
                          Pusat Laptop Tasik (CV. AZZAHRA PUTRI)
                        </p>
                        <p className="text-sm">Tahun Pelajaran 2025/2026</p>
                      </div>

                      {/* Right - Company Logo */}
                      <div className="flex justify-end">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logo.png"
                          alt="Logo"
                          width={176}
                          height={176}
                          className="h-44 w-auto object-contain"
                        />
                      </div>
                    </div>

                    {/* Student Information */}
                    <div className="mb-6 text-sm">
                      <div className="grid gap-2">
                        <div className="grid grid-cols-[auto_auto_1fr] gap-x-2">
                          <span className="font-medium">Nama Siswa</span>
                          <span>:</span>
                          <span>
                            {typeof profile?.name === "string" &&
                            profile.name.length
                              ? profile.name
                              : "EGI ADITIA"}
                          </span>
                        </div>
                        <div className="grid grid-cols-[auto_auto_1fr] gap-x-2">
                          <span className="font-medium">Nomor Induk Siswa</span>
                          <span>:</span>
                          <span>
                            {typeof profile?.nis === "string" &&
                            profile.nis.length
                              ? profile.nis
                              : "2324312076"}
                          </span>
                        </div>
                        <div className="grid grid-cols-[auto_auto_1fr] gap-x-2">
                          <span className="font-medium">Program Keahlian</span>
                          <span>:</span>
                          <span>{kompetensi}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scores Table */}
                    <div className="mb-8 overflow-x-auto">
                      <table className="w-full min-w-[640px] border-2 border-gray-800 text-sm">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="w-16 border-2 border-gray-800 px-3 py-2 text-center">
                              NO
                            </th>
                            <th className="border-2 border-gray-800 px-3 py-2 text-center">
                              KOMPETENSI YANG DILATIHKAN
                            </th>
                            <th
                              className="border-2 border-gray-800 px-3 py-2 text-center"
                              colSpan={2}
                            >
                              NILAI
                            </th>
                          </tr>
                          <tr className="bg-gray-100">
                            <th className="border-2 border-gray-800 px-3 py-2"></th>
                            <th className="border-2 border-gray-800 px-3 py-2"></th>
                            <th className="w-24 border-2 border-gray-800 px-3 py-2 text-center">
                              ANGKA
                            </th>
                            <th className="w-40 border-2 border-gray-800 px-3 py-2 text-center">
                              HURUF
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Kepribadian Section */}
                          <tr>
                            <td className="border-2 border-gray-800 px-3 py-3 text-center align-top font-semibold">
                              A
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-3">
                              <div className="mb-2 font-semibold">
                                KEPRIBADIAN
                              </div>
                              <ol className="ml-5 list-decimal space-y-1">
                                <li>Disiplin</li>
                                <li>Kerja sama</li>
                                <li>Inisiatif</li>
                                <li>Kerajinan</li>
                                <li>Tanggung jawab</li>
                              </ol>
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-3 text-center align-top">
                              <div className="space-y-1">
                                <div>92</div>
                                <div>91</div>
                                <div>92</div>
                                <div>93</div>
                                <div>91</div>
                              </div>
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-3 align-top">
                              <div className="space-y-1">
                                <div>Sembilan Puluh Dua</div>
                                <div>Sembilan Puluh Satu</div>
                                <div>Sembilan Puluh Dua</div>
                                <div>Sembilan Puluh Tiga</div>
                                <div>Sembilan Puluh Satu</div>
                              </div>
                            </td>
                          </tr>

                          {/* Kompetensi Kejuruan Section */}
                          <tr>
                            <td className="border-2 border-gray-800 px-3 py-3 text-center align-top font-semibold">
                              B
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-3">
                              <div className="mb-2 font-semibold">
                                KOMPETENSI KEJURUAN
                              </div>
                              <ol className="ml-5 list-decimal space-y-1">
                                <li>Penerapan K3LH</li>
                                <li>Merakit Komputer</li>
                                <li>
                                  Menginstalasi sistem operasi dan driver
                                  komputer dan aplikasi peralatan
                                </li>
                                <li>Perakitan dan komputer</li>
                                <li>Perbaikan peripheral peralatan</li>
                                <li>
                                  Menginstal hardware dan software jaringan
                                </li>
                                <li>
                                  Perbaikan dan peralatan hardware dan software
                                  jaringan
                                </li>
                              </ol>
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-3 text-center align-top">
                              <div className="space-y-1">
                                <div>92</div>
                                <div>93</div>
                                <div>91</div>
                                <div>93</div>
                                <div>91</div>
                                <div>93</div>
                                <div>92</div>
                              </div>
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-3 align-top">
                              <div className="space-y-1">
                                <div>Sembilan Puluh Dua</div>
                                <div>Sembilan Puluh Tiga</div>
                                <div>Sembilan Puluh Satu</div>
                                <div>Sembilan Puluh Tiga</div>
                                <div>Sembilan Puluh Satu</div>
                                <div>Sembilan Puluh Tiga</div>
                                <div>Sembilan Puluh Dua</div>
                              </div>
                            </td>
                          </tr>

                          {/* Total */}
                          <tr>
                            <td
                              className="border-2 border-gray-800 px-3 py-2 text-center font-semibold"
                              colSpan={2}
                            >
                              JUMLAH
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-2 text-center font-semibold">
                              {totalNilai}
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-2 font-semibold">
                              Seribu Seratus Dua
                            </td>
                          </tr>

                          {/* Average */}
                          <tr>
                            <td
                              className="border-2 border-gray-800 px-3 py-2 text-center font-semibold"
                              colSpan={2}
                            >
                              RATA-RATA
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-2 text-center font-semibold">
                              {rataRata}
                            </td>
                            <td className="border-2 border-gray-800 px-3 py-2 font-semibold">
                              Sembilan Puluh Dua
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Footer with signature */}
                    <div className="mt-8 grid grid-cols-2 gap-8">
                      {/* Left: Empty space */}
                      <div className="flex items-center justify-center">
                        {/* Removed trophy decoration */}
                      </div>

                      {/* Right: Signature area */}
                      <div className="text-sm">
                        <div className="mb-12 text-right">
                          <p>Tasikmalaya, {currentDate}</p>
                          <p className="mt-1 font-semibold">Pembimbing</p>
                        </div>
                        <div className="mt-16 text-right">
                          <p className="font-semibold underline">
                            Yang Bersangkutan, A.Md
                          </p>
                          <p className="mt-1 text-xs">CV. AZZAHRA PUTRI</p>
                          <p className="text-xs italic">
                            Pusat Laptop & IT Solution
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* Tab 2: Sertifikat */}
            <TabsContent value="sertifikat" className="mt-4">
              <section>
                <div
                  id="sertifikat-content"
                  className="relative bg-white p-8 sm:p-12"
                >
                  {/* Decorative corner borders */}
                  <div className="absolute top-0 left-0 h-32 w-32 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 h-32 w-32 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 h-32 w-32 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute right-0 bottom-0 h-32 w-32 border-r-4 border-b-4 border-blue-500"></div>

                  {/* Main border */}
                  <div className="border-2 border-gray-300 p-6 sm:p-8">
                    {/* Header with logos */}
                    <div className="mb-6 grid grid-cols-3 items-center gap-1 sm:gap-4">
                      {/* Left logo */}
                      <div className="flex justify-start overflow-hidden">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-500 sm:h-20 sm:w-20 sm:text-xs">
                          Logo SMK
                        </div>
                      </div>

                      {/* Center title */}
                      <div className="min-w-0 text-center">
                        <h1 className="text-lg font-bold whitespace-nowrap underline decoration-2 underline-offset-4 sm:text-3xl">
                          SERTIFIKAT
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm">
                          Nomor : 024/PUSAT-LAPTOP/PKL/10/2025
                        </p>
                        <p className="mt-1 text-xs sm:text-sm">
                          Pusat Laptop Tasik (CV. AZZAHRA PUTRI)
                        </p>
                        <p className="text-xs sm:text-sm">
                          menerangkan bahwa :
                        </p>
                      </div>

                      {/* Right logo */}
                      <div className="flex justify-end overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logo.png"
                          alt="Logo"
                          width={176}
                          height={176}
                          className="h-12 w-auto flex-shrink-0 object-contain sm:h-44"
                        />
                      </div>
                    </div>

                    {/* Student Name - Large */}
                    <div className="my-8 text-center">
                      <h2 className="text-3xl font-bold italic sm:text-4xl">
                        {typeof profile?.name === "string" &&
                        profile.name.length
                          ? profile.name
                          : "Egi Aditia"}
                      </h2>
                      <p className="mt-2 text-sm">
                        Siswa Tingkat XII (Dua Belas) SMKN Parungponteng
                      </p>
                    </div>

                    {/* Certificate Details */}
                    <div className="mb-6 space-y-2 text-sm">
                      <div className="flex">
                        <span className="w-56 font-medium">
                          Bidang Keahlian
                        </span>
                        <span className="mr-2">:</span>
                        <span>Teknologi Informasi</span>
                      </div>
                      <div className="flex">
                        <span className="w-56 font-medium">
                          Program Keahlian
                        </span>
                        <span className="mr-2">:</span>
                        <span>Teknik Jaringan Komputer dan Telekomunikasi</span>
                      </div>
                      <div className="flex">
                        <span className="w-56 font-medium">
                          Konsentrasi Keahlian
                        </span>
                        <span className="mr-2">:</span>
                        <span>Teknik Komputer dan Jaringan</span>
                      </div>
                      <div className="flex">
                        <span className="w-56 font-medium">
                          Nomor Induk Siswa
                        </span>
                        <span className="mr-2">:</span>
                        <span>
                          {typeof profile?.nis === "string" &&
                          profile.nis.length
                            ? profile.nis
                            : "2324312076"}
                        </span>
                      </div>
                    </div>

                    {/* Certificate Statement */}
                    <div className="my-8 text-center text-sm">
                      <p>
                        Telah melaksanakan implementasi mata pelajaran Praktik
                        Kerja Industri (PKL) di Pusat Laptop Tasik
                      </p>
                      <p className="mt-1">
                        selama 3 bulan, mulai tanggal 1 Juli 2025 s.d. 30
                        September 2025, dengan predikat:
                      </p>
                    </div>

                    {/* Predicate */}
                    <div className="my-8 text-center">
                      <h3 className="text-3xl font-bold">BAIK</h3>
                    </div>

                    {/* Signature */}
                    <div className="mt-12 flex justify-end">
                      <div className="text-center text-sm">
                        <p>Tasikmalaya, {currentDate}</p>
                        <p className="mt-1 font-semibold">Pembimbing</p>
                        <div className="h-20"></div>
                        <p className="font-semibold underline">
                          Yadi Herdiaman, A.Md
                        </p>
                        <p className="mt-1 text-xs">CV. AZZAHRA PUTRI</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
