"use client";

/**
 * TODO: Backend Integration
 *
 * This dialog currently creates tasks with local state only.
 * When backend is ready:
 * 1. Replace onAdd callback with api.tasks.create.useMutation()
 * 2. Include attachments array in mutation payload
 * 3. Handle task distribution to placements on backend
 * 4. Show loading state during mutation
 * 5. Display success/error messages
 *
 * Required backend endpoint:
 * api.tasks.create({ title, description, dueDate, targetMajor, placementIds, attachments })
 */

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
  FileUploadField,
  type FileUploadValue,
} from "@/components/ui/file-upload-field";
import { RUBRIC_CATEGORIES, RUBRICS_BY_MAJOR } from "@/lib/rubrics";

export type TaskItem = {
  id: string;
  titleMain: string;
  titleSub: string;
  description: string;
  date: string;
  attachments?: Array<{ url: string; filename?: string }>;
};

export default function AddTaskDialog({
  onAdd,
}: {
  onAdd: (t: TaskItem) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [titleMain, setTitleMain] = React.useState("");
  const [titleSub, setTitleSub] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [majors, setMajors] = React.useState<Array<"RPL" | "TKJ" | "Umum">>([]);
  const [rubrics, setRubrics] = React.useState<string[]>([]);
  const [attachments, setAttachments] = React.useState<FileUploadValue[]>([]);

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  function toggleMajor(m: "RPL" | "TKJ" | "Umum") {
    setMajors((prev) => {
      // Rule: "Umum" is exclusive - cannot combine with others
      if (m === "Umum") {
        // If Umum already selected, unselect it
        if (prev.includes("Umum")) return [];
        // Otherwise, select only Umum (clear RPL/TKJ)
        return ["Umum"];
      }

      // Clicking RPL or TKJ
      // If Umum is currently selected, remove it and add the new major
      if (prev.includes("Umum")) {
        return [m];
      }

      // Normal toggle for RPL/TKJ (can select both together)
      if (prev.includes(m)) {
        return prev.filter((x) => x !== m);
      }
      return [...prev, m] as ("RPL" | "TKJ" | "Umum")[];
    });
  }

  const availableRubrics = React.useMemo(() => {
    if (majors.length === 0) return [] as string[];
    const all: string[] = [];
    majors.forEach((m) => {
      if (m === "Umum") return;
      const cats = RUBRICS_BY_MAJOR[m];
      Object.values(cats).forEach((list) =>
        list.forEach((i) => {
          if (!all.includes(i)) all.push(i);
        }),
      );
    });
    return all;
  }, [majors]);

  // Group rubrics by major for visual separation
  const rubricsByMajor = React.useMemo(() => {
    const groups: Record<string, string[]> = {};

    majors.forEach((major) => {
      if (major === "Umum") return;
      const cats = RUBRICS_BY_MAJOR[major];
      const rubricList: string[] = [];
      Object.values(cats).forEach((list) => list.forEach((i) => {
        if (!rubricList.includes(i)) rubricList.push(i);
      }));
      groups[major] = rubricList;
    });

    return groups;
  }, [majors]);

  function toggleRubric(r: string) {
    setRubrics((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  }

  const utils = api.useUtils();
  const createTask = api.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tugas berhasil dibuat");
      setOpen(false);
      void utils.tasks.list.invalidate();
      onAdd({
        id: "temp",
        titleMain: "",
        titleSub: "",
        description: "",
        date: "",
      }); // Trigger parent refresh if needed, though invalidate handles it

      // Reset form
      setTitleMain("");
      setTitleSub("");
      setDescription("");
      setDate("");
      setMajors([]);
      setRubrics([]);
      setAttachments([]);
    },
    onError: (err) => {
      toast.error(err.message);
      setError(err.message);
    },
  });

  async function submit() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = date ? new Date(date) : null;
    if (!titleMain.trim()) {
      setError("Topik wajib diisi");
      return;
    }
    if (titleMain.length > 100) {
      setError("Judul besar maksimal 100 karakter");
      return;
    }
    if (titleSub && titleSub.length > 50) {
      setError("Judul kecil maksimal 50 karakter");
      return;
    }
    if (!description.trim()) {
      setError("Deskripsi tugas wajib diisi");
      return;
    }
    if (majors.length === 0) {
      setError("Minimal pilih satu jurusan");
      return;
    }
    if (availableRubrics.length > 0 && rubrics.length === 0) {
      setError("Minimal pilih satu rubrik penilaian");
      return;
    }
    if (!d || isNaN(d.getTime())) {
      setError("Tanggal deadline wajib dipilih");
      return;
    }
    if (d < today) {
      setError("Tanggal deadline tidak boleh lebih awal dari hari ini");
      return;
    }
    setError(null);

    // Combine majors into a single string for targetMajor
    // e.g., ["RPL", "TKJ"] => "RPL,TKJ"
    const combinedMajor = majors.includes("Umum")
      ? undefined
      : majors.length > 1
        ? majors.join(",")
        : majors[0];

    try {
      await createTask.mutateAsync({
        title: titleMain,
        description: description,
        dueDate: d,
        targetMajor: combinedMajor,
        attachments: attachments.map((a) => ({
          url: a.url,
          filename: a.filename,
        })),
      });
    } catch (err) {
      // Error handling is done in mutation's onError
      return;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="rounded-full">
          + Tambah Tugas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Tugas</DialogTitle>
          <DialogDescription>
            Atur topik, subtopik, deskripsi, jurusan, rubrik, dan tanggal
            deadline.
          </DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldGroup>
            <Field orientation="vertical">
              <FieldTitle>Topik</FieldTitle>
              <FieldContent>
                <Input
                  value={titleMain}
                  onChange={(e) => setTitleMain(e.target.value)}
                  placeholder="Mis. Implementasi API"
                  aria-invalid={!!error && !titleMain}
                />
                <div className="text-muted-foreground mt-1 text-xs">
                  Maksimal 100 karakter
                </div>
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldTitle>Subtopik</FieldTitle>
              <FieldContent>
                <Input
                  value={titleSub}
                  onChange={(e) => setTitleSub(e.target.value)}
                  placeholder="Mis. Endpoint Auth"
                  aria-invalid={!!error && titleSub.length > 50}
                />
                <div className="text-muted-foreground mt-1 text-xs">
                  Opsional, maksimal 50 karakter
                </div>
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldTitle>Deskripsi</FieldTitle>
              <FieldContent>
                <div className="mb-2 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="rounded-(--radius-sm) border px-2 py-1"
                    onClick={() => document.execCommand("bold", false)}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="rounded-(--radius-sm) border px-2 py-1"
                    onClick={() => document.execCommand("italic", false)}
                  >
                    <i>I</i>
                  </button>
                  <button
                    type="button"
                    className="rounded-(--radius-sm) border px-2 py-1"
                    onClick={() => document.execCommand("underline", false)}
                  >
                    <u>U</u>
                  </button>
                </div>
                <div
                  contentEditable
                  role="textbox"
                  aria-multiline
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-24 w-full min-w-0 border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm"
                  onInput={(e) =>
                    setDescription((e.target as HTMLElement).innerHTML)
                  }
                />
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Lampiran Tugas (Opsional)</FieldTitle>
              <FieldContent>
                <FileUploadField
                  ownerType="task"
                  ownerId={0}
                  value={attachments}
                  onChange={setAttachments}
                  multiple={true}
                  maxFiles={5}
                  accept="image/*,.pdf"
                  maxSizeBytes={4.5 * 1024 * 1024}
                  description="Unggah file pendukung tugas (gambar atau PDF, maks 5 file @ 4.5MB)"
                />
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Pilih Jurusan</FieldTitle>
              <FieldContent>
                <div className="grid max-h-[400px] grid-cols-2 gap-3 overflow-auto">
                  {["RPL", "TKJ", "Umum"].map((m) => (
                    <label
                      key={m}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-(--radius-sm) border px-3 py-2 transition-transform active:scale-[0.98] ${majors.includes(m as any) ? (m === "Umum" ? "ring-muted-foreground/40 bg-accent ring-1" : "ring-primary bg-secondary ring-1") : "bg-card"}`}
                    >
                      <span
                        className={`text-sm ${m === "Umum" ? "text-muted-foreground font-medium" : ""}`}
                      >
                        {m}
                      </span>
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={majors.includes(m as any)}
                        onChange={() => toggleMajor(m as any)}
                      />
                    </label>
                  ))}
                </div>
              </FieldContent>
            </Field>

            {availableRubrics.length > 0 && (
              <Field orientation="vertical">
                <FieldTitle>Rubrik Penilaian</FieldTitle>
                <FieldContent>
                  <div className="grid max-h-[500px] grid-cols-1 gap-3 overflow-auto md:grid-cols-2">
                    {Object.entries(rubricsByMajor).map(([major, rubricList], idx) => (
                      <React.Fragment key={major}>
                        {idx > 0 && <div className="col-span-full border-t pt-3 mt-1" />}
                        <div className="col-span-full text-xs font-semibold text-muted-foreground mb-2">
                          {major}
                        </div>
                        {rubricList.map((r) => (
                          <label
                            key={r}
                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-(--radius-sm) border px-3 py-2 transition-transform active:scale-[0.98] ${rubrics.includes(r) ? "ring-primary bg-secondary ring-1" : "bg-card"}`}
                          >
                            <span className="text-sm">{r}</span>
                            <input
                              type="checkbox"
                              className="size-4"
                              checked={rubrics.includes(r)}
                              onChange={() => toggleRubric(r)}
                            />
                          </label>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </FieldContent>
              </Field>
            )}
            <Field orientation="vertical">
              <FieldTitle>Tanggal Deadline</FieldTitle>
              <FieldContent>
                <Input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-invalid={!!error && !date}
                />
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
            disabled={
              !titleMain ||
              !description ||
              !date ||
              majors.length === 0 ||
              (availableRubrics.length > 0 && rubrics.length === 0) ||
              createTask.isPending
            }
          >
            {createTask.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
