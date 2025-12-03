/**
 * FileUploadField Component Examples
 *
 * This file contains usage examples and documentation for the FileUploadField component.
 * It serves as a reference for developers on how to use the component in different scenarios.
 *
 * @note This is a documentation/example file, not a Storybook file.
 */

import { useState } from "react";
import { FileUploadField, type FileUploadValue } from "./file-upload-field";

/**
 * Example 1: Single File Upload
 *
 * Demonstrates single file upload for report attachments.
 * Use this pattern when you only need one file attachment.
 *
 * @example
 * ```tsx
 * function ReportForm() {
 *   const [attachments, setAttachments] = useState<FileUploadValue[]>([]);
 *
 *   return (
 *     <FileUploadField
 *       ownerType="report"
 *       ownerId={123}
 *       value={attachments}
 *       onChange={setAttachments}
 *       label="Lampiran Laporan"
 *       description="Upload file pendukung laporan (gambar atau PDF, max 4.5MB)"
 *     />
 *   );
 * }
 * ```
 */
export function SingleFileUploadExample() {
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadValue[]>([]);

  return (
    <div className="max-w-md space-y-4">
      <h3 className="text-lg font-semibold">Single File Upload</h3>
      <FileUploadField
        ownerType="report"
        ownerId={123}
        value={uploadedFiles}
        onChange={setUploadedFiles}
        label="Lampiran Laporan"
        description="Upload file pendukung laporan (gambar atau PDF, max 4.5MB)"
      />
      <div className="text-sm text-muted-foreground">
        Uploaded files: {JSON.stringify(uploadedFiles)}
      </div>
    </div>
  );
}

/**
 * Example 2: Multiple File Upload
 *
 * Demonstrates multiple file upload for task submissions.
 * Use `multiple={true}` and optionally `maxFiles` to limit the number of files.
 *
 * @example
 * ```tsx
 * function TaskSubmissionForm() {
 *   const [attachments, setAttachments] = useState<FileUploadValue[]>([]);
 *
 *   return (
 *     <FileUploadField
 *       ownerType="task"
 *       ownerId={456}
 *       value={attachments}
 *       onChange={setAttachments}
 *       multiple
 *       maxFiles={5}
 *       label="File Tugas"
 *       description="Upload maksimal 5 file untuk tugas ini"
 *     />
 *   );
 * }
 * ```
 */
export function MultipleFileUploadExample() {
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadValue[]>([]);

  return (
    <div className="max-w-md space-y-4">
      <h3 className="text-lg font-semibold">Multiple File Upload</h3>
      <FileUploadField
        ownerType="task"
        ownerId={456}
        value={uploadedFiles}
        onChange={setUploadedFiles}
        multiple
        maxFiles={5}
        label="File Tugas"
        description="Upload maksimal 5 file untuk tugas ini"
      />
      <div className="text-sm text-muted-foreground">
        Total files: {uploadedFiles.length}
      </div>
    </div>
  );
}

/**
 * Example 3: With Custom Validation
 *
 * Shows custom `accept` prop for specific file types and custom `maxSizeBytes`.
 * Use this when you need to restrict uploads to specific file formats.
 *
 * @example
 * ```tsx
 * function ImageOnlyUpload() {
 *   const [images, setImages] = useState<FileUploadValue[]>([]);
 *
 *   return (
 *     <FileUploadField
 *       ownerType="assessment"
 *       ownerId={789}
 *       value={images}
 *       onChange={setImages}
 *       accept="image/jpeg,image/png,image/webp"
 *       maxSizeBytes={2 * 1024 * 1024} // 2MB max
 *       label="Foto Bukti"
 *       description="Hanya gambar (JPG, PNG, WebP), maksimal 2MB"
 *     />
 *   );
 * }
 * ```
 */
export function CustomValidationExample() {
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadValue[]>([]);

  return (
    <div className="max-w-md space-y-4">
      <h3 className="text-lg font-semibold">Image Only Upload (2MB max)</h3>
      <FileUploadField
        ownerType="assessment"
        ownerId={789}
        value={uploadedFiles}
        onChange={setUploadedFiles}
        accept="image/jpeg,image/png,image/webp"
        maxSizeBytes={2 * 1024 * 1024}
        label="Foto Bukti"
        description="Hanya gambar (JPG, PNG, WebP), maksimal 2MB"
      />
    </div>
  );
}

/**
 * Example 4: Disabled State
 *
 * Shows disabled upload field with read-only file list.
 * Use this when the form is submitted or in view-only mode.
 *
 * @example
 * ```tsx
 * function SubmittedReport({ attachments }: { attachments: FileUploadValue[] }) {
 *   return (
 *     <FileUploadField
 *       ownerType="final_report"
 *       ownerId={101}
 *       value={attachments}
 *       disabled
 *       label="Lampiran"
 *       description="Laporan sudah dikirim"
 *     />
 *   );
 * }
 * ```
 */
