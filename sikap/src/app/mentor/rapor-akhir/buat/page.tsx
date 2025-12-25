"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Stepper,
  StepperNav,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperTitle,
  StepperPanel,
  StepperContent,
} from "@/components/ui/stepper";

import { useReportWizard } from "./_hooks/useReportWizard";
import { STEPS } from "./_types";
import { CompanyInfoStep } from "./_components/CompanyInfoStep";
import { StudentInfoStep } from "./_components/StudentInfoStep";
import { CompetencyScoresStep } from "./_components/CompetencyScoresStep";
import { ReportPreview } from "./_components/ReportPreview";
import { CertificateInfoStep } from "./_components/CertificateInfoStep";
import { ConfirmationStep } from "./_components/ConfirmationStep";

export default function BuatRaporPage() {
  const wizard = useReportWizard();

  const canProceed = () => {
    switch (wizard.currentStep) {
      case 1:
        return !!wizard.formData.companyName && !!wizard.formData.mentorName;
      case 2:
        return !!wizard.formData.studentName && !!wizard.formData.studentNis;
      case 3:
        return wizard.scores.length > 0;
      case 5:
        return (
          !!wizard.certificateData.predicate &&
          !!wizard.certificateData.companyCode
        );
      default:
        return true;
    }
  };

  if (wizard.isLoading) {
    return (
      <main className="bg-muted text-foreground flex min-h-screen items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (!wizard.selectedStudentId && !wizard.editId) {
    return (
      <main className="bg-muted text-foreground flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">
          Tidak ada siswa yang dipilih. Silakan pilih siswa dari daftar.
        </p>
        <Link href="/mentor/rapor-akhir">
          <Button variant="outline">Kembali ke Daftar</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Link
              href="/mentor/rapor-akhir"
              className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center text-sm"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Kembali ke Daftar
            </Link>
            <h1 className="text-2xl font-bold">
              {wizard.editId ? "Edit Rapor Akhir" : "Buat Rapor Akhir"}
            </h1>
            <p className="text-muted-foreground bg-card mt-1 inline-block rounded border px-2 py-0.5 text-sm">
              Siswa: <strong>{wizard.formData.studentName}</strong> (
              {wizard.formData.studentNis})
            </p>
          </div>
        </div>

        {/* Stepper Logic */}
        <div className="bg-card mb-6 rounded-xl border p-6 shadow-sm">
          <Stepper
            value={wizard.currentStep}
            onValueChange={wizard.handleStepChange}
            indicators={{ completed: <Check className="h-3 w-3" /> }}
          >
            <StepperNav>
              {STEPS.map((step, idx) => (
                <StepperItem
                  key={step.id}
                  step={step.id}
                  completed={wizard.currentStep > step.id}
                >
                  <StepperTrigger className="flex flex-col items-center gap-1">
                    <StepperIndicator>{step.id}</StepperIndicator>
                    <StepperTitle className="hidden text-xs sm:block">
                      {step.title}
                    </StepperTitle>
                  </StepperTrigger>
                  {idx < STEPS.length - 1 && <StepperSeparator />}
                </StepperItem>
              ))}
            </StepperNav>

            <StepperPanel className="mt-8">
              <StepperContent value={1}>
                <CompanyInfoStep
                  formData={wizard.formData}
                  updateFormField={wizard.updateFormField}
                  reportId={wizard.reportId}
                  setIsUploading={wizard.setIsUploading}
                />
              </StepperContent>
              <StepperContent value={2}>
                <StudentInfoStep
                  formData={wizard.formData}
                  updateFormField={wizard.updateFormField}
                  reportId={wizard.reportId}
                  setIsUploading={wizard.setIsUploading}
                />
              </StepperContent>
              <StepperContent value={3}>
                <CompetencyScoresStep
                  scores={wizard.scores}
                  updateScore={wizard.updateScore}
                  totalScore={wizard.totalScore}
                  averageScore={wizard.averageScore}
                />
              </StepperContent>
              <StepperContent value={4}>
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">
                    Preview Daftar Nilai
                  </h2>
                  <ReportPreview
                    formData={wizard.formData}
                    scores={wizard.scores}
                    certificateData={wizard.certificateData}
                  />
                </div>
              </StepperContent>
              <StepperContent value={5}>
                <CertificateInfoStep
                  formData={wizard.formData}
                  certificateData={wizard.certificateData}
                  updateCertificateField={wizard.updateCertificateField}
                  durationMonths={wizard.durationMonths}
                />
              </StepperContent>
              <StepperContent value={6}>
                <ConfirmationStep
                  formData={wizard.formData}
                  certificateData={wizard.certificateData}
                  totalScore={wizard.totalScore}
                  averageScore={wizard.averageScore}
                  durationMonths={wizard.durationMonths}
                />
              </StepperContent>
            </StepperPanel>
          </Stepper>
        </div>

        {/* Navigation Actions */}
        <div className="bg-card flex items-center justify-between rounded-xl border p-4 shadow-sm">
          <Button
            variant="outline"
            onClick={wizard.handleBack}
            disabled={wizard.currentStep === 1 || wizard.isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sebelumnya
          </Button>

          <div className="text-muted-foreground text-sm font-medium">
            Langkah {wizard.currentStep} dari {STEPS.length}
          </div>

          {wizard.currentStep < STEPS.length ? (
            <Button
              variant="destructive"
              className="min-w-[140px]"
              onClick={() => wizard.handleNext(STEPS.length)}
              disabled={
                !canProceed() || wizard.isSubmitting || wizard.isUploading
              }
            >
              {wizard.isSubmitting || wizard.isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {wizard.isUploading ? "Mengupload..." : "Selanjutnya"}
              {!wizard.isUploading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="min-w-[200px]"
              onClick={wizard.handleFinalize}
              disabled={wizard.isSubmitting}
            >
              {wizard.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Terbitkan Rapor & Sertifikat
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
