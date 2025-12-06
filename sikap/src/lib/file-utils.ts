/**
 * File utility functions for handling file operations across the application.
 */

/**
 * Format file size in bytes to human-readable string.
 * @param bytes - File size in bytes
 * @returns Human-readable string (e.g., "1.5 MB", "250 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, units.length - 1);

  const size = bytes / Math.pow(k, unitIndex);
  const formatted = size % 1 === 0 ? size.toString() : size.toFixed(1);

  return `${formatted} ${units[unitIndex]}`;
}

/**
 * Extract file extension from filename.
 * @param filename - The filename to extract extension from
 * @returns Lowercase extension without dot (e.g., "pdf", "jpg")
 */
export function getFileExtension(filename: string): string {
  if (!filename) return "";
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1]?.toLowerCase() ?? "";
}

/**
 * Check if mime type is an image type.
 * @param mimeType - The mime type to check
 * @returns Boolean indicating if it's an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Extract filename from a URL.
 * Handles URLs from buildPublicUrl pattern (e.g., /files/filename.webp)
 * @param url - The URL to parse
 * @returns Filename string
 */
export function extractFilenameFromUrl(url: string): string {
  if (!url) return "";
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/");
    return parts[parts.length - 1] ?? "";
  } catch {
    // If URL parsing fails, try simple split
    const parts = url.split("/");
    return parts[parts.length - 1] ?? "";
  }
}

/**
 * Validation result type for file validation functions.
 */
export type FileValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * Default allowed mime types matching the server-side validation.
 */
export const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/**
 * Default max file size (4.5MB) matching the server-side validation.
 */
export const DEFAULT_MAX_SIZE_BYTES = 4.5 * 1024 * 1024;

/**
 * Validate file type against allowed mime types.
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed mime types
 * @returns Validation result with error message if invalid
 */
export function validateFileType(
  file: File,
  allowedTypes: string[] = DEFAULT_ALLOWED_MIME_TYPES
): FileValidationResult {
  if (!file.type) {
    return {
      valid: false,
      error: "File type tidak dapat dideteksi",
    };
  }

  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map((type) => type.split("/")[1])
      .join(", ");
    return {
      valid: false,
      error: `Tipe file tidak didukung. Gunakan: ${allowedExtensions}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size against maximum allowed size.
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns Validation result with error message if too large
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number = DEFAULT_MAX_SIZE_BYTES
): FileValidationResult {
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${formatFileSize(maxSizeBytes)}`,
    };
  }

  return { valid: true };
}

/**
 * Validate a file against both type and size constraints.
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed mime types
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: File,
  allowedTypes: string[] = DEFAULT_ALLOWED_MIME_TYPES,
  maxSizeBytes: number = DEFAULT_MAX_SIZE_BYTES
): FileValidationResult {
  const typeResult = validateFileType(file, allowedTypes);
  if (!typeResult.valid) return typeResult;

  const sizeResult = validateFileSize(file, maxSizeBytes);
  if (!sizeResult.valid) return sizeResult;

  return { valid: true };
}