export function DisabledStateExample() {
  // Pre-populated with existing files
  const existingFiles: FileUploadValue[] = [
    { url: "https://storage.example.com/files/document1.pdf", filename: "document1.pdf" },
    { url: "https://storage.example.com/files/image1.webp", filename: "image1.webp" },
  ];

  return (
    <div className="max-w-md space-y-4">
      <h3 className="text-lg font-semibold">Disabled State (Read-only)</h3>
      <FileUploadField
        ownerType="final_report"
        ownerId={101}
        value={existingFiles}
        disabled
        label="Lampiran"
        description="Laporan sudah dikirim"
      />
    </div>
  );
}

/**
 * Example 5: Integration with Form
 *
 * Shows integration with form state management and form submission.
 * This example demonstrates how to use FileUploadField within a complete form.
 *
 * @example
 * ```tsx
 * function CompleteReportForm() {
 *   const [formData, setFormData] = useState({
 *     title: "",
 *     content: "",
 *     attachments: [] as FileUploadValue[],
 *   });
 *   const [isSubmitting, setIsSubmitting] = useState(false);
 *
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *
 *     // Validate that at least one attachment is provided
 *     if (formData.attachments.length === 0) {
 *       alert("Please upload at least one file");
 *       return;
 *     }
 *
 *     setIsSubmitting(true);
 *
 *     try {
 *       // Submit form with attachments
 *       await submitReport({
 *         title: formData.title,
 *         content: formData.content,
 *         attachments: formData.attachments,
 *       });
 *     } finally {
 *       setIsSubmitting(false);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         value={formData.title}
 *         onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
 *         placeholder="Judul Laporan"
 *       />
 *
 *       <textarea
 *         value={formData.content}
 *         onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
 *         placeholder="Isi Laporan"
 *       />
 *
 *       <FileUploadField
 *         ownerType="report"
 *         ownerId={reportId}
 *         value={formData.attachments}
 *         onChange={(files) => setFormData(prev => ({ ...prev, attachments: files }))}
 *         multiple
 *         maxFiles={3}
 *         label="Lampiran"
 *         description="Upload file pendukung (max 3 file)"
 *         disabled={isSubmitting}
 *       />
 *
 *       <button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function FormIntegrationExample() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    attachments: [] as FileUploadValue[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formData.title.trim()) {
      setError("Judul laporan wajib diisi");
      return;
    }
    if (!formData.content.trim()) {
      setError("Isi laporan wajib diisi");
      return;
    }
    if (formData.attachments.length === 0) {
      setError("Minimal 1 file harus diupload");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    alert(`Form submitted with ${formData.attachments.length} attachment(s)`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <h3 className="text-lg font-semibold">Complete Form Example</h3>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Judul Laporan</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="Masukkan judul laporan"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Isi Laporan</label>
        <textarea
          value={formData.content}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, content: e.target.value }))
          }
          className="mt-1 h-24 w-full rounded-md border px-3 py-2"
          placeholder="Masukkan isi laporan"
          disabled={isSubmitting}
        />
      </div>

      <FileUploadField
        ownerType="report"
        ownerId={999}
        value={formData.attachments}
        onChange={(files) =>
          setFormData((prev) => ({ ...prev, attachments: files }))
        }
        multiple
        maxFiles={3}
        label="Lampiran"
        description="Upload file pendukung (max 3 file)"
        disabled={isSubmitting}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
      </button>
    </form>
  );
}

/**
 * ========================
 * USAGE NOTES
 * ========================
 *
 * 1. ownerType and ownerId Requirements:
 *    - ownerType must be one of: "task" | "report" | "final_report" | "assessment"
 *    - ownerId should be the ID of the parent entity (e.g., report ID, task ID)
 *    - These are required for the server to associate uploaded files with the correct entity
 *
 * 2. Upload Flow:
 *    - User selects file(s) via click or drag-and-drop
 *    - Client-side validation runs (file type, size, max files)
 *    - If validation passes, FormData is created and sent to uploadFilesAction
 *    - Server compresses images to webp format
 *    - Files are uploaded to external storage
 *    - Attachment records are created in the database
 *    - URLs are returned and passed to onChange callback
 *
 * 3. File Validation Rules (from storage.ts):
 *    - Allowed mime types: image/jpeg, image/png, image/webp, application/pdf
 *    - Maximum file size: 4.5MB (DEFAULT_MAX_SIZE_BYTES)
 *    - Images are automatically compressed to webp format on server
 *
 * 4. Delete Flow:
 *    - User clicks delete button on a file
 *    - deleteFileAction is called with filename and owner info
 *    - File is deleted from external storage
 *    - Attachment record is deleted from database
 *    - URL is removed from value array via onChange callback
 *
 * 5. Error Handling:
 *    - UNSUPPORTED_MEDIA_TYPE: File type not allowed
 *    - PAYLOAD_TOO_LARGE: File exceeds size limit
 *    - UNAUTHORIZED: User not logged in
 *    - STORAGE_UPLOAD_FAILED: Upload to external storage failed
 *
 * 6. Controlled Component Pattern:
 *    - value prop: Array of FileUploadValue objects ({ url, filename? })
 *    - onChange prop: Callback when files change (add/remove)
 *    - Parent component owns the state and can sync with form libraries
 */

