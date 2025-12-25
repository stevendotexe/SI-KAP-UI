import type { FormState, CertificateState } from "../_types";

interface ConfirmationStepProps {
  formData: FormState;
  certificateData: CertificateState;
  totalScore: number;
  averageScore: number;
  durationMonths: number;
}

export function ConfirmationStep({
  formData,
  certificateData,
  totalScore,
  averageScore,
  durationMonths,
}: ConfirmationStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Konfirmasi & Terbitkan</h2>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
        <p className="font-medium">Peringatan</p>
        <p className="mt-1 text-sm">
          Setelah diterbitkan, rapor dan sertifikat akan dapat dilihat oleh
          siswa. Pastikan semua data sudah benar sebelum melanjutkan.
        </p>
      </div>
      <div className="bg-muted/20 grid gap-3 rounded-lg border p-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground">Siswa</p>
            <p className="font-medium">
              {formData.studentName} ({formData.studentNis})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Sekolah</p>
            <p className="font-medium">{formData.schoolName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Perusahaan</p>
            <p className="font-medium">{formData.companyName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Durasi</p>
            <p className="font-medium">{durationMonths} bulan</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Nilai</p>
            <p className="font-medium text-blue-600">{totalScore}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rata-rata Nilai</p>
            <p className="font-medium text-blue-600">{averageScore}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Predikat Akhir</p>
            <p className="font-medium text-green-600">
              {certificateData.predicate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
