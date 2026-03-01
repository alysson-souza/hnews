import DOMPurify from 'dompurify';

/** Sanitize HTML to prevent XSS attacks while preserving formatting */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'blockquote', 'a', 'pre', 'code', 'br', 'i', 'em', 'b', 'strong', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    KEEP_CONTENT: true,
  });
}
