/**
 * HTML Sanitization Utility
 *
 * Provides functions to sanitize HTML content to prevent XSS attacks.
 * Uses a whitelist approach - only explicitly allowed tags and attributes are preserved.
 */

/**
 * Allowed HTML tags for sanitized content.
 * These are safe tags that don't execute scripts or load external resources.
 */
const ALLOWED_TAGS = new Set([
  // Text formatting
  "p",
  "br",
  "b",
  "i",
  "u",
  "strong",
  "em",
  "s",
  "strike",
  "del",
  "ins",
  "sub",
  "sup",
  "mark",
  "small",
  "span",
  // Headings
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  // Lists
  "ul",
  "ol",
  "li",
  // Block elements
  "div",
  "blockquote",
  "pre",
  "code",
  "hr",
  // Tables
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  // Links (href will be validated)
  "a",
]);

/**
 * Allowed attributes per tag.
 * Only these attributes will be preserved during sanitization.
 */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  "*": new Set(["class", "id", "style"]),
};

/**
 * Dangerous URL protocols that should be blocked.
 */
const DANGEROUS_PROTOCOLS = [
  "javascript:",
  "vbscript:",
  "data:",
  "file:",
];

/**
 * Check if a URL is safe (doesn't use dangerous protocols).
 */
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  return !DANGEROUS_PROTOCOLS.some((protocol) =>
    trimmed.startsWith(protocol)
  );
}

/**
 * Escape special HTML characters in text content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Simple HTML parser state
 */
type ParseState = {
  result: string;
  index: number;
  html: string;
};

/**
 * Parse and sanitize an HTML attribute value.
 */
function sanitizeAttribute(
  tagName: string,
  attrName: string,
  attrValue: string
): string | null {
  const normalizedAttr = attrName.toLowerCase();
  const normalizedTag = tagName.toLowerCase();

  // Check if attribute is allowed for this tag or globally
  const tagAttrs = ALLOWED_ATTRIBUTES[normalizedTag];
  const globalAttrs = ALLOWED_ATTRIBUTES["*"];

  const isAllowed =
    tagAttrs?.has(normalizedAttr) || globalAttrs?.has(normalizedAttr);

  if (!isAllowed) {
    return null;
  }

  // Validate URL attributes
  if (normalizedAttr === "href" || normalizedAttr === "src") {
    if (!isSafeUrl(attrValue)) {
      return null;
    }
  }

  // For style attribute, do basic sanitization
  if (normalizedAttr === "style") {
    // Remove any potential script injection via CSS
    const sanitizedStyle = attrValue
      .replace(/expression\s*\(/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/@import/gi, "")
      .replace(/behavior\s*:/gi, "");
    return sanitizedStyle;
  }

  return attrValue;
}

/**
 * Parse attributes from a tag string.
 */
function parseAttributes(attrString: string): Map<string, string> {
  const attrs = new Map<string, string>();
  // Match attribute patterns: name="value", name='value', or name=value
  const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = attrRegex.exec(attrString)) !== null) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (name) {
      attrs.set(name.toLowerCase(), value);
    }
  }

  return attrs;
}

/**
 * Sanitize HTML content by removing dangerous elements and attributes.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```ts
 * const unsafe = '<script>alert("xss")</script><p>Hello</p>';
 * const safe = sanitizeHtml(unsafe);
 * // safe = '<p>Hello</p>'
 * ```
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) {
    return "";
  }

  let result = "";
  let index = 0;
  const len = html.length;

  while (index < len) {
    const tagStart = html.indexOf("<", index);

    if (tagStart === -1) {
      // No more tags, append rest as text
      result += escapeHtml(html.slice(index));
      break;
    }

    // Append text before the tag
    if (tagStart > index) {
      result += escapeHtml(html.slice(index, tagStart));
    }

    // Check for comment
    if (html.slice(tagStart, tagStart + 4) === "<!--") {
      const commentEnd = html.indexOf("-->", tagStart + 4);
      if (commentEnd === -1) {
        index = len;
      } else {
        index = commentEnd + 3;
      }
      continue;
    }

    // Find tag end
    const tagEnd = html.indexOf(">", tagStart);
    if (tagEnd === -1) {
      // Malformed tag, escape rest
      result += escapeHtml(html.slice(tagStart));
      break;
    }

    const fullTag = html.slice(tagStart + 1, tagEnd);
    const isClosing = fullTag.startsWith("/");
    const isSelfClosing = fullTag.endsWith("/");

    // Parse tag name and attributes
    const tagContent = isClosing ? fullTag.slice(1) : fullTag;
    const spaceIndex = tagContent.search(/[\s/]/);
    const tagName =
      spaceIndex === -1
        ? tagContent.replace(/\/$/, "")
        : tagContent.slice(0, spaceIndex);
    const attrString =
      spaceIndex === -1 ? "" : tagContent.slice(spaceIndex).replace(/\/$/, "");

    const normalizedTagName = tagName.toLowerCase();

    if (ALLOWED_TAGS.has(normalizedTagName)) {
      if (isClosing) {
        result += `</${normalizedTagName}>`;
      } else {
        // Build sanitized opening tag
        const attrs = parseAttributes(attrString);
        let sanitizedAttrs = "";

        for (const [name, value] of attrs) {
          const sanitizedValue = sanitizeAttribute(
            normalizedTagName,
            name,
            value
          );
          if (sanitizedValue !== null) {
            sanitizedAttrs += ` ${name}="${escapeHtml(sanitizedValue)}"`;
          }
        }

        // For anchor tags, add rel="noopener noreferrer" if target="_blank"
        if (
          normalizedTagName === "a" &&
          attrs.get("target") === "_blank" &&
          !attrs.has("rel")
        ) {
          sanitizedAttrs += ' rel="noopener noreferrer"';
        }

        if (isSelfClosing) {
          result += `<${normalizedTagName}${sanitizedAttrs} />`;
        } else {
          result += `<${normalizedTagName}${sanitizedAttrs}>`;
        }
      }
    }
    // If tag not allowed, it's simply stripped (not included in result)

    index = tagEnd + 1;
  }

  return result;
}

/**
 * Check if a string contains potentially dangerous HTML.
 *
 * @param html - The HTML string to check
 * @returns true if the HTML contains potentially dangerous content
 */
export function containsDangerousHtml(html: string | null | undefined): boolean {
  if (!html) {
    return false;
  }

  const dangerous = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<link/i,
    /<meta/i,
  ];

  return dangerous.some((pattern) => pattern.test(html));
}





