"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteStudentSectionProps {
  userId: string;
  studentCode: string | null;
  studentName: string;
}

export default function DeleteStudentSection({
  userId,
  studentCode,
  studentName,
}: DeleteStudentSectionProps) {
  const [open, setOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const router = useRouter();

  const deleteStudent = api.students.delete.useMutation({
    onSuccess: () => {
      toast.success("Siswa berhasil dihapus");
      setOpen(false);
      router.push("/mentor/siswa");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const canDelete = confirmInput === studentCode;

  function handleDelete() {
    if (!canDelete) return;
    deleteStudent.mutate({ userId });
  }

  return (
    <div className="bg-card rounded-xl border border-red-200 p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-red-600">
        Hapus Akun Siswa
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Menghapus akun siswa akan menghapus semua data terkait termasuk laporan,
        tugas, dan kehadiran. Tindakan ini tidak dapat dibatalkan.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Hapus Akun Siswa</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Akun</DialogTitle>
            <DialogDescription>
              Anda akan menghapus akun siswa <strong>{studentName}</strong>.
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-2 text-sm">
              Ketik{" "}
              <strong className="font-mono text-red-600">{studentCode}</strong>{" "}
              untuk mengkonfirmasi penghapusan:
            </p>
            <Input
              placeholder="Masukkan kode siswa"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="font-mono"
            />
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || deleteStudent.isPending}
            >
              {deleteStudent.isPending ? "Menghapus..." : "Hapus Permanent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
