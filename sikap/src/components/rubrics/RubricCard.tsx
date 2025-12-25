"use client";

import React from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RubricItem {
  id: number;
  name: string;
  category: "personality" | "technical";
  major: string;
  weight: number | null;
  position: number | null;
  createdAt: string | null;
}

interface RubricCardProps {
  rubric: RubricItem;
  onUpdate: () => void;
}

export default function RubricCard({ rubric, onUpdate }: RubricCardProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <>
      <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-medium">{rubric.name}</h3>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2 py-0.5 ${
                  rubric.category === "technical"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                }`}
              >
                {rubric.category === "technical" ? "Teknis" : "Kepribadian"}
              </span>
              <span className="bg-muted rounded-full px-2 py-0.5">
                {rubric.major}
              </span>
              {rubric.weight !== null && (
                <span className="text-muted-foreground">
                  Bobot: {rubric.weight}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive h-8 w-8"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditRubricDialog
        rubric={rubric}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onUpdate}
      />

      {/* Delete Dialog */}
      <DeleteRubricDialog
        rubric={rubric}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={onUpdate}
      />
    </>
  );
}

// Edit Dialog Component
function EditRubricDialog({
  rubric,
  open,
  onOpenChange,
  onSuccess,
}: {
  rubric: RubricItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = React.useState(rubric.name);
  const [category, setCategory] = React.useState<"personality" | "technical">(
    rubric.category,
  );
  const [majors, setMajors] = React.useState<("RPL" | "TKJ")[]>(
    rubric.major
      .split(",")
      .filter((m): m is "RPL" | "TKJ" => m === "RPL" || m === "TKJ"),
  );
  const [weight, setWeight] = React.useState(
    rubric.weight !== null ? String(rubric.weight) : "",
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(rubric.name);
      setCategory(rubric.category);
      setMajors(
        rubric.major
          .split(",")
          .filter((m): m is "RPL" | "TKJ" => m === "RPL" || m === "TKJ"),
      );
      setWeight(rubric.weight !== null ? String(rubric.weight) : "");
      setError(null);
    }
  }, [open, rubric]);

  function toggleMajor(m: "RPL" | "TKJ") {
    setMajors((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  }

  const utils = api.useUtils();
  const updateRubric = api.rubrics.update.useMutation({
    onSuccess: () => {
      toast.success("Rubrik berhasil diperbarui");
      onOpenChange(false);
      void utils.rubrics.list.invalidate();
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message);
      setError(err.message);
    },
  });

  function submit() {
    if (!name.trim()) {
      setError("Nama rubrik wajib diisi");
      return;
    }
    if (majors.length === 0) {
      setError("Minimal satu jurusan harus dipilih");
      return;
    }
    setError(null);

    updateRubric.mutate({
      id: rubric.id,
      name: name.trim(),
      category,
      major: majors.join(","),
      weight: weight ? Number(weight) : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Rubrik</DialogTitle>
          <DialogDescription>Perbarui data rubrik penilaian.</DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldGroup>
            <Field orientation="vertical">
              <FieldTitle>Nama Rubrik *</FieldTitle>
              <FieldContent>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mis. Kemampuan Problem Solving"
                />
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Kategori *</FieldTitle>
              <FieldContent>
                <Select
                  value={category}
                  onValueChange={(v) =>
                    setCategory(v as "personality" | "technical")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Teknis</SelectItem>
                    <SelectItem value="personality">Kepribadian</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Pilih Jurusan *</FieldTitle>
              <FieldContent>
                <div className="grid grid-cols-2 gap-3">
                  {(["RPL", "TKJ"] as const).map((m) => (
                    <label
                      key={m}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-sm border px-3 py-2 transition-transform active:scale-[0.98] ${majors.includes(m) ? "ring-primary bg-secondary ring-1" : "bg-card"}`}
                    >
                      <span className="text-sm">{m}</span>
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={majors.includes(m)}
                        onChange={() => toggleMajor(m)}
                      />
                    </label>
                  ))}
                </div>
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Bobot (Opsional)</FieldTitle>
              <FieldContent>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Contoh: 10"
                  min={0}
                  step={0.01}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        {error && <div className="text-destructive text-sm">{error}</div>}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={!name || majors.length === 0 || updateRubric.isPending}
          >
            {updateRubric.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Dialog Component
function DeleteRubricDialog({
  rubric,
  open,
  onOpenChange,
  onSuccess,
}: {
  rubric: RubricItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const utils = api.useUtils();
  const deleteRubric = api.rubrics.delete.useMutation({
    onSuccess: () => {
      toast.success("Rubrik berhasil dihapus");
      onOpenChange(false);
      void utils.rubrics.list.invalidate();
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Rubrik</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus rubrik{" "}
            <strong>{rubric.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteRubric.mutate({ id: rubric.id })}
            disabled={deleteRubric.isPending}
          >
            {deleteRubric.isPending ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
