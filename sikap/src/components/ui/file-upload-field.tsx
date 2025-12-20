"use client";

import { useRef, useState, useCallback, useId, useEffect } from "react";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatFileSize,
  extractFilenameFromUrl,
  isImageFile,
  validateFile,
  DEFAULT_ALLOWED_MIME_TYPES,
  DEFAULT_MAX_SIZE_BYTES,
} from "@/lib/file-utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import {
  uploadFilesAction,
  deleteFileAction,
} from "@/server/storage";
import type { OwnerType } from "@/server/storage.types";

/**
 * Value type for file upload field - represents an uploaded file.
 * Use this type when storing/passing file data between components.
 */
export type FileUploadValue = {
  url: string;
  filename?: string;
};

/**
 * State for each file being uploaded or already uploaded.
 */
type FileState = {
  id: string;
  filename: string;
  url?: string;
  size?: number;
  mimeType?: string;
  status: "uploading" | "success" | "error";
  error?: string;
};

/**
 * Props for the FileUploadField component.
 */
export interface FileUploadFieldProps {
  /** Owner type for the attachment (task, report, final_report, assessment) */
  ownerType: OwnerType;
  /** Owner ID for the attachment (null for new entities not yet created) */
  ownerId: number | null;
  /** Array of uploaded file objects with url and optional filename (controlled) */
  value?: FileUploadValue[];
  /** Callback when uploaded files change */
  onChange?: (files: FileUploadValue[]) => void;
  /** Allow multiple file uploads */
  multiple?: boolean;
  /** Maximum number of files allowed (only applies when multiple is true) */
  maxFiles?: number;
  /** Accepted mime types string (e.g., "image/*,application/pdf") */
  accept?: string;
  /** Maximum file size in bytes (default: 4.5MB) */
  maxSizeBytes?: number;
  /** Disable all interactions */
  disabled?: boolean;
  /** Field label */
  label?: string;
  /** Field description */
  description?: string;
  /** Error message */
  error?: string;
  /** Additional class names for the container */
  className?: string;
}

/**
 * Parse accept prop to array of mime types.
 */
function parseAcceptToMimeTypes(accept?: string): string[] {
  if (!accept) return DEFAULT_ALLOWED_MIME_TYPES;

  const types: string[] = [];
  const parts = accept.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part === "image/*") {
      // Exclude image/gif to match server-side isAllowedMime validation
      types.push("image/jpeg", "image/png", "image/webp");
    } else if (part === "application/*") {
      types.push("application/pdf");
    } else if (part.startsWith(".")) {
      // Convert extension to mime type
      // Note: gif is excluded to match server-side validation
      const ext = part.slice(1).toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        pdf: "application/pdf",
      };
      if (mimeMap[ext]) types.push(mimeMap[ext]);
    } else {
      types.push(part);
    }
  }

  return types.length > 0 ? types : DEFAULT_ALLOWED_MIME_TYPES;
}

/**
 * Get file type icon based on mime type.
 */
function FileTypeIcon({
  mimeType,
  className,
}: {
  mimeType?: string;
  className?: string;
}) {
  if (!mimeType) {
    return <FileIcon className={className} />;
  }

  if (isImageFile(mimeType)) {
    return <ImageIcon className={className} />;
  }

  if (mimeType === "application/pdf") {
    return <FileText className={className} />;
  }

  return <FileIcon className={className} />;
}

/**
 * A reusable file upload field component that integrates with the
 * file storage system and the field component system.
 *
 * @example
 * ```tsx
 * <FileUploadField
 *   ownerType="report"
 *   ownerId={123}
 *   value={uploadedUrls}
 *   onChange={setUploadedUrls}
 *   label="Lampiran"
 *   description="Upload file pendukung (max 4.5MB)"
 *   multiple
 *   maxFiles={5}
 * />
 * ```
 */
