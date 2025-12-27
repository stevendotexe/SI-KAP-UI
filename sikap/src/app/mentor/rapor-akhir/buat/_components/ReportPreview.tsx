import Image from "next/image";
import {
  type CompetencyScore,
  type FormState,
  CATEGORY_LABELS,
} from "../_types";

interface ReportPreviewProps {
  formData: FormState;
  scores: CompetencyScore[];
  certificateData: {
    signerName: string;
    signerRole: string;
  };
}

export function ReportPreview({
  formData,
  scores,
  certificateData,
}: ReportPreviewProps) {
  const totalScore = scores.reduce((acc, s) => acc + s.score, 0);
  const averageScore =
    scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

  const groupedScores = scores.reduce(
    (acc, s) => {
      const cat = s.category || "Umum";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, typeof scores>,
  );

  const categoryOrder = ["personality", "technical"];
  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="relative overflow-auto border bg-white p-4 text-black shadow-sm sm:p-8">
      {/* Decorative corner borders */}
      <div className="absolute top-0 left-0 h-24 w-24 border-t-4 border-l-4 border-blue-500 sm:h-32 sm:w-32"></div>
      <div className="absolute top-0 right-0 h-24 w-24 border-t-4 border-r-4 border-blue-500 sm:h-32 sm:w-32"></div>
      <div className="absolute bottom-0 left-0 h-24 w-24 border-b-4 border-l-4 border-blue-500 sm:h-32 sm:w-32"></div>
      <div className="absolute right-0 bottom-0 h-24 w-24 border-r-4 border-b-4 border-blue-500 sm:h-32 sm:w-32"></div>

      {/* Main border */}
      <div className="border-2 border-gray-300 p-4 sm:p-8">
        {/* Header with logos */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="shrink-0">
            {formData.schoolLogoUrl ? (
              <Image
                src={formData.schoolLogoUrl}
                alt="Logo Sekolah"
                width={80}
                height={80}
                className="h-16 w-16 object-contain sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-500 sm:h-20 sm:w-20 sm:text-xs">
                Logo SMK
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-xl font-bold underline decoration-2 underline-offset-4 sm:text-3xl">
              DAFTAR NILAI
            </h1>
            <p className="mt-2 text-sm">Hasil Praktik Kerja Industri di :</p>
            <p className="text-sm font-semibold">{formData.companyName}</p>
            <p className="text-sm">Tahun Pelajaran {formData.academicYear}</p>
          </div>

          <div className="shrink-0">
            {formData.companyLogoUrl ? (
              <Image
                src={formData.companyLogoUrl}
                alt="Logo Perusahaan"
                width={160}
                height={80}
                className="h-16 w-auto object-contain sm:h-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-500 sm:h-20 sm:w-20 sm:text-xs">
                Logo Perusahaan
              </div>
            )}
          </div>
        </div>

        {/* Student Information */}
        <div className="mb-6 grid gap-1 text-sm">
          {[
            { label: "Nama Siswa", value: formData.studentName },
            { label: "Nomor Induk Siswa", value: formData.studentNis },
            { label: "Bidang Keahlian", value: formData.bidangKeahlian },
            { label: "Program Keahlian", value: formData.programKeahlian },
            {
              label: "Konsentrasi Keahlian",
              value: formData.konsentrasiKeahlian,
            },
          ].map((item) => (
            <div key={item.label} className="flex gap-2">
              <span className="w-40 font-medium">{item.label}</span>
              <span>:</span>
              <span>{item.value || "-"}</span>
            </div>
          ))}
        </div>

        {/* Scores Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full border-2 border-gray-800 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="w-12 border-2 border-gray-800 px-2 py-2 text-center">
                  NO
                </th>
                <th className="border-2 border-gray-800 px-3 py-2 text-center">
                  KOMPETENSI YANG DILATIHKAN
                </th>
                <th className="w-20 border-2 border-gray-800 px-2 py-2 text-center">
                  NILAI
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
                          <li key={s.competencyId}>{s.name}</li>
                        ))}
                      </ol>
                    </td>
                    <td className="border-2 border-gray-800 px-2 py-3 text-center align-top">
                      <div className="space-y-1">
                        <div className="font-semibold">&nbsp;</div>
                        {(groupedScores[cat] ?? []).map((s) => (
                          <div key={s.competencyId}>{s.score}</div>
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
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer with signature */}
        <div className="mt-8 flex justify-end">
          <div className="text-sm">
            <p className="text-right">
              {formData.place},{" "}
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="mt-1 text-right font-semibold">
              {certificateData.signerRole || "Pembimbing"}
            </p>
            <div className="mt-1 flex h-16 items-center justify-end text-right">
              {formData.mentorSignatureUrl && (
                <Image
                  src={formData.mentorSignatureUrl}
                  alt="Tanda Tangan"
                  width={96}
                  height={48}
                  className="h-12 object-contain"
                />
              )}
            </div>
            <p className="text-right font-semibold underline">
              {certificateData.signerName || formData.mentorName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
