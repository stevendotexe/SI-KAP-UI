export interface FormState {
  companyName: string;
  companyLogoUrl: string;
  mentorName: string;
  mentorSignatureUrl: string;
  studentName: string;
  studentNis: string;
  studentMajor: string;
  studentGrade: string;
  schoolName: string;
  schoolLogoUrl: string;
  programKeahlian: string;
  konsentrasiKeahlian: string;
  bidangKeahlian: string;
  academicYear: string;
  place: string;
}

export interface CompetencyScore {
  competencyId: number;
  name: string;
  category: string;
  score: number;
}

export interface CertificateState {
  predicate: string;
  companyCode: string;
  sequenceNumber: number;
  startDate: string;
  endDate: string;
  signerName: string;
  signerRole: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  personality: "KEPRIBADIAN",
  technical: "KOMPETENSI KEJURUAN",
};

export const STEPS = [
  { id: 1, title: "Info Perusahaan" },
  { id: 2, title: "Info Siswa" },
  { id: 3, title: "Nilai Kompetensi" },
  { id: 4, title: "Preview Rapor" },
  { id: 5, title: "Data Sertifikat" },
  { id: 6, title: "Konfirmasi" },
];
