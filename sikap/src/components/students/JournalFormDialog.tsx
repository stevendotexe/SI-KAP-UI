"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface EditingEntry {
  id: number;
  activityDate: string | null;
  content: string | null;
  durationMinutes: number | null;
  reviewStatus?: "pending" | "approved" | "rejected";
}

interface JournalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultDate?: string; // YYYY-MM-DD format
  editingEntry?: EditingEntry | null; // Entry to edit (if editing mode)
}

export default function JournalFormDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultDate,
  editingEntry,
}: JournalFormDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [activityDate, setActivityDate] = useState(defaultDate ?? today);
  const [content, setContent] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const isEditMode = !!editingEntry;
  const isResubmitMode = editingEntry?.reviewStatus === "rejected";

  const utils = api.useUtils();

  // Populate form when editing
  useEffect(() => {
    if (editingEntry) {
      setActivityDate(editingEntry.activityDate ?? today);
      setContent(editingEntry.content ?? "");
      const totalMinutes = editingEntry.durationMinutes ?? 0;
      setHours(Math.floor(totalMinutes / 60));
      setMinutes(totalMinutes % 60);
    } else {
      setActivityDate(defaultDate ?? today);
      setContent("");
      setHours(0);
      setMinutes(0);
    }
  }, [editingEntry, defaultDate, today]);

  const createMutation = api.reports.createJournal.useMutation({
    onSuccess: () => {
      toast.success("Laporan berhasil disimpan");
      void utils.reports.listJournals.invalidate();
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menyimpan laporan");
    },
  });

  const updateMutation = api.reports.updateJournal.useMutation({
    onSuccess: () => {
      toast.success("Laporan berhasil diperbarui");
      void utils.reports.listJournals.invalidate();
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui laporan");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function resetForm() {
    setActivityDate(today);
    setContent("");
    setHours(0);
    setMinutes(0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Deskripsi kegiatan harus diisi");
      return;
    }

    const durationMinutes = hours * 60 + minutes;
    if (durationMinutes <= 0) {
      toast.error("Durasi kegiatan harus lebih dari 0");
      return;
    }

    if (isEditMode && editingEntry) {
      updateMutation.mutate({
        reportId: editingEntry.id,
        content: content.trim(),
        durationMinutes,
      });
    } else {
      createMutation.mutate({
        activityDate,
        content: content.trim(),
        durationMinutes,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isResubmitMode
              ? "Perbaiki Laporan Harian"
              : isEditMode
                ? "Edit Laporan Harian"
                : "Tambah Laporan Harian"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tanggal Kegiatan
            </label>
            <Input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              max={today}
              required
              disabled={isEditMode} // Can't change date when editing
              className="w-full"
            />
          </div>

          {/* Activity Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Deskripsi Kegiatan
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Jelaskan kegiatan yang Anda lakukan hari ini..."
              rows={5}
              required
              className="w-full resize-none rounded-lg"
            />
          </div>

          {/* Duration Input - Hours and Minutes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Durasi Kegiatan
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={24}
                  className="w-20 text-center"
                />
                <span className="text-sm text-gray-600">jam</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={59}
                  className="w-20 text-center"
                />
                <span className="text-sm text-gray-600">menit</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {hours} jam {minutes} menit ({hours * 60 + minutes} menit)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  {isResubmitMode ? "Memperbaiki..." : isEditMode ? "Memperbarui..." : "Menyimpan..."}
                </>
              ) : (
                isResubmitMode ? "Perbaiki Laporan" : isEditMode ? "Perbarui Laporan" : "Simpan Laporan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
