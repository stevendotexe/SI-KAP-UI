import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CertificateState, FormState } from "../_types";
import { CertificatePreview } from "./CertificatePreview";

interface CertificateInfoStepProps {
  formData: FormState;
  certificateData: CertificateState;
  updateCertificateField: (field: keyof CertificateState, value: any) => void;
  durationMonths: number;
}

export function CertificateInfoStep({
  formData,
  certificateData,
  updateCertificateField,
  durationMonths,
}: CertificateInfoStepProps) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const certPreviewNum = `${String(certificateData.sequenceNumber).padStart(3, "0")}/${certificateData.companyCode}/PKL/${currentMonth}/${currentYear}`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Data Sertifikat</h2>
      <div className="grid max-w-md gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nomor Urut</label>
            <Input
              type="number"
              min={1}
              value={certificateData.sequenceNumber}
              onChange={(e) =>
                updateCertificateField(
                  "sequenceNumber",
                  parseInt(e.target.value) || 1,
                )
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Kode PT</label>
            <Input
              value={certificateData.companyCode}
              onChange={(e) =>
                updateCertificateField("companyCode", e.target.value)
              }
            />
          </div>
        </div>
        <p className="text-muted-foreground bg-muted/50 rounded p-2 text-xs">
          Preview Nomor: <strong>{certPreviewNum}</strong>
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Tgl Mulai</label>
            <Input
              type="date"
              value={certificateData.startDate}
              onChange={(e) =>
                updateCertificateField("startDate", e.target.value)
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Tgl Selesai
            </label>
            <Input
              type="date"
              value={certificateData.endDate}
              onChange={(e) =>
                updateCertificateField("endDate", e.target.value)
              }
            />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Durasi PKL: <strong>{durationMonths} bulan</strong>
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium">Predikat</label>
          <Select
            value={certificateData.predicate}
            onValueChange={(v) => updateCertificateField("predicate", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["SANGAT BAIK", "BAIK", "CUKUP", "KURANG"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Penandatangan
          </label>
          <Input
            value={certificateData.signerName}
            onChange={(e) =>
              updateCertificateField("signerName", e.target.value)
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Jabatan</label>
          <Input
            value={certificateData.signerRole}
            onChange={(e) =>
              updateCertificateField("signerRole", e.target.value)
            }
          />
        </div>
      </div>

      <h3 className="mt-8 text-lg font-semibold">Preview Sertifikat</h3>
      <CertificatePreview
        formData={formData}
        certificateData={certificateData}
        durationMonths={durationMonths}
      />
    </div>
  );
}
