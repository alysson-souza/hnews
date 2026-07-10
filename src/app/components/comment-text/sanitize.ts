import DOMPurify, { type Config } from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'blockquote',
  'a',
  'pre',
  'code',
  'br',
  'i',
  'em',
  'b',
  'strong',
  'span',
] as const;
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'class'] as const;
const ALLOWED_TAG_SET = new Set<string>(ALLOWED_TAGS);
const ALLOWED_ATTR_SET = new Set<string>(ALLOWED_ATTR);
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template']);
const SAFE_URL_PATTERN =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i;

const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: [...ALLOWED_ATTR],
  KEEP_CONTENT: true,
};

let domPurifyUsable: boolean | undefined;

/** Sanitize HTML to prevent XSS attacks while preserving formatting */
export function sanitizeHtml(html: string): string {
  if (canUseDOMPurify()) {
    return DOMPurify.sanitize(html, SANITIZE_CONFIG);
  }

  return sanitizeWithAllowlist(html);
}

function canUseDOMPurify(): boolean {
  if (domPurifyUsable !== undefined) {
    return domPurifyUsable;
  }

  try {
    const result = DOMPurify.sanitize(
      '<p>safe</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>',
      SANITIZE_CONFIG,
    );
    domPurifyUsable =
      typeof result === 'string' &&
      result.includes('<p>safe</p>') &&
      !result.includes('<script') &&
      !result.includes('javascript:');
  } catch {
    domPurifyUsable = false;
  }

  return domPurifyUsable;
}

function sanitizeWithAllowlist(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }

  const template = document.createElement('template');
  template.innerHTML = html;
  sanitizeChildren(template.content);
  return template.innerHTML;
}

function sanitizeChildren(parent: Node): void {
  const children = Array.from(parent.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const element = child as Element;
    const tagName = element.tagName.toLowerCase();

    if (DROP_WITH_CONTENT.has(tagName)) {
      element.remove();
      continue;
    }

    sanitizeChildren(element);

    if (!ALLOWED_TAG_SET.has(tagName)) {
      unwrapElement(element);
      continue;
    }

    sanitizeAttributes(element);
  }
}

function unwrapElement(element: Element): void {
  const parent = element.parentNode;
  if (!parent) {
    element.remove();
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  element.remove();
}

function sanitizeAttributes(element: Element): void {
  for (const attr of Array.from(element.attributes)) {
    const attrName = attr.name.toLowerCase();
    if (!ALLOWED_ATTR_SET.has(attrName)) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (attrName === 'href' && !isSafeUrl(attr.value)) {
      element.removeAttribute(attr.name);
    }
  }
}

function isSafeUrl(value: string): boolean {
  return SAFE_URL_PATTERN.test(stripAsciiWhitespace(value));
}

function stripAsciiWhitespace(value: string): string {
  return Array.from(value)
    .filter((char) => char.charCodeAt(0) > 0x20)
    .join('');
}
