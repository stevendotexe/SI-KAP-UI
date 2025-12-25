import Image from "next/image";
import type { FormState, CertificateState } from "../_types";

interface CertificatePreviewProps {
  formData: FormState;
  certificateData: CertificateState;
  durationMonths: number;
}

export function CertificatePreview({
  formData,
  certificateData,
  durationMonths,
}: CertificatePreviewProps) {
  const certificateNumber = `${String(certificateData.sequenceNumber).padStart(3, "0")}/${certificateData.companyCode}/PKL/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

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
                width={120}
                height={80}
                className="h-12 w-auto object-contain sm:h-20"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-500 sm:h-20 sm:w-20 sm:text-xs">
                Logo SMK
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-xl font-bold underline decoration-2 underline-offset-4 sm:text-3xl">
              SERTIFIKAT
            </h1>
            <p className="mt-2 text-xs sm:text-sm">
              Nomor : {certificateNumber}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase sm:text-sm">
              {formData.companyName}
            </p>
            <p className="text-xs sm:text-sm">menerangkan bahwa :</p>
          </div>

          <div className="shrink-0">
            {formData.companyLogoUrl ? (
              <Image
                src={formData.companyLogoUrl}
                alt="Logo Perusahaan"
                width={120}
                height={80}
                className="h-12 w-auto object-contain sm:h-20"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-500 sm:h-20 sm:w-20 sm:text-xs">
                Logo
              </div>
            )}
          </div>
        </div>

        {/* Student Name - Large */}
        <div className="my-8 text-center">
          <h2 className="text-2xl font-bold uppercase italic sm:text-4xl">
            {formData.studentName}
          </h2>
          <p className="mt-2 text-sm">
            Siswa Tingkat {formData.studentGrade} {formData.schoolName}
          </p>
        </div>

        {/* Certificate Details */}
        <div className="mb-6 grid gap-1 text-sm">
          {[
            { label: "Bidang Keahlian", value: formData.bidangKeahlian },
            { label: "Program Keahlian", value: formData.programKeahlian },
            {
              label: "Konsentrasi Keahlian",
              value: formData.konsentrasiKeahlian,
            },
            { label: "Nomor Induk Siswa", value: formData.studentNis },
          ].map((item) => (
            <div key={item.label} className="flex gap-2">
              <span className="w-48 font-medium">{item.label}</span>
              <span>:</span>
              <span>{item.value || "-"}</span>
            </div>
          ))}
        </div>

        {/* Certificate Statement */}
        <div className="my-8 text-center text-sm leading-relaxed">
          <p>
            Telah melaksanakan implementasi mata pelajaran Praktik Kerja
            Industri (PKL) di <strong>{formData.companyName}</strong>
          </p>
          <p className="mt-1">
            selama {durationMonths} bulan, mulai tanggal{" "}
            {certificateData.startDate
              ? new Date(certificateData.startDate).toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  },
                )
              : "-"}{" "}
            s.d.{" "}
            {certificateData.endDate
              ? new Date(certificateData.endDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "-"}
            , dengan predikat:
          </p>
        </div>

        {/* Predicate */}
        <div className="my-8 text-center">
          <h3 className="inline-block px-8 py-1 text-2xl font-bold sm:text-3xl">
            {certificateData.predicate}
          </h3>
        </div>

        {/* Signature */}
        <div className="mt-12 flex justify-end">
          <div className="text-center text-sm">
            <p>
              {formData.place},{" "}
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="mt-1 font-semibold">{certificateData.signerRole}</p>
            <div className="flex h-16 items-center justify-center">
              {formData.mentorSignatureUrl && (
                <Image
                  src={formData.mentorSignatureUrl}
                  alt="Tanda Tangan"
                  width={200}
                  height={48}
                  className="mx-auto h-12 object-contain"
                />
              )}
            </div>
            <p className="text-base font-semibold uppercase underline">
              {certificateData.signerName || formData.mentorName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
