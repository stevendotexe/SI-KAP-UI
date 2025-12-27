import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormState } from "../_types";

interface StudentInfoStepProps {
  formData: FormState;
  updateFormField: (field: keyof FormState, value: string) => void;
  reportId: number | null;
  setIsUploading: (isLoading: boolean) => void;
}

export function StudentInfoStep({
  formData,
  updateFormField,
  reportId,
  setIsUploading,
}: StudentInfoStepProps) {
  const schoolLogoValue = useMemo(
    () => (formData.schoolLogoUrl ? [{ url: formData.schoolLogoUrl }] : []),
    [formData.schoolLogoUrl],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Informasi Siswa</h2>
      <div className="grid max-w-md gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Siswa</label>
          <Input value={formData.studentName} readOnly className="bg-muted" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">NIS</label>
          <Input value={formData.studentNis} readOnly className="bg-muted" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Sekolah</label>
          <Input
            value={formData.schoolName}
            onChange={(e) => updateFormField("schoolName", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tingkat</label>
          <Select
            value={formData.studentGrade}
            onValueChange={(v) => updateFormField("studentGrade", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["X (Sepuluh)", "XI (Sebelas)", "XII (Dua Belas)"].map(
                (grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
        {[
          {
            field: "studentMajor",
            label: "Jurusan / Program Keahlian",
            placeholder: "Rekayasa Perangkat Lunak",
          },
          {
            field: "bidangKeahlian",
            label: "Bidang Keahlian",
            placeholder: "Teknologi Informasi",
          },
          {
            field: "programKeahlian",
            label: "Program Keahlian",
            placeholder: "Teknik Komputer dan Informatika",
          },
          {
            field: "konsentrasiKeahlian",
            label: "Konsentrasi Keahlian",
            placeholder: "Pengembangan Perangkat Lunak dan Gim",
          },
          {
            field: "academicYear",
            label: "Tahun Pelajaran",
            placeholder: "2024/2025",
          },
        ].map((item) => (
          <div key={item.field}>
            <label className="mb-1 block text-sm font-medium">
              {item.label}
            </label>
            <Input
              value={formData[item.field as keyof FormState] || ""}
              onChange={(e) =>
                updateFormField(item.field as keyof FormState, e.target.value)
              }
              placeholder={item.placeholder}
            />
          </div>
        ))}
        <FileUploadField
          ownerType="final_report"
          ownerId={reportId}
          label="Logo Sekolah"
          description="Upload logo sekolah siswa"
          accept="image/*"
          value={schoolLogoValue}
          onChange={(files) => {
            updateFormField("schoolLogoUrl", files[0]?.url ?? "");
          }}
          onLoading={setIsUploading}
        />
      </div>
    </div>
  );
}
