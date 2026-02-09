// ---------------------------------------------------------------------------
// Pure utility functions extracted from the Cloudflare Pages Function worker.
// These are exported so they can be unit-tested independently.
// ---------------------------------------------------------------------------

export const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
};

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// URL / SSRF validation
// ---------------------------------------------------------------------------

/**
 * Validate that a URL is a safe, public HTTP(S) URL.
 * Blocks SSRF vectors: private IPs, loopback, link-local, metadata endpoints,
 * non-HTTP schemes, and hostnames that resolve to numeric-only labels.
 */
export function isSafePublicUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  // Block credentials in URL
  if (parsed.username || parsed.password) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block IP-based hostnames (IPv4 and IPv6) to prevent SSRF.
  // Only domain-name hostnames are allowed.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return null; // IPv4
  if (hostname.startsWith('[') || hostname.includes(':')) return null; // IPv6

  // Block well-known internal/metadata hostnames
  const blockedHosts = [
    'localhost',
    'metadata.google.internal',
    'metadata.google',
    'instance-data',
    'kubernetes.default',
  ];
  if (blockedHosts.includes(hostname)) return null;

  // Block .internal, .local, .localhost TLDs
  if (
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost')
  ) {
    return null;
  }

  // Block AWS metadata endpoint (169.254.169.254 is caught above as IPv4,
  // but also block the magic hostname if it ever resolves)
  if (hostname === '169.254.169.254') return null;

  // Require at least one dot (no bare hostnames like "intranet")
  if (!hostname.includes('.')) return null;

  // Block non-standard ports that are commonly used for internal services
  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;
  const allowedPorts = [80, 443, 8080, 8443];
  if (!allowedPorts.includes(port)) return null;

  return parsed;
}

// ---------------------------------------------------------------------------
// HTML meta extraction
// ---------------------------------------------------------------------------

export function matchMetaContent(html: string, key: string): string | null {
  const re1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`,
    'i',
  );
  return html.match(re1)?.[1] || html.match(re2)?.[1] || null;
}

export function matchHtmlTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || null;
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

export function resolveImageUrl(raw: string, base: URL): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `${base.protocol}${trimmed}`;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

export function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    '&quot;': '"',
    '&#34;': '"',
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&#39;': "'",
    '&#x27;': "'",
    '&apos;': "'",
  };
  return value.replace(/&[a-z#0-9x]+;/gi, (m) => named[m] ?? m);
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + '…';
}

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function stripHtml(value: string): string {
  return decodeEntities(
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

// ---------------------------------------------------------------------------
// Object helpers
// ---------------------------------------------------------------------------

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}

export function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const value = obj[key];
  return typeof value === 'number' ? value : undefined;
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

export function safeHostname(rawUrl: string): string | undefined {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function absoluteUrl(path: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function isAssetPath(pathname: string): boolean {
  return /\.[a-z0-9]+$/i.test(pathname);
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

export function jsonResponse(
  data: unknown,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

// ---------------------------------------------------------------------------
// OG Meta types
// ---------------------------------------------------------------------------

export interface OgMeta {
  imageUrl: string | null;
  title: string | null;
  description: string | null;
}
