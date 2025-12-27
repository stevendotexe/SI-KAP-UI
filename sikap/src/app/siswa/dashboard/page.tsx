"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogIn, LogOut, RefreshCcw, FileText } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/trpc/react";
import { uploadFilesAction } from "@/server/storage";

// Review status constant aligned with backend enum
const REVIEW_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// Reverse geocode fetcher (dipakai oleh hook)
async function fetchReverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
    { headers: { "Accept-Language": "id" } },
  );
  if (!res.ok) throw new Error("reverse geocode gagal");
  const raw: unknown = await res.json();
  const data =
    typeof raw === "object" && raw !== null
      ? (raw as { display_name?: string })
      : {};
  return data.display_name ?? "Alamat tidak ditemukan";
}

// Hook umum
function useReverseGeocode(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ["revGeo", lat, lon],
    queryFn: async () => {
      if (lat == null || lon == null) return "";
      return fetchReverseGeocode(lat, lon);
    },
    enabled: lat != null && lon != null,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export default function DashboardPage() {
  // Compute week range (Monday to Sunday of current week)
  const weekRange = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Sunday is 0, Monday is 1, etc. We want Monday as start
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + diffToMonday,
    );
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { from: startOfWeek, to: endOfWeek };
  }, []);

  // tRPC queries for dashboard stats
  const tasksQuery = api.tasks.listAssigned.useQuery({ limit: 200 });
  const reportsQuery = api.reports.listMine.useQuery({
    limit: 200,
  });

  // Fetch today's attendance to persist state across refreshes
  const todayAttendance = api.attendances.getTodayLog.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const me = api.students.me.useQuery();

  // Calculate real-time statistics
  const todoCount =
    tasksQuery.data?.items?.filter((task) => task.status === "todo").length ??
    0;

  const submittedTasks =
    tasksQuery.data?.items?.filter((task) =>
      ["submitted", "approved"].includes(task.status),
    ) ?? [];
  const pendingTasksCount =
    tasksQuery.data?.items?.filter((task) => task.status === "submitted")
      .length ?? 0;

  const pendingReviewCount =
    (reportsQuery.data?.items?.filter(
      (report) => report.reviewStatus === REVIEW_STATUS.PENDING,
    ).length ?? 0) + pendingTasksCount;
  const totalReportsCount =
    (reportsQuery.data?.items?.length ?? 0) + submittedTasks.length;

  const statsLoading = tasksQuery.isLoading || reportsQuery.isLoading;
  const statsError = tasksQuery.isError || reportsQuery.isError;

  const handleRefetchStats = () => {
    void tasksQuery.refetch();
    void reportsQuery.refetch();
  };

  const masukInputRef = useRef<HTMLInputElement | null>(null);
  const keluarInputRef = useRef<HTMLInputElement | null>(null);
  const [masukImageName, setMasukImageName] = useState("");
  const [keluarImageName, setKeluarImageName] = useState("");
  const [cameraOpenFor, setCameraOpenFor] = useState<"masuk" | "keluar" | null>(
    null,
  );
  const [useFrontCamera, setUseFrontCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [masukLocation, setMasukLocation] = useState<string>("");
  const [keluarLocation, setKeluarLocation] = useState<string>("");
  const [now, setNow] = useState<Date | null>(null);

  const [masukAt, setMasukAt] = useState("");
  const [keluarAt, setKeluarAt] = useState("");
  const [isMasukSaved, setIsMasukSaved] = useState(false);
  const [isKeluarSaved, setIsKeluarSaved] = useState(false);

  // NEW: koordinat terpisah
  const [masukCoords, setMasukCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [keluarCoords, setKeluarCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Izin
  const [izinOpen, setIzinOpen] = useState(false);
  const [izinReason, setIzinReason] = useState("");
  const [izinFileName, setIzinFileName] = useState("");
  const [isIzinSaved, setIsIzinSaved] = useState(false);
  const izinFileInputRef = useRef<HTMLInputElement | null>(null);

  // Selfie blobs for upload
  const [masukSelfieBlob, setMasukSelfieBlob] = useState<Blob | null>(null);
  const [keluarSelfieBlob, setKeluarSelfieBlob] = useState<Blob | null>(null);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);

  // Query reverse geocode
  const masukGeo = useReverseGeocode(
    masukCoords?.latitude,
    masukCoords?.longitude,
  );
  const keluarGeo = useReverseGeocode(
    keluarCoords?.latitude,
    keluarCoords?.longitude,
  );

  // Sinkronkan hasil query ke label lokasi
  useEffect(() => {
    if (masukCoords && masukGeo.data) {
      setMasukLocation(
        `${masukGeo.data} (${masukCoords.latitude.toFixed(6)}, ${masukCoords.longitude.toFixed(6)})`,
      );
    }
  }, [masukCoords, masukGeo.data]);

  useEffect(() => {
    if (keluarCoords && keluarGeo.data) {
      setKeluarLocation(
        `${keluarGeo.data} (${keluarCoords.latitude.toFixed(6)}, ${keluarCoords.longitude.toFixed(6)})`,
      );
    }
  }, [keluarCoords, keluarGeo.data]);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Initialize attendance state from today's log
  useEffect(() => {
    if (todayAttendance.data) {
      const log = todayAttendance.data;
      if (log.checkInAt) {
        setIsMasukSaved(true);
        setMasukAt(
          new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(new Date(log.checkInAt)),
        );
        setMasukImageName("presensi-masuk.png");
        if (log.latitude && log.longitude) {
          const lat = parseFloat(log.latitude);
          const lon = parseFloat(log.longitude);
          setMasukCoords({ latitude: lat, longitude: lon });
        }
        if (log.locationNote) {
          setMasukLocation(log.locationNote);
        }
      }
      if (log.checkOutAt) {
        setIsKeluarSaved(true);
        setKeluarAt(
          new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(new Date(log.checkOutAt)),
        );
        setKeluarImageName("presensi-keluar.png");
      }
    }
  }, [todayAttendance.data]);

  const formatTs = () =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function startCamera() {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: useFrontCamera ? "user" : "environment" },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  function getCoords(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.error("[Geolocation] Not supported in this browser");
        return reject(new Error("Geolocation tidak didukung"));
      }
      console.log("[Geolocation] Requesting location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log(
            "[Geolocation] Success:",
            pos.coords.latitude,
            pos.coords.longitude,
          );
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("[Geolocation] Error:", err.code, err.message);
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: string }).message)
              : "Geolocation error";
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }

  // UPDATED: hanya set koordinat, geocode via query
  async function setLocationFor(which: "masuk" | "keluar") {
    try {
      const coords = await getCoords();
      if (which === "masuk") {
        setMasukCoords(coords);
      } else {
        setKeluarCoords(coords);
      }
    } catch {
      if (which === "masuk") setMasukLocation("Lokasi tidak tersedia");
      else setKeluarLocation("Lokasi tidak tersedia");
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);

    const forWhich = cameraOpenFor;
    if (!forWhich) return;

    // ⭐ Ubah toBlob jadi Promise agar bisa await
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return;

    const fileName = `selfie-${forWhich}-${Date.now()}.png`;

    if (forWhich === "masuk") {
      setMasukImageName(fileName);
      setMasukAt(formatTs());
      setMasukSelfieBlob(blob); // Save blob for later upload
    } else {
      setKeluarImageName(fileName);
      setKeluarAt(formatTs());
      setKeluarSelfieBlob(blob); // Save blob for later upload
    }

    setCameraOpenFor(null);
    stopCamera();

    try {
      const coords = await getCoords();
      if (forWhich === "masuk") setMasukCoords(coords);
      else setKeluarCoords(coords);
    } catch {
      const fallback = "Lokasi tidak tersedia";
      if (forWhich === "masuk") setMasukLocation(fallback);
      else setKeluarLocation(fallback);
    }
  }

  // State for attendance mutation error
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  // tRPC mutations for attendance
  const checkInMutation = api.attendances.recordCheckIn.useMutation();
  const checkOutMutation = api.attendances.recordCheckOut.useMutation();

  const handleCatatMasuk = async () => {
    const ts = formatTs();
    setMasukAt(ts);
    setAttendanceError(null);
    setIsUploadingSelfie(true);

    try {
      // Upload selfie photo first if available
      let selfieUrl: string | undefined;
      if (masukSelfieBlob) {
        const formData = new FormData();
        formData.append("ownerType", "attendance_log");
        formData.append("ownerId", "0");
        const file = new File(
          [masukSelfieBlob],
          masukImageName || `selfie-masuk-${Date.now()}.png`,
          { type: "image/png" },
        );
        formData.append("file", file);

        const uploadResponse = await uploadFilesAction(formData);
        if (
          uploadResponse.status === "success" &&
          uploadResponse.data?.[0]?.url
        ) {
          selfieUrl = uploadResponse.data[0].url;
        }
      }

      await checkInMutation.mutateAsync({
        timestamp: new Date(),
        latitude: masukCoords?.latitude,
        longitude: masukCoords?.longitude,
        locationNote: masukLocation,
        selfieUrl,
      });
      setIsMasukSaved(true);
      setMasukSelfieBlob(null); // Clear blob after successful upload
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan presensi masuk";
      setAttendanceError(message);
      alert(message);
    } finally {
      setIsUploadingSelfie(false);
    }
  };

  const handleCatatKeluar = async () => {
    const ts = formatTs();
    setKeluarAt(ts);
    setAttendanceError(null);
    try {
      await checkOutMutation.mutateAsync({
        timestamp: new Date(),
        latitude: keluarCoords?.latitude,
        longitude: keluarCoords?.longitude,
        locationNote: keluarLocation,
      });
      setIsKeluarSaved(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan presensi keluar";
      setAttendanceError(message);
      alert(message);
    }
  };

  const handleResetMasuk = () => {
    setMasukImageName("");
    setMasukLocation("");
    setMasukAt("");
    setMasukCoords(null);
    setMasukSelfieBlob(null); // Clear selfie blob
    setIsMasukSaved(false);
    if (masukInputRef.current) masukInputRef.current.value = "";
    if (cameraOpenFor === "masuk") {
      setCameraOpenFor(null);
      stopCamera();
    }
  };

  const handleResetKeluar = () => {
    setKeluarImageName("");
    setKeluarLocation("");
    setKeluarAt("");
    setKeluarCoords(null);
    setKeluarSelfieBlob(null); // Clear selfie blob
    setIsKeluarSaved(false);
    if (keluarInputRef.current) keluarInputRef.current.value = "";
    if (cameraOpenFor === "keluar") {
      setCameraOpenFor(null);
      stopCamera();
    }
  };

  const handleResetIzin = () => {
    setIzinReason("");
    setIsIzinSaved(false);
  };

  const handleSaveIzin = async () => {
    setIsIzinSaved(true);
    setIzinOpen(false);
  };

  return (
    <main className="bg-muted text-foreground min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <section className="p-0 mb-6">
          <h1 className="text-2xl font-semibold">
            Selamat datang, {me.data?.name ?? "Siswa"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Kode Siswa: {me.data?.code}
          </p>
          <div className="mt-1 flex flex-col gap-6">
            {/* NOTE: Attendance form posts to /api/attendance endpoint. Backend implementation may be required. */}
            <div className="order-1 md:order-2">
              <div className="bg-card rounded-2xl border p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Form presensi</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Pilih status kehadiran anda
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Pengisian presensi masuk hanya dapat dilakukan antara
                      07:00:00 hingga 07:59:59
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Pengisian presensi keluar hanya dapat dilakukan antara
                      15:00:00 hingga 15:59:59
                    </p>
                  </div>
                  <div
                    className="mt-4 text-sm sm:mt-0"
                    suppressHydrationWarning
                  >
                    {now
                      ? new Intl.DateTimeFormat("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(now)
                      : "—"}
                    <br />
                    <span className="text-muted-foreground">
                      {now
                        ? new Intl.DateTimeFormat("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        }).format(now)
                        : "—"}
                    </span>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Masuk */}
                  <div className="bg-card rounded-2xl border p-6">
                    <h3 className="text-xl font-semibold">Presensi Masuk</h3>
                    <p className="text-muted-foreground mt-2">
                      {masukAt ? (
                        <span className="text-foreground font-semibold">
                          {masukAt}
                        </span>
                      ) : (
                        "--:--:--"
                      )}
                    </p>
                    <input
                      ref={masukInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setMasukImageName(f.name);
                          setMasukAt(formatTs());
                          await setLocationFor("masuk");
                        } else {
                          setMasukImageName("");
                          setMasukLocation("");
                          setMasukAt("");
                          setMasukCoords(null);
                        }
                      }}
                    />
                    <div
                      className={`mt-4 flex items-center gap-2 ${masukImageName && !isMasukSaved
                        ? "w-full justify-between md:justify-start"
                        : ""
                        }`}
                    >
                      <Button
                        variant={
                          isMasukSaved || isIzinSaved
                            ? "outline"
                            : "destructive"
                        }
                        disabled={isMasukSaved || isIzinSaved}
                        className={`inline-flex h-9 items-center gap-2 rounded-md px-5 ${isMasukSaved || isIzinSaved
                          ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed border"
                          : ""
                          }`}
                        onClick={() => {
                          setCameraOpenFor("masuk");
                          setTimeout(() => {
                            void startCamera();
                          }, 0);
                        }}
                        title={
                          isMasukSaved || isIzinSaved
                            ? "Tidak tersedia"
                            : "Ambil Foto"
                        }
                      >
                        <LogIn className="h-4 w-4" />
                        <span className="text-sm font-medium">Masuk</span>
                      </Button>

                      {masukImageName && !isMasukSaved && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetMasuk}
                          className="border-destructive text-destructive hover:bg-destructive/10 h-9 rounded-md px-5"
                          title="Reset presensi masuk"
                        >
                          Reset
                        </Button>
                      )}

                      {!masukImageName && (
                        <Button
                          type="button"
                          variant={isIzinSaved ? "outline" : "secondary"}
                          className={`inline-flex h-9 items-center gap-2 rounded-md px-5 ${isIzinSaved
                            ? "bg-muted text-muted-foreground cursor-not-allowed border"
                            : ""
                            }`}
                          onClick={() => setIzinOpen(true)}
                          disabled={isIzinSaved}
                          title="Ajukan Izin"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">Izin</span>
                        </Button>
                      )}
                    </div>
                    {masukImageName && (
                      <>
                        <p className="text-muted-foreground mt-2 text-xs break-all">
                          Lampiran terpilih: {masukImageName}
                        </p>
                        {masukLocation && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Lokasi: {masukLocation}
                          </p>
                        )}
                        {masukCoords && masukGeo.isLoading && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Memuat alamat...
                          </p>
                        )}
                        {masukGeo.isError && (
                          <p className="text-destructive mt-1 text-xs">
                            Gagal memuat alamat
                          </p>
                        )}
                        {!isMasukSaved && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              void handleCatatMasuk();
                            }}
                            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-5 shadow-sm"
                            disabled={
                              checkInMutation.isPending || isUploadingSelfie
                            }
                          >
                            <LogIn className="h-4 w-4" />
                            <span className="text-sm font-semibold">
                              {isUploadingSelfie
                                ? "Mengunggah foto..."
                                : checkInMutation.isPending
                                  ? "Menyimpan..."
                                  : "Catat Jam Masuk"}
                            </span>
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Keluar */}
                  <div className="bg-card rounded-2xl border p-6">
                    <h3 className="text-xl font-semibold">Presensi Keluar</h3>
                    <p className="text-muted-foreground mt-2">
                      {keluarAt ? (
                        <span className="text-foreground font-semibold">
                          {keluarAt}
                        </span>
                      ) : (
                        "--:--:--"
                      )}
                    </p>
                    <input
                      ref={keluarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setKeluarImageName(f.name);
                          setKeluarAt(formatTs());
                          await setLocationFor("keluar");
                        } else {
                          setKeluarImageName("");
                          setKeluarLocation("");
                          setKeluarAt("");
                          setKeluarCoords(null);
                        }
                      }}
                    />
                    <div
                      className={`mt-4 flex items-center gap-2 ${keluarImageName && !isKeluarSaved
                        ? "w-full justify-between md:justify-start"
                        : ""
                        }`}
                    >
                      <Button
                        variant={
                          !isMasukSaved || isKeluarSaved || isIzinSaved
                            ? "outline"
                            : "destructive"
                        }
                        disabled={
                          !isMasukSaved || isKeluarSaved || isIzinSaved
                        }
                        title={
                          !isMasukSaved
                            ? "Lakukan presensi masuk terlebih dahulu"
                            : "Ambil Foto"
                        }
                        className={`inline-flex h-9 items-center gap-2 rounded-md px-5 ${!isMasukSaved || isKeluarSaved || isIzinSaved
                          ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed border"
                          : ""
                          }`}
                        onClick={() => {
                          if (!isMasukSaved) return;
                          setCameraOpenFor("keluar");
                          setTimeout(() => {
                            void startCamera();
                          }, 0);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm font-medium">Keluar</span>
                      </Button>

                      {keluarImageName && !isKeluarSaved && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetKeluar}
                          className="border-destructive text-destructive hover:bg-destructive/10 h-9 rounded-md px-5"
                          title="Reset presensi keluar"
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                    {keluarImageName && (
                      <>
                        <p className="text-muted-foreground mt-2 text-xs break-all">
                          File terpilih: {keluarImageName}
                        </p>
                        {keluarLocation && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Lokasi: {keluarLocation}
                          </p>
                        )}
                        {keluarCoords && keluarGeo.isLoading && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Memuat alamat...
                          </p>
                        )}
                        {keluarGeo.isError && (
                          <p className="text-destructive mt-1 text-xs">
                            Gagal memuat alamat
                          </p>
                        )}
                        {!isKeluarSaved && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              void handleCatatKeluar();
                            }}
                            disabled={
                              !isMasukSaved || checkOutMutation.isPending
                            }
                            className="disabled:bg-muted disabled:text-muted-foreground mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-5 shadow-sm disabled:cursor-not-allowed"
                          >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm font-semibold">
                              {checkOutMutation.isPending
                                ? "Menyimpan..."
                                : "Catat Jam Keluar"}
                            </span>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="order-2 mt-6 md:order-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-card rounded-2xl border p-5 shadow-sm">
                  <div className="text-foreground text-sm font-semibold">
                    Belum Dikerjakan
                  </div>
                  <div className="mt-2 text-3xl font-semibold">
                    {statsLoading ? "..." : todoCount}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    Total
                  </div>
                </div>
                <div className="bg-card rounded-2xl border p-5 shadow-sm">
                  <div className="text-foreground text-sm font-semibold">
                    Menunggu Review
                  </div>
                  <div className="mt-2 text-3xl font-semibold">
                    {statsLoading ? "..." : pendingReviewCount}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    Menunggu respon Mentor
                  </div>
                </div>
                <div className="bg-card rounded-2xl border p-5 shadow-sm">
                  <div className="text-foreground text-sm font-semibold">
                    Laporan Terkirim
                  </div>
                  <div className="mt-2 text-3xl font-semibold">
                    {statsLoading ? "..." : totalReportsCount}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    Total
                  </div>
                </div>
              </div>
              {statsError && (
                <div className="border-destructive bg-destructive/10 mt-4 rounded-2xl border p-4">
                  <p className="text-destructive text-sm">
                    Gagal memuat data terbaru.{" "}
                    <button
                      onClick={handleRefetchStats}
                      className="font-medium underline"
                    >
                      Coba lagi
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Camera Dialog (tetap) */}
        <Dialog
          open={cameraOpenFor !== null}
          onOpenChange={(open) => {
            if (!open) {
              setCameraOpenFor(null);
              void stopCamera();
            }
          }}
        >
          <DialogContent
            className="max-w rounded-10 w-full sm:max-w-lg" // square dialog
          >
            <DialogHeader>
              <DialogTitle>
                Ambil Foto {cameraOpenFor === "masuk" ? "Masuk" : "Keluar"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {/* Preview area: square corners */}
              <div className="aspect-video w-full overflow-hidden rounded-none bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />

              {/* Controls: make buttons square */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  className="h-9 rounded-md"
                  onClick={() => {
                    setUseFrontCamera((prev) => !prev);
                    setTimeout(() => void startCamera(), 0);
                  }}
                  title="Ganti Kamera"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Ganti Kamera
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-9 rounded-md"
                    onClick={() => {
                      setCameraOpenFor(null);
                      void stopCamera();
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-9 rounded-md"
                    onClick={() => void capturePhoto()}
                  >
                    Ambil Foto
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter />
          </DialogContent>
        </Dialog>

        {/* Dialog Form Izin (tetap) */}
        <Dialog
          open={izinOpen}
          onOpenChange={(o) => {
            if (!o) {
              void setIzinOpen(false);
            }
          }}
        >
          <DialogContent className="rounded-sm sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Form Izin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <textarea
                className="h-32 w-full resize-y rounded-sm border p-2 text-sm outline-none"
                placeholder="Tulis alasan izin (contoh: sakit, keperluan keluarga, dsb.)"
                value={izinReason}
                onChange={(e) => setIzinReason(e.target.value)}
                disabled={isIzinSaved}
              />
              <div className="space-y-2">
                <input
                  ref={izinFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (isIzinSaved) return;
                    const f = e.target.files?.[0];
                    setIzinFileName(f ? f.name : "");
                  }}
                  disabled={isIzinSaved}
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border bg-card text-foreground inline-flex h-9 w-full items-center justify-start rounded-full border px-4 py-0 sm:w-auto"
                    onClick={() => izinFileInputRef.current?.click()}
                    disabled={isIzinSaved}
                  >
                    Unggah Lampiran
                  </Button>

                  <div
                    className="border-destructive/60 bg-card text-destructive/80 relative w-full min-w-[220px] rounded-full border px-4 py-2 text-sm sm:flex-1"
                    style={{ borderStyle: "dashed" }}
                  >
                    {izinFileName ? izinFileName : "Belum ada lampiran"}
                    {izinFileName && !isIzinSaved && (
                      <button
                        type="button"
                        aria-label="Hapus file"
                        onClick={() => {
                          setIzinFileName("");
                          if (izinFileInputRef.current)
                            izinFileInputRef.current.value = "";
                        }}
                        className="text-destructive hover:bg-destructive/10 absolute top-1/2 right-2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full"
                      >
                        <span className="text-sm leading-none">×</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-9 rounded-md"
                  onClick={() => {
                    setIzinOpen(false);
                  }}
                >
                  Batal
                </Button>
                {(izinReason || izinFileName) && !isIzinSaved && (
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10 h-9 rounded-md"
                    onClick={handleResetIzin}
                    title="Bersihkan"
                  >
                    Bersihkan
                  </Button>
                )}
              </div>
              <Button
                variant="destructive"
                className="h-9 rounded-md"
                onClick={() => {
                  void handleSaveIzin();
                }}
                disabled={!izinReason || isIzinSaved}
              >
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog >
      </div >
    </main >
  );
}