export function FileUploadField({
  ownerType,
  ownerId,
  value = [],
  onChange,
  multiple = false,
  maxFiles = 10,
  accept,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  disabled = false,
  label,
  description,
  error,
  className,
}: FileUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileState[]>(() =>
    (value ?? []).map((file) => ({
      id: file.url,
      filename: file.filename ?? extractFilenameFromUrl(file.url),
      url: file.url,
      status: "success" as const,
    }))
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync internal files state with controlled value prop
  useEffect(() => {
    const valueFiles = value ?? [];
    const valueUrls = new Set(valueFiles.map((f) => f.url));

    setFiles((prevFiles) => {
      // Keep uploading files as they are
      const uploadingFiles = prevFiles.filter((f) => f.status === "uploading");

      // Keep success files that are not yet in value (race condition protection)
      const recentSuccessFiles = prevFiles.filter(
        (f) => f.status === "success" && f.url && !valueUrls.has(f.url)
      );

      // Build new files from value, preserving metadata where URL still exists
      const syncedFiles: FileState[] = valueFiles.map((file) => {
        const existing = prevFiles.find((f) => f.url === file.url);
        if (existing) {
          // Preserve existing metadata
          return existing;
        }
        // Create new file state from value object
        return {
          id: file.url,
          filename: file.filename ?? extractFilenameFromUrl(file.url),
          url: file.url,
          status: "success" as const,
        };
      });

      // Combine: synced files from value + uploading files + recent success files not in value
      return [...syncedFiles, ...uploadingFiles, ...recentSuccessFiles];
    });
  }, [value]);

  const allowedMimeTypes = parseAcceptToMimeTypes(accept);
  const acceptString =
    accept ?? DEFAULT_ALLOWED_MIME_TYPES.join(",");

  const isUploading = files.some((f) => f.status === "uploading");
  const hasReachedLimit = multiple ? files.length >= maxFiles : files.length >= 1;

  /**
   * Handle file selection from input.
   */
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      if (selectedFiles.length === 0) return;

      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setLocalError(null);

      // Check max files limit
      const availableSlots = multiple ? maxFiles - files.length : 1 - files.length;
      if (availableSlots <= 0) {
        setLocalError(
          multiple
            ? `Maksimal ${maxFiles} file yang dapat diunggah`
            : "Hanya 1 file yang dapat diunggah"
        );
        return;
      }

      const filesToUpload = selectedFiles.slice(0, availableSlots);
      if (process.env.NODE_ENV !== "production") {
        console.debug("[upload-ui] select", { count: filesToUpload.length, names: filesToUpload.map(f => f.name) });
      }

      // Validate files
      for (const file of filesToUpload) {
        const validation = validateFile(file, allowedMimeTypes, maxSizeBytes);
        if (!validation.valid) {
          setLocalError(validation.error ?? "File tidak valid");
          return;
        }
      }

      // Create pending file states
      const pendingFiles: FileState[] = filesToUpload.map((file) => ({
        id: `pending-${Date.now()}-${file.name}`,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        status: "uploading" as const,
      }));

      setFiles((prev) => [...prev, ...pendingFiles]);

      try {
        // Create FormData and upload
        // Use 0 as placeholder ownerId if null (for new entities not yet created)
        const formData = new FormData();
        formData.append("ownerType", ownerType);
        formData.append("ownerId", String(ownerId ?? 0));
        for (const file of filesToUpload) {
          formData.append("file", file);
        }

        const response = await uploadFilesAction(formData);

        if (response.status === "success" && response.data) {
          // Build uploadedFiles array from response data first
          const uploadedFiles: FileUploadValue[] = response.data
            .filter((item): item is NonNullable<typeof item> => !!item)
            .map((item) => ({ url: item.url, filename: item.filename }));

          // Update file states with successful uploads
          setFiles((prev) => {
            const updated = [...prev];

            for (let i = 0; i < response.data.length; i++) {
              const uploadItem = response.data[i];
              const pendingFile = pendingFiles[i];
              if (!uploadItem || !pendingFile) continue;

              const idx = updated.findIndex((f) => f.id === pendingFile.id);

              const newFileState: FileState = {
                id: uploadItem.url,
                filename: uploadItem.filename,
                url: uploadItem.url,
                mimeType: uploadItem.mimetype,
                status: "success",
              };

              if (idx !== -1) {
                updated[idx] = newFileState;
              } else {
                updated.push(newFileState);
              }
            }

            if (process.env.NODE_ENV !== "production") {
              console.debug("[upload-ui] uploaded", { count: response.data.length });
            }
            return updated;
          });

          // Notify parent of new files
          if (onChange && uploadedFiles.length > 0) {
            // If multiple is false, replace existing files; otherwise append
            onChange(multiple ? [...(value ?? []), ...uploadedFiles] : uploadedFiles);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[upload-ui] error", err);
        }
        // Mark pending files as error
        const errorMessage =
          err instanceof Error ? err.message : "Upload gagal";

        setFiles((prev) =>
          prev.map((f) =>
            pendingFiles.some((pf) => pf.id === f.id)
              ? { ...f, status: "error" as const, error: errorMessage }
              : f
          )
        );

        // Handle specific error messages
        let displayError = "Upload gagal. Silakan coba lagi.";
        if (errorMessage === "UNSUPPORTED_MEDIA_TYPE") {
          displayError = "Tipe file tidak didukung";
        } else if (errorMessage === "PAYLOAD_TOO_LARGE") {
          displayError = `Ukuran file terlalu besar. Maksimal ${formatFileSize(maxSizeBytes)}`;
        } else if (errorMessage === "UNAUTHORIZED") {
          displayError = "Anda harus login untuk mengupload file";
        } else if (errorMessage === "STORAGE_UPLOAD_FAILED") {
          displayError = "Layanan penyimpanan tidak tersedia. Silakan coba lagi nanti.";
        } else if (errorMessage === "STORAGE_CONFIGURATION_MISSING") {
          displayError = "Konfigurasi penyimpanan file tidak ditemukan.";
        }

        setLocalError(displayError);

        // Remove error files after delay
        setTimeout(() => {
          setFiles((prev) =>
            prev.filter(
              (f) => !pendingFiles.some((pf) => pf.id === f.id)
            )
          );
        }, 3000);
      }
    },
    [
      ownerType,
      ownerId,
      multiple,
      maxFiles,
      maxSizeBytes,
      allowedMimeTypes,
      files.length,
      value,
      onChange,
    ]
  );

  /**
   * Handle file deletion.
   */
  const handleDelete = useCallback(
    async (fileState: FileState) => {
      // Guard against calls while disabled or uploading
      if (disabled || isUploading) {
        return;
      }

      if (!fileState.url) {
        // If no URL, just remove from local state
        setFiles((prev) => prev.filter((f) => f.id !== fileState.id));
        return;
      }

      // Mark as uploading while deleting
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileState.id ? { ...f, status: "uploading" as const } : f
        )
      );

      try {
        // Use 0 as placeholder ownerId if null (for new entities not yet created)
        await deleteFileAction(fileState.filename, {
          ownerType,
          ownerId: ownerId ?? 0,
        });

        // Remove from state
        setFiles((prev) => prev.filter((f) => f.id !== fileState.id));

        // Notify parent
        if (onChange) {
          onChange((value ?? []).filter((file) => file.url !== fileState.url));
        }
      } catch (err) {
        // Restore file state on error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileState.id
              ? { ...f, status: "success" as const }
              : f
          )
        );

        const errorMessage =
          err instanceof Error ? err.message : "Hapus gagal";
        setLocalError(
          errorMessage === "UNAUTHORIZED"
            ? "Anda tidak memiliki izin untuk menghapus file ini"
            : "Gagal menghapus file. Silakan coba lagi."
        );
      }
    },
    [ownerType, ownerId, value, onChange, disabled, isUploading]
  );

  /**
   * Trigger file input click.
   */
  const handleUploadClick = useCallback(() => {
    if (!disabled && !isUploading && !hasReachedLimit) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading, hasReachedLimit]);

  const displayError = error ?? localError;
  const hasError = !!displayError;

  return (
    <Field
      className={className}
      data-invalid={hasError || undefined}
      data-disabled={disabled || undefined}
    >
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      {description && <FieldDescription>{description}</FieldDescription>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        className="hidden"
        accept={acceptString}
        multiple={multiple}
        disabled={disabled || isUploading}
        onChange={handleFileSelect}
      />

      {/* Upload dropzone area */}
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed p-4 transition-colors",
          disabled
            ? "cursor-not-allowed bg-muted/50 border-muted"
            : hasReachedLimit
              ? "cursor-not-allowed border-muted bg-muted/20"
              : "cursor-pointer border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
        )}
        onClick={handleUploadClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleUploadClick();
          }
        }}
        role="button"
        tabIndex={disabled || hasReachedLimit ? -1 : 0}
        aria-label={label ? `Upload ${label}` : "Upload file"}
        aria-disabled={disabled || hasReachedLimit}
      >
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <div
            className={cn(
              "rounded-full p-3",
              disabled || hasReachedLimit
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            {isUploading ? (
              <Spinner className="size-6" />
            ) : (
              <Upload className="size-6" />
            )}
          </div>
          <div className="text-center">
            <p
              className={cn(
                "text-sm font-medium",
                disabled || hasReachedLimit
                  ? "text-muted-foreground"
                  : "text-foreground"
              )}
            >
              {isUploading
                ? "Mengupload..."
                : hasReachedLimit
                  ? multiple
                    ? `Maksimal ${maxFiles} file`
                    : "File sudah diupload"
                  : "Klik untuk upload"}
            </p>
            {!hasReachedLimit && (
              <p className="text-xs text-muted-foreground mt-1">
                Maksimal {formatFileSize(maxSizeBytes)} per file
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((fileState) => (
            <div
              key={fileState.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                fileState.status === "error"
                  ? "border-destructive/50 bg-destructive/5"
                  : fileState.status === "uploading"
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card"
              )}
            >
              {/* File icon or preview */}
              <div className="flex-shrink-0">
                {fileState.url && isImageFile(fileState.mimeType ?? "") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileState.url}
                    alt={fileState.filename}
                    className="size-10 rounded object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded",
                      fileState.status === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <FileTypeIcon
                      mimeType={fileState.mimeType}
                      className="size-5"
                    />
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    fileState.status === "error"
                      ? "text-destructive"
                      : "text-foreground"
                  )}
                >
                  {fileState.filename}
                </p>
                {fileState.status === "error" && fileState.error ? (
                  <p className="text-xs text-destructive">
                    {fileState.error}
                  </p>
                ) : fileState.size ? (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileState.size)}
                  </p>
                ) : null}
              </div>

              {/* Status / Delete button */}
              <div className="flex-shrink-0">
                {fileState.status === "uploading" ? (
                  <Spinner className="size-4" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(fileState);
                    }}
                    disabled={disabled || isUploading}
                    aria-label={`Hapus ${fileState.filename}`}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {displayError && <FieldError>{displayError}</FieldError>}
    </Field>
  );
}

export type { FileState };

