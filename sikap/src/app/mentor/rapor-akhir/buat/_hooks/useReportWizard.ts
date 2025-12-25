"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type { FormState, CompetencyScore, CertificateState } from "../_types";

export function useReportWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const studentIdParam = searchParams.get("student");

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStudentId] = useState<number | null>(
    studentIdParam ? parseInt(studentIdParam) : null,
  );
  const [selectedPlacementId, setSelectedPlacementId] = useState<number | null>(
    null,
  );
  const [reportId, setReportId] = useState<number | null>(
    editId ? parseInt(editId) : null,
  );

  const isInitialized = useRef(false);
  const isExistingLoaded = useRef(false);
  const [uploadCount, setUploadCount] = useState(0);
  const isUploading = uploadCount > 0;

  const setIsUploading = useCallback((loading: boolean) => {
    setUploadCount((prev) => (loading ? prev + 1 : Math.max(0, prev - 1)));
  }, []);

  // Form data
  const [formData, setFormData] = useState<FormState>({
    companyName: "",
    companyLogoUrl: "",
    mentorName: "",
    mentorSignatureUrl: "",
    studentName: "",
    studentNis: "",
    studentMajor: "",
    studentGrade: "XII (Dua Belas)",
    schoolName: "",
    schoolLogoUrl: "",
    programKeahlian: "",
    konsentrasiKeahlian: "",
    bidangKeahlian: "Teknologi Informasi",
    academicYear: "2024/2025",
    place: "Tasikmalaya",
  });

  const utils = api.useUtils();

  const [scores, setScores] = useState<CompetencyScore[]>([]);
  const [certificateData, setCertificateData] = useState<CertificateState>({
    predicate: "BAIK",
    companyCode: "PUSAT-LAPTOP",
    sequenceNumber: 1,
    startDate: "",
    endDate: "",
    signerName: "",
    signerRole: "Pembimbing",
  });

  // Track if user has manually edited signerName to avoid overwriting
  const isSignerNameManuallyEdited = useRef(false);

  // Helpers
  const calculateDurationMonths = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  };

  const durationMonths = useMemo(
    () =>
      calculateDurationMonths(
        certificateData.startDate,
        certificateData.endDate,
      ),
    [certificateData.startDate, certificateData.endDate],
  );

  const totalScore = scores.reduce((acc, s) => acc + s.score, 0);
  const averageScore =
    scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

  // API
  const { data: draftData, isLoading: loadingDraft } =
    api.finalReports.getDraft.useQuery(
      { studentProfileId: selectedStudentId! },
      { enabled: !!selectedStudentId && !editId },
    );

  const { data: existingReport, isLoading: loadingExisting } =
    api.finalReports.getById.useQuery(
      { id: reportId ?? 0 },
      { enabled: !!reportId },
    );

  useEffect(() => {
    if (
      formData.companyLogoUrl ||
      formData.mentorSignatureUrl ||
      formData.schoolLogoUrl
    ) {
      console.log("[useReportWizard] formData URLs", {
        companyLogoUrl: formData.companyLogoUrl || "EMPTY",
        mentorSignatureUrl: formData.mentorSignatureUrl || "EMPTY",
        schoolLogoUrl: formData.schoolLogoUrl || "EMPTY",
      });
    }
  }, [
    formData.companyLogoUrl,
    formData.mentorSignatureUrl,
    formData.schoolLogoUrl,
  ]);

  const createMutation = api.finalReports.create.useMutation({
    onSuccess: (data) => {
      setReportId(data.id ?? null);
      if (data.status === "created") {
        toast.success("Draft rapor berhasil dibuat");
      }
      // Update URL with edit ID if it's a new report
      if (data.id && !editId) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("edit", data.id.toString());
        router.replace(`?${params.toString()}`);
      }
      void utils.finalReports.getById.invalidate({ id: data.id });
    },
    onError: (err) => {
      if (err.message.includes("already exists")) {
        toast.info("Rapor sudah ada untuk siswa ini, melanjutkan edit...");
      } else {
        toast.error(err.message);
      }
    },
  });

  const updateMutation = api.finalReports.update.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Data tersimpan");
      void utils.finalReports.getById.invalidate({ id: variables.id });
    },
    onError: (err) => toast.error(err.message),
  });

  const finalizeMutation = api.finalReports.finalize.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Rapor berhasil diterbitkan! Nomor Sertifikat: ${data.certificateNumber}`,
      );
      router.push("/mentor/rapor-akhir");
    },
    onError: (err) => toast.error(err.message),
  });

  // Effects
  useEffect(() => {
    if (draftData && !editId && !isInitialized.current) {
      console.log("[useReportWizard] initializing from draftData", {
        hasExistingSnapshot: !!draftData.existingSnapshot,
        certificatePreview: draftData.certificatePreview,
      });
      if (draftData.reportId) {
        setReportId(draftData.reportId);
      }
      setSelectedPlacementId(draftData.placement.id);

      const snap = draftData.existingSnapshot;

      setFormData((prev) => ({
        ...prev,
        companyName: draftData.company.name || prev.companyName,
        companyLogoUrl: snap?.companyLogoUrl || prev.companyLogoUrl || "",
        mentorName:
          snap?.mentorName || draftData.mentor.name || prev.mentorName,
        mentorSignatureUrl:
          snap?.mentorSignatureUrl || prev.mentorSignatureUrl || "",
        studentName: draftData.student.name || prev.studentName,
        studentNis: draftData.student.nis || prev.studentNis,
        studentMajor: draftData.student.major || prev.studentMajor || "",
        studentGrade:
          snap?.studentGrade || prev.studentGrade || "XII (Dua Belas)",
        schoolName: draftData.student.school || prev.schoolName,
        schoolLogoUrl: snap?.schoolLogoUrl || prev.schoolLogoUrl || "",
        programKeahlian:
          snap?.programKeahlian ||
          draftData.student.major ||
          prev.programKeahlian ||
          "",
        konsentrasiKeahlian:
          snap?.konsentrasiKeahlian ||
          draftData.student.major ||
          prev.konsentrasiKeahlian ||
          "",
        bidangKeahlian:
          snap?.bidangKeahlian || prev.bidangKeahlian || "Teknologi Informasi",
        academicYear: snap?.academicYear || prev.academicYear || "2024/2025",
        place: snap?.place || prev.place || "Tasikmalaya",
      }));
      setScores(
        draftData.draftScores.map((s) => ({
          competencyId: s.competencyId,
          name: s.competencyName,
          category: s.category,
          score: s.calculatedScore,
        })),
      );
      // Use certificatePreview for sequenceNumber and companyCode
      setCertificateData((prev) => ({
        ...prev,
        signerName: draftData.mentor.name,
        startDate: draftData.placement.startDate ?? "",
        endDate: draftData.placement.endDate ?? "",
        sequenceNumber:
          draftData.certificatePreview?.nextSequenceNumber ??
          prev.sequenceNumber,
        companyCode:
          draftData.certificatePreview?.companyCode ?? prev.companyCode,
      }));
      isInitialized.current = true;
    }
  }, [draftData, editId]);

  useEffect(() => {
    if (existingReport && !isExistingLoaded.current) {
      console.log(
        "[useReportWizard] merging full details from existingReport",
        {
          id: existingReport.id,
        },
      );
      setSelectedPlacementId(existingReport.placementId);
      setFormData((prev) => ({
        ...prev,
        companyName: existingReport.companyName || prev.companyName || "",
        companyLogoUrl:
          existingReport.companyLogoUrl || prev.companyLogoUrl || "",
        mentorName: existingReport.mentorName || prev.mentorName || "",
        mentorSignatureUrl:
          existingReport.mentorSignatureUrl || prev.mentorSignatureUrl || "",
        studentName: existingReport.studentName || prev.studentName || "",
        studentNis: existingReport.studentNis || prev.studentNis || "",
        studentMajor: existingReport.studentMajor || prev.studentMajor || "",
        studentGrade:
          existingReport.studentGrade || prev.studentGrade || "XII (Dua Belas)",
        schoolName: existingReport.schoolName || prev.schoolName || "",
        schoolLogoUrl: existingReport.schoolLogoUrl || prev.schoolLogoUrl || "",
        programKeahlian:
          existingReport.programKeahlian || prev.programKeahlian || "",
        konsentrasiKeahlian:
          existingReport.konsentrasiKeahlian || prev.konsentrasiKeahlian || "",
        bidangKeahlian:
          existingReport.bidangKeahlian ||
          prev.bidangKeahlian ||
          "Teknologi Informasi",
        academicYear:
          existingReport.academicYear || prev.academicYear || "2024/2025",
        place: existingReport.place || prev.place || "Tasikmalaya",
      }));

      if (existingReport.scores && existingReport.scores.length > 0) {
        setScores(
          existingReport.scores.map((s) => ({
            competencyId: s.competencyId,
            name: s.name,
            category: s.category,
            score: s.score,
          })),
        );
      }
      if (existingReport.certificate) {
        setCertificateData({
          predicate: existingReport.certificate.predicate || "BAIK",
          companyCode: existingReport.certificate.companyCode || "PUSAT-LAPTOP",
          sequenceNumber: existingReport.certificate.sequenceNumber || 1,
          startDate: existingReport.startDate ?? "",
          endDate: existingReport.endDate ?? "",
          signerName: existingReport.certificate.signerName || "",
          signerRole: existingReport.certificate.signerRole || "Pembimbing",
        });
        if (existingReport.certificate.signerName) {
          isSignerNameManuallyEdited.current = true;
        }
      } else {
        // Fallback if certificate record doesn't exist yet
        setCertificateData((prev) => ({
          ...prev,
          signerName: existingReport.mentorName || prev.signerName,
          startDate: existingReport.startDate ?? prev.startDate,
          endDate: existingReport.endDate ?? prev.endDate,
        }));
      }

      isExistingLoaded.current = true;
      // Also mark general initialized if it wasn't
      isInitialized.current = true;
    }
  }, [existingReport]);

  useEffect(() => {
    let predicate = "CUKUP";
    if (averageScore >= 90) predicate = "SANGAT BAIK";
    else if (averageScore >= 80) predicate = "BAIK";
    else if (averageScore >= 70) predicate = "CUKUP";
    else predicate = "KURANG";
    setCertificateData((prev) => ({ ...prev, predicate }));
  }, [averageScore]);

  const updateFormField = useCallback(
    (field: keyof FormState, value: string) => {
      console.log(
        `[useReportWizard] updateFormField: ${field}`,
        value || "EMPTY",
      );
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const updateCertificateField = useCallback(
    (field: keyof CertificateState, value: any) => {
      if (field === "signerName") {
        isSignerNameManuallyEdited.current = true;
      }
      setCertificateData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Auto-sync signerName from mentorName if not manually edited
  useEffect(() => {
    if (!isSignerNameManuallyEdited.current) {
      setCertificateData((prev) => {
        if (prev.signerName !== formData.mentorName) {
          return { ...prev, signerName: formData.mentorName };
        }
        return prev;
      });
    }
  }, [formData.mentorName]);

  // Auto-sync dates from placement if available and empty
  useEffect(() => {
    if (draftData?.placement && !certificateData.startDate) {
      setCertificateData((prev) => ({
        ...prev,
        startDate: draftData.placement.startDate ?? prev.startDate,
        endDate: draftData.placement.endDate ?? prev.endDate,
      }));
    }
  }, [draftData?.placement]);

  const updateScore = useCallback((competencyId: number, newScore: number) => {
    setScores((prev) =>
      prev.map((s) =>
        s.competencyId === competencyId ? { ...s, score: newScore } : s,
      ),
    );
  }, []);

  const handleNext = useCallback(
    async (maxSteps: number) => {
      console.log("[useReportWizard] handleNext", {
        currentStep,
        reportId,
        formData: {
          ...formData,
          companyLogoUrl: formData.companyLogoUrl ? "PRESENT" : "EMPTY",
          mentorSignatureUrl: formData.mentorSignatureUrl ? "PRESENT" : "EMPTY",
          schoolLogoUrl: formData.schoolLogoUrl ? "PRESENT" : "EMPTY",
        },
      });

      let currentReportId = reportId;

      if (currentStep === 1 && selectedPlacementId && !currentReportId) {
        const result = await createMutation.mutateAsync({
          placementId: selectedPlacementId,
          ...formData,
          // Explicitly ensure logo/sig are passed if they are in formData
          companyLogoUrl: formData.companyLogoUrl,
          mentorSignatureUrl: formData.mentorSignatureUrl,
          schoolLogoUrl: formData.schoolLogoUrl,
        });
        currentReportId = result.id ?? null;
        // Note: setReportId is called in createMutation.onSuccess, but we need currentReportId now
      }

      if (currentReportId) {
        await updateMutation.mutateAsync({
          id: currentReportId,
          ...formData,
          // Explicitly ensure logo/sig are passed if they are in formData
          companyLogoUrl: formData.companyLogoUrl,
          mentorSignatureUrl: formData.mentorSignatureUrl,
          schoolLogoUrl: formData.schoolLogoUrl,
          currentStep: currentStep + 1,
          scores: scores.map((s) => ({
            competencyTemplateId: s.competencyId,
            score: s.score,
          })),
        });
      }

      if (currentStep < maxSteps) {
        setCurrentStep(currentStep + 1);
      }
    },
    [
      currentStep,
      reportId,
      formData,
      selectedPlacementId,
      scores,
      createMutation,
      updateMutation,
    ],
  );

  const handleFinalize = useCallback(async () => {
    if (!reportId) return;
    await finalizeMutation.mutateAsync({
      id: reportId,
      ...certificateData,
      durationMonths,
    });
  }, [reportId, certificateData, durationMonths, finalizeMutation]);

  const handleBack = useCallback(async () => {
    if (currentStep > 1) {
      // Save current state before going back
      if (reportId) {
        await updateMutation.mutateAsync({
          id: reportId,
          ...formData,
          companyLogoUrl: formData.companyLogoUrl,
          mentorSignatureUrl: formData.mentorSignatureUrl,
          schoolLogoUrl: formData.schoolLogoUrl,
          currentStep: currentStep - 1,
          scores: scores.map((s) => ({
            competencyTemplateId: s.competencyId,
            score: s.score,
          })),
        });
      }
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, reportId, formData, scores, updateMutation]);

  // Handle step change from stepper nav click - saves draft before navigating
  const handleStepChange = useCallback(
    async (newStep: number) => {
      if (newStep === currentStep) return;

      let currentReportId = reportId;

      // If moving from step 1 and no report exists, create it first
      if (
        currentStep === 1 &&
        selectedPlacementId &&
        !currentReportId &&
        newStep > 1
      ) {
        try {
          const result = await createMutation.mutateAsync({
            placementId: selectedPlacementId,
            ...formData,
            companyLogoUrl: formData.companyLogoUrl,
            mentorSignatureUrl: formData.mentorSignatureUrl,
            schoolLogoUrl: formData.schoolLogoUrl,
          });
          currentReportId = result.id ?? null;
        } catch (error) {
          // Error handled in mutation onError
          return;
        }
      }

      // Save current state before changing step
      if (currentReportId) {
        try {
          await updateMutation.mutateAsync({
            id: currentReportId,
            ...formData,
            companyLogoUrl: formData.companyLogoUrl,
            mentorSignatureUrl: formData.mentorSignatureUrl,
            schoolLogoUrl: formData.schoolLogoUrl,
            currentStep: newStep,
            scores: scores.map((s) => ({
              competencyTemplateId: s.competencyId,
              score: s.score,
            })),
          });
        } catch (error) {
          // Error handled in mutation onError
          return;
        }
      }

      setCurrentStep(newStep);
    },
    [
      currentStep,
      reportId,
      selectedPlacementId,
      formData,
      scores,
      createMutation,
      updateMutation,
    ],
  );

  return {
    currentStep,
    setCurrentStep,
    formData,
    updateFormField,
    scores,
    updateScore,
    certificateData,
    updateCertificateField,
    durationMonths,
    totalScore,
    averageScore,
    handleNext,
    handleBack,
    handleStepChange,
    handleFinalize,
    isLoading: loadingDraft || loadingExisting,
    isSubmitting:
      createMutation.isPending ||
      updateMutation.isPending ||
      finalizeMutation.isPending,
    isUploading,
    setIsUploading,
    reportId,
    selectedStudentId,
    editId,
  };
}
