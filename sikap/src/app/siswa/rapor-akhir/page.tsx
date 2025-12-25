"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { FileDown, FileImage, FileText, ChevronDown } from "lucide-react";
import { api } from "@/trpc/react";
import { useState, useRef } from "react";
// Using native img tags instead of Next.js Image for html-to-image compatibility

// Helper to convert number to Indonesian words (supports up to thousands)
function numberToWords(n: number): string {
  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
  ];
  const belasan = [
    "Sepuluh",
    "Sebelas",
    "Dua Belas",
    "Tiga Belas",
    "Empat Belas",
    "Lima Belas",
    "Enam Belas",
    "Tujuh Belas",
    "Delapan Belas",
    "Sembilan Belas",
  ];
  const puluhan = [
    "",
    "",
    "Dua Puluh",
    "Tiga Puluh",
    "Empat Puluh",
    "Lima Puluh",
    "Enam Puluh",
    "Tujuh Puluh",
    "Delapan Puluh",
    "Sembilan Puluh",
  ];

  if (n === 0) return "Nol";
  if (n < 10) return satuan[n] ?? "";
  if (n < 20) return belasan[n - 10] ?? "";
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${puluhan[tens]}${ones > 0 ? ` ${satuan[ones]}` : ""}`.trim();
  }
  if (n < 200) {
    const remainder = n - 100;
    return remainder === 0 ? "Seratus" : `Seratus ${numberToWords(remainder)}`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    return remainder === 0
      ? `${satuan[hundreds]} Ratus`
      : `${satuan[hundreds]} Ratus ${numberToWords(remainder)}`;
  }
  if (n < 2000) {
    const remainder = n - 1000;
    return remainder === 0 ? "Seribu" : `Seribu ${numberToWords(remainder)}`;
  }
  if (n < 10000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    return remainder === 0
      ? `${satuan[thousands]} Ribu`
      : `${satuan[thousands]} Ribu ${numberToWords(remainder)}`;
  }
  return String(n);
}

const CATEGORY_LABELS: Record<string, string> = {
  personality: "KEPRIBADIAN",
  technical: "KOMPETENSI KEJURUAN",
};

export default function RaporAkhirSiswaPage() {
  const [activeTab, setActiveTab] = useState("daftar-nilai");
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const {
    data: report,
    isLoading,
    error,
  } = api.finalReports.getStudentReport.useQuery();

  const handleExportImage = async (contentId: string, filename: string) => {
    const element = document.getElementById(contentId);
    if (!element) return alert("Element tidak ditemukan!");

    setIsExporting(true);
    try {
      // Add print class for desktop layout
      element.classList.add("print-mode");

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        width: 1000, // Fixed desktop width
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      element.classList.remove("print-mode");

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Gagal membuat gambar");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async (contentId: string, filename: string) => {
    const element = document.getElementById(contentId);
    if (!element) return alert("Element tidak ditemukan!");

    setIsExporting(true);
    try {
      // Add print class for desktop layout
      element.classList.add("print-mode");

      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        width: 1000,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      element.classList.remove("print-mode");

      // Create PDF with A4 size
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">
          Terjadi kesalahan saat memuat rapor: {error.message}
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h2 className="mb-2 text-xl font-semibold">Rapor Belum Tersedia</h2>
          <p className="text-muted-foreground">
            Rapor akhir Anda belum diterbitkan oleh pembimbing.
            <br />
            Silakan hubungi pembimbing Anda untuk informasi lebih lanjut.
          </p>
        </div>
      </div>
    );
  }

  // Group scores by category
  const groupedScores = (report.scores ?? []).reduce(
    (acc, s) => {
      const cat = s.competency?.category ?? "technical";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, typeof report.scores>,
  );

  const totalScore = (report.scores ?? []).reduce(
    (acc, s) => acc + Number(s.score ?? 0),
    0,
  );
  const averageScore =
    (report.scores?.length ?? 0) > 0
      ? Math.round(totalScore / (report.scores?.length ?? 1))
      : 0;

  const categoryOrder = ["personality", "technical"];
  const letters = ["A", "B", "C", "D", "E", "F"];

  // Format dates
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Calculate duration in months
  const calculateDuration = () => {
    if (!report.certificate?.startDate || !report.certificate?.endDate) {
      return 0;
    }

    const start = new Date(report.certificate.startDate);
    const end = new Date(report.certificate.endDate);
    return Math.max(
      0,
      (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()),
    );
  };

  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-muted/30 m-0 min-h-screen p-0">
      <style jsx global>{`
        .print-mode {
          width: 1000px !important;
          min-width: 1000px !important;
        }
        .print-mode * {
          font-size: inherit !important;
        }
      `}</style>

      <div className="m-0 w-full max-w-none p-0">
        <main className="space-y-6 p-5 pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-10 lg:pl-10">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Rapor Akhir
              </h1>
              <p className="text-muted-foreground">
                Laporan akhir praktik kerja industri Anda
              </p>
            </div>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="destructive"
                  className="h-9 px-4"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  {isExporting ? "Mengekspor..." : "Ekspor"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (activeTab === "daftar-nilai") {
                      void handleExportImage(
                        "daftar-nilai-content",
                        "Daftar_Nilai_PKL.png",
                      );
                    } else {
                      void handleExportImage(
                        "sertifikat-content",
                        "Sertifikat_PKL.png",
                      );
                    }
                  }}
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  Unduh sebagai Gambar (PNG)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (activeTab === "daftar-nilai") {
                      void handleExportPDF(
                        "daftar-nilai-content",
                        "Daftar_Nilai_PKL.pdf",
                      );
                    } else {
                      void handleExportPDF(
                        "sertifikat-content",
                        "Sertifikat_PKL.pdf",
                      );
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Unduh sebagai PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabs */}
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
              <section className="overflow-x-auto">
                <div
                  id="daftar-nilai-content"
                  ref={reportRef}
                  className="relative min-w-[800px] bg-white p-8 text-black sm:p-12"
                >
                  {/* Decorative corner borders */}
                  <div className="absolute top-0 left-0 h-32 w-32 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 h-32 w-32 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 h-32 w-32 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute right-0 bottom-0 h-32 w-32 border-r-4 border-b-4 border-blue-500"></div>

                  {/* Main border */}
                  <div className="border-2 border-gray-300 p-6 sm:p-8">
                    {/* Header with logos */}
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div className="shrink-0">
                        {report.schoolLogoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={report.schoolLogoUrl}
                            alt="Logo Sekolah"
                            crossOrigin="anonymous"
                            className="h-20 w-20 object-contain"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                            Logo SMK
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 text-center">
                        <h1 className="text-3xl font-bold underline decoration-2 underline-offset-4">
                          DAFTAR NILAI
                        </h1>
                        <p className="mt-2 text-sm">
                          Hasil Praktik Kerja Industri di :
                        </p>
                        <p className="text-sm font-semibold">
                          {report.companyName}
                        </p>
                        <p className="text-sm">
                          Tahun Pelajaran {report.academicYear}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {report.companyLogoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={report.companyLogoUrl}
                            alt="Logo Perusahaan"
                            crossOrigin="anonymous"
                            className="h-20 w-auto object-contain"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                            Logo
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Information */}
                    <div className="mb-6 grid gap-1 text-sm">
                      {[
                        { label: "Nama Siswa", value: report.studentName },
                        {
                          label: "Nomor Induk Siswa",
                          value: report.studentNis,
                        },
                        {
                          label: "Bidang Keahlian",
                          value: report.bidangKeahlian,
                        },
                        {
                          label: "Program Keahlian",
                          value: report.programKeahlian,
                        },
                        {
                          label: "Konsentrasi Keahlian",
                          value: report.konsentrasiKeahlian,
                        },
                      ].map((item) => (
                        <div key={item.label} className="flex gap-2">
                          <span className="w-48 font-medium">{item.label}</span>
                          <span>:</span>
                          <span>{item.value ?? "-"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Scores Table */}
                    <div className="mb-8">
                      <table className="w-full border-2 border-gray-800 text-sm">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="w-12 border-2 border-gray-800 px-2 py-2 text-center">
                              NO
                            </th>
                            <th className="border-2 border-gray-800 px-3 py-2 text-center">
                              KOMPETENSI YANG DILATIHKAN
                            </th>
                            <th
                              className="border-2 border-gray-800 px-2 py-2 text-center"
                              colSpan={2}
                            >
                              NILAI
                            </th>
                          </tr>
                          <tr className="bg-gray-100">
                            <th className="border-2 border-gray-800 px-2 py-2"></th>
                            <th className="border-2 border-gray-800 px-3 py-2"></th>
                            <th className="w-20 border-2 border-gray-800 px-2 py-2 text-center">
                              ANGKA
                            </th>
                            <th className="w-48 border-2 border-gray-800 px-2 py-2 text-center">
                              HURUF
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryOrder
                            .filter((cat) => groupedScores[cat])
                            .map((cat, catIdx) => (
                              <tr key={cat}>
                                <td className="border-2 border-gray-800 px-2 py-3 text-center align-top font-semibold">
                                  {letters[catIdx]}
                                </td>
                                <td className="border-2 border-gray-800 px-3 py-3">
                                  <div className="mb-2 font-semibold">
                                    {CATEGORY_LABELS[cat] ?? cat}
                                  </div>
                                  <ol className="ml-5 list-decimal space-y-1">
                                    {(groupedScores[cat] ?? []).map((s) => (
                                      <li key={s.id}>
                                        {s.competency?.name ?? "-"}
                                      </li>
                                    ))}
                                  </ol>
                                </td>
                                <td className="border-2 border-gray-800 px-2 py-3 text-center align-top">
                                  <div className="space-y-1">
                                    <div className="font-semibold">&nbsp;</div>
                                    {(groupedScores[cat] ?? []).map((s) => (
                                      <div key={s.id}>
                                        {Number(s.score ?? 0)}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="border-2 border-gray-800 px-2 py-3 align-top">
                                  <div className="space-y-1">
                                    <div className="font-semibold">&nbsp;</div>
                                    {(groupedScores[cat] ?? []).map((s) => (
                                      <div key={s.id}>
                                        {numberToWords(Number(s.score ?? 0))}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          <tr>
                            <td
                              className="border-2 border-gray-800 px-2 py-2 text-center font-semibold"
                              colSpan={2}
                            >
                              JUMLAH
                            </td>
                            <td className="border-2 border-gray-800 px-2 py-2 text-center font-semibold">
                              {totalScore}
                            </td>
                            <td className="border-2 border-gray-800 px-2 py-2 font-semibold">
                              {numberToWords(totalScore)}
                            </td>
                          </tr>
                          <tr>
                            <td
                              className="border-2 border-gray-800 px-2 py-2 text-center font-semibold"
                              colSpan={2}
                            >
                              RATA-RATA
                            </td>
                            <td className="border-2 border-gray-800 px-2 py-2 text-center font-semibold">
                              {averageScore}
                            </td>
                            <td className="border-2 border-gray-800 px-2 py-2 font-semibold">
                              {numberToWords(averageScore)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Footer with signature */}
                    <div className="mt-8 flex justify-end">
                      <div className="text-sm">
                        <p className="text-right">
                          {report.place}, {currentDate}
                        </p>
                        <p className="mt-1 text-right font-semibold">
                          {report.certificate?.signerRole ?? "Pembimbing"}
                        </p>
                        <div className="mt-1 flex h-16 items-center justify-end text-right">
                          {report.mentorSignatureUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={report.mentorSignatureUrl}
                              alt="Tanda Tangan"
                              crossOrigin="anonymous"
                              className="h-12 object-contain"
                            />
                          )}
                        </div>
                        <p className="text-right font-semibold underline">
                          {report.certificate?.signerName ?? report.mentorName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* Tab 2: Sertifikat */}
            <TabsContent value="sertifikat" className="mt-4">
              <section className="overflow-x-auto">
                <div
                  id="sertifikat-content"
                  ref={certRef}
                  className="relative min-w-[800px] bg-white p-8 text-black sm:p-12"
                >
                  {/* Decorative corner borders */}
                  <div className="absolute top-0 left-0 h-32 w-32 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 h-32 w-32 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 h-32 w-32 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute right-0 bottom-0 h-32 w-32 border-r-4 border-b-4 border-blue-500"></div>

                  {/* Main border */}
                  <div className="border-2 border-gray-300 p-6 sm:p-8">
                    {/* Header with logos */}
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div className="shrink-0">
                        {report.schoolLogoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={report.schoolLogoUrl}
                            alt="Logo Sekolah"
                            crossOrigin="anonymous"
                            className="h-20 w-auto object-contain"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                            Logo SMK
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 text-center">
                        <h1 className="text-3xl font-bold underline decoration-2 underline-offset-4">
                          SERTIFIKAT
                        </h1>
                        <p className="mt-2 text-sm">
                          Nomor : {report.certificateNumber}
                        </p>
                        <p className="mt-1 text-sm font-semibold uppercase">
                          {report.companyName}
                        </p>
                        <p className="text-sm">menerangkan bahwa :</p>
                      </div>

                      <div className="shrink-0">
                        {report.companyLogoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={report.companyLogoUrl}
                            alt="Logo Perusahaan"
                            crossOrigin="anonymous"
                            className="h-20 w-auto object-contain"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                            Logo
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Name - Large */}
                    <div className="my-8 text-center">
                      <h2 className="text-4xl font-bold uppercase italic">
                        {report.studentName}
                      </h2>
                      <p className="mt-2 text-sm">
                        Siswa Tingkat {report.studentGrade} {report.schoolName}
                      </p>
                    </div>

                    {/* Certificate Details */}
                    <div className="mb-6 grid gap-1 text-sm">
                      {[
                        {
                          label: "Bidang Keahlian",
                          value: report.bidangKeahlian,
                        },
                        {
                          label: "Program Keahlian",
                          value: report.programKeahlian,
                        },
                        {
                          label: "Konsentrasi Keahlian",
                          value: report.konsentrasiKeahlian,
                        },
                        {
                          label: "Nomor Induk Siswa",
                          value: report.studentNis,
                        },
                      ].map((item) => (
                        <div key={item.label} className="flex gap-2">
                          <span className="w-48 font-medium">{item.label}</span>
                          <span>:</span>
                          <span>{item.value ?? "-"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Certificate Statement */}
                    <div className="my-8 text-center text-sm leading-relaxed">
                      <p>
                        Telah melaksanakan implementasi mata pelajaran Praktik
                        Kerja Industri (PKL) di{" "}
                        <strong>{report.companyName}</strong>
                      </p>
                      <p className="mt-1">
                        selama {calculateDuration()} bulan, mulai tanggal{" "}
                        {formatDate(report.certificate?.startDate)} s.d.{" "}
                        {formatDate(report.certificate?.endDate)}, dengan
                        predikat:
                      </p>
                    </div>

                    {/* Predicate */}
                    <div className="my-8 text-center">
                      <h3 className="inline-block px-8 py-1 text-3xl font-bold">
                        {report.certificate?.predicate ?? "BAIK"}
                      </h3>
                    </div>

                    {/* Signature */}
                    <div className="mt-12 flex justify-end">
                      <div className="text-center text-sm">
                        <p>
                          {report.place}, {currentDate}
                        </p>
                        <p className="mt-1 font-semibold">
                          {report.certificate?.signerRole ?? "Pembimbing"}
                        </p>
                        <div className="flex h-16 items-center justify-center">
                          {report.mentorSignatureUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={report.mentorSignatureUrl}
                              alt="Tanda Tangan"
                              crossOrigin="anonymous"
                              className="mx-auto h-12 object-contain"
                            />
                          )}
                        </div>
                        <p className="text-base font-semibold uppercase underline">
                          {report.certificate?.signerName ?? report.mentorName}
                        </p>
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
