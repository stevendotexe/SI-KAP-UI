/**
 * HTML Sanitization Utility
 * 
 * Sanitizes HTML content to prevent XSS attacks while allowing safe formatting tags.
 * Only whitelisted tags and attributes are allowed.
 */

// Whitelist of allowed HTML tags
const ALLOWED_TAGS = new Set([
    'b', 'i', 'u', 'strong', 'em', 'br', 'p', 'ul', 'ol', 'li', 'span', 'div'
]);

// Whitelist of allowed attributes (currently none for security)
const ALLOWED_ATTRS: Record<string, string[]> = {
    // Future: could allow 'class' on certain tags if needed
};

/**
 * Sanitize HTML string by removing dangerous tags and attributes
 * @param html - Raw HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHTML(html: string): string {
    if (!html) return '';

    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replace(/data:text\/html/gi, '');

    // Strip tags that are not in whitelist
    sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
        const tagLower = tag.toLowerCase();

        // If tag is not allowed, remove it completely
        if (!ALLOWED_TAGS.has(tagLower)) {
            return '';
        }

        // For allowed tags, strip all attributes for now (security)
        // Self-closing tags
        if (match.endsWith('/>')) {
            return `<${tagLower} />`;
        }

        // Opening tags
        if (!match.startsWith('</')) {
            return `<${tagLower}>`;
        }

        // Closing tags
        return `</${tagLower}>`;
    });

    return sanitized;
}

/**
 * Convert plain text with newlines to HTML with <br> tags
 * Useful for preserving line breaks in user input
 */
export function nl2br(text: string): string {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
}

/**
 * Strip all HTML tags from string
 * Useful for creating plain text previews
 */
export function stripHTML(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
}
