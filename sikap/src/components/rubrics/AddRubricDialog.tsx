"use client";

import React from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

interface AddRubricDialogProps {
  onSuccess: () => void;
}

export default function AddRubricDialog({ onSuccess }: AddRubricDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<"personality" | "technical">(
    "technical",
  );
  const [major, setMajor] = React.useState("RPL");
  const [weight, setWeight] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const utils = api.useUtils();
  const createRubric = api.rubrics.create.useMutation({
    onSuccess: () => {
      toast.success("Rubrik berhasil dibuat");
      setOpen(false);
      void utils.rubrics.list.invalidate();
      onSuccess();
      resetForm();
    },
    onError: (err) => {
      toast.error(err.message);
      setError(err.message);
    },
  });

  function resetForm() {
    setName("");
    setCategory("technical");
    setMajor("RPL");
    setWeight("");
    setError(null);
  }

  function submit() {
    if (!name.trim()) {
      setError("Nama rubrik wajib diisi");
      return;
    }
    if (!major) {
      setError("Jurusan wajib dipilih");
      return;
    }
    setError(null);

    createRubric.mutate({
      name: name.trim(),
      category,
      major,
      weight: weight ? Number(weight) : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="rounded-full">
          + Tambah Rubrik
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Rubrik Penilaian</DialogTitle>
          <DialogDescription>
            Buat rubrik baru untuk penilaian siswa.
          </DialogDescription>
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
                  aria-invalid={!!error && !name}
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
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Teknis</SelectItem>
                    <SelectItem value="personality">Kepribadian</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Jurusan *</FieldTitle>
              <FieldContent>
                <Select value={major} onValueChange={setMajor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RPL">RPL</SelectItem>
                    <SelectItem value="TKJ">TKJ</SelectItem>
                  </SelectContent>
                </Select>
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
                <div className="text-muted-foreground mt-1 text-xs">
                  Bobot untuk kalkulasi skor akhir
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        {error && <div className="text-destructive text-sm">{error}</div>}

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={!name || !major || createRubric.isPending}
          >
            {createRubric.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
