"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";

// Loading fallback component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
        <Spinner className="size-6" />
    </div>
);

// Dynamic imports for heavy dialog components
// These are loaded only when needed, reducing initial bundle size

export const DynamicFileUploadField = dynamic(
    () => import("@/components/ui/file-upload-field").then((mod) => mod.FileUploadField),
    {
        loading: LoadingSpinner,
        ssr: false,
    }
);

// Add more dynamic imports for heavy components as needed
// Example:
// export const DynamicPDFViewer = dynamic(
//   () => import("@/components/pdf-viewer"),
//   { loading: LoadingSpinner, ssr: false }
// );
