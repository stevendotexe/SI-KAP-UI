"use client";

import { sanitizeHTML } from "@/lib/html-utils";

interface SafeHTMLProps {
    html: string;
    className?: string;
}

/**
 * SafeHTML Component
 * 
 * Renders HTML content safely by sanitizing it first.
 * Use this component instead of dangerouslySetInnerHTML directly.
 * 
 * @example
 * <SafeHTML 
 *   html={data.description} 
 *   className="text-sm prose prose-sm max-w-none"
 * />
 */
export function SafeHTML({ html, className }: SafeHTMLProps) {
    const sanitized = sanitizeHTML(html);

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    );
}
