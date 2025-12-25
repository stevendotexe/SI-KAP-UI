import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";
import type { FormState } from "../_types";

interface CompanyInfoStepProps {
  formData: FormState;
  updateFormField: (field: keyof FormState, value: string) => void;
  reportId: number | null;
  setIsUploading: (isLoading: boolean) => void;
}

export function CompanyInfoStep({
  formData,
  updateFormField,
  reportId,
  setIsUploading,
}: CompanyInfoStepProps) {
  const companyLogoValue = useMemo(
    () => (formData.companyLogoUrl ? [{ url: formData.companyLogoUrl }] : []),
    [formData.companyLogoUrl],
  );

  const mentorSignatureValue = useMemo(
    () =>
      formData.mentorSignatureUrl ? [{ url: formData.mentorSignatureUrl }] : [],
    [formData.mentorSignatureUrl],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Informasi Perusahaan</h2>
      <div className="grid max-w-md gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Nama Perusahaan
          </label>
          <Input
            value={formData.companyName}
            onChange={(e) => updateFormField("companyName", e.target.value)}
            placeholder="CV. AZZAHRA PUTRI"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Nama Pembimbing
          </label>
          <Input
            value={formData.mentorName}
            onChange={(e) => updateFormField("mentorName", e.target.value)}
            placeholder="Nama Pembimbing"
          />
        </div>
        <FileUploadField
          ownerType="final_report"
          ownerId={reportId}
          label="Logo Perusahaan"
          description="Upload logo perusahaan (opsional)"
          accept="image/*"
          value={companyLogoValue}
          onChange={(files) => {
            updateFormField("companyLogoUrl", files[0]?.url ?? "");
          }}
          onLoading={setIsUploading}
        />
        <FileUploadField
          ownerType="final_report"
          ownerId={reportId}
          label="Tanda Tangan Pembimbing"
          description="Upload tanda tangan digital pembimbing"
          accept="image/*"
          value={mentorSignatureValue}
          onChange={(files) => {
            updateFormField("mentorSignatureUrl", files[0]?.url ?? "");
          }}
          onLoading={setIsUploading}
        />
      </div>
    </div>
  );
}
