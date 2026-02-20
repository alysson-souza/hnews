import {
  absoluteUrl,
  CORS_HEADERS,
  decodeEntities,
  escapeAttr,
  getNumber,
  getString,
  isAssetPath,
  isRecord,
  isSafePublicUrl,
  jsonResponse,
  matchHtmlTitle,
  matchMetaContent,
  MAX_IMAGE_SIZE,
  resolveImageUrl,
  safeHostname,
  stripHtml,
  truncate,
  type OgMeta,
} from './utils';

interface Env {
  HN_API_BASE: string;
  SITE_URL: string;
  DEFAULT_OG_IMAGE: string;
  ASSETS: Fetcher;
}

const CRAWLER_UA_RE =
  /Slackbot|Twitterbot|facebookexternalhit|LinkedInBot|Discordbot|WhatsApp|Applebot|com\.apple\.social|SocialLayer|iMessage|Apple-PubSub|TelegramBot|bingbot|Googlebot|DuckDuckBot/i;

const FEED_ROUTES: Record<string, { title: string; description: string }> = {
  '/top': {
    title: 'Top Stories | HNews',
    description: 'Browse top stories on HNews.',
  },
  '/best': {
    title: 'Best Stories | HNews',
    description: 'Browse best stories on HNews.',
  },
  '/new': {
    title: 'New Stories | HNews',
    description: 'Browse newest stories on HNews.',
  },
  '/newest': {
    title: 'Newest Stories | HNews',
    description: 'Browse newest stories on HNews.',
  },
  '/ask': {
    title: 'Ask HN | HNews',
    description: 'Browse Ask HN on HNews.',
  },
  '/show': {
    title: 'Show HN | HNews',
    description: 'Browse Show HN on HNews.',
  },
  '/jobs': {
    title: 'Jobs | HNews',
    description: 'Browse jobs on HNews.',
  },
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const userAgent = request.headers.get('user-agent') || '';

  // API routes — must be checked before static-asset or SPA fallback.
  if (pathname === '/api/og-image') {
    return handleOgImageApi(url);
  }
  if (pathname === '/api/og-image-proxy') {
    return handleOgImageProxy(url);
  }

  // Serve static assets directly via ASSETS binding.
  if (isAssetPath(pathname)) {
    return env.ASSETS.fetch(request);
  }

  const isCrawler = CRAWLER_UA_RE.test(userAgent);

  let meta: {
    title: string;
    description: string;
    image: string | null;
    type: 'article' | 'website';
  } | null = null;

  if (isCrawler) {
    try {
      meta = await buildMetaForPath(pathname, env);
    } catch {
      meta = null;
    }
  }

  // Fetch index.html directly via ASSETS binding for SPA routing.
  const indexRequest = new Request(new URL('/index.html', url), {
    method: 'GET',
    headers: { 'accept-encoding': 'identity' },
  });
  const response = await env.ASSETS.fetch(indexRequest);

  if (!response.ok) {
    return response;
  }

  // For non-crawlers, just return the index.html (SPA routing).
  if (!isCrawler || !meta) {
    return response;
  }

  const html = await response.text();
  const injected = injectMeta(html, meta, pathname, env);

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300');
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('etag');

  return new Response(injected, {
    status: 200,
    statusText: 'OK',
    headers,
  });
};

async function buildMetaForPath(pathname: string, env: Env) {
  if (pathname === '/' || pathname === '') {
    return {
      title: 'HNews - Hacker News Reader',
      description: 'Alternative frontend for Hacker News.',
      image: absoluteUrl(env.DEFAULT_OG_IMAGE, env.SITE_URL),
      type: 'website' as const,
    };
  }

  if (pathname === '/search') {
    return {
      title: 'Search | HNews',
      description: 'Search Hacker News stories and comments on HNews.',
      image: absoluteUrl(env.DEFAULT_OG_IMAGE, env.SITE_URL),
      type: 'website' as const,
    };
  }

  const feed = FEED_ROUTES[pathname];
  if (feed) {
    return {
      title: feed.title,
      description: feed.description,
      image: absoluteUrl(env.DEFAULT_OG_IMAGE, env.SITE_URL),
      type: 'website' as const,
    };
  }

  const itemMatch = pathname.match(/^\/item\/(\d+)$/);
  if (itemMatch) {
    const id = Number(itemMatch[1]);
    const item = await fetchJSON(`${env.HN_API_BASE}/item/${id}.json`);
    if (!isRecord(item)) return null;

    const itemType = getString(item, 'type');

    if (itemType === 'comment') {
      const text = truncate(stripHtml(String(getString(item, 'text') || '')), 200);
      let parentTitle = '';
      const parentId = getNumber(item, 'parent');
      if (typeof parentId === 'number') {
        const parent = await fetchJSON(`${env.HN_API_BASE}/item/${parentId}.json`);
        if (isRecord(parent)) {
          const title = getString(parent, 'title');
          if (title) parentTitle = title;
        }
      }

      const description = parentTitle ? `Re: ${parentTitle} — ${text}` : text;
      return {
        title: `Comment by ${getString(item, 'by') || 'unknown'} | HNews`,
        description: description || 'Hacker News comment.',
        image: absoluteUrl(env.DEFAULT_OG_IMAGE, env.SITE_URL),
        type: 'article' as const,
      };
    }

    if (itemType === 'story' || itemType === 'job' || itemType === 'poll') {
      const title = String(getString(item, 'title') || 'HNews');
      const score = getNumber(item, 'score');
      const author = getString(item, 'by');
      const descendants = getNumber(item, 'descendants');
      const kids = item['kids'];
      const comments =
        typeof descendants === 'number'
          ? descendants
          : Array.isArray(kids)
            ? kids.length
            : undefined;
      const itemUrl = getString(item, 'url');
      const domain = itemUrl ? safeHostname(itemUrl) : undefined;

      const parts: string[] = [];
      if (typeof score === 'number') parts.push(`${score} points`);
      if (author) parts.push(`by ${author}`);
      if (typeof comments === 'number') parts.push(`${comments} comments`);
      if (domain) parts.push(domain);

      const description = parts.join(' | ') || 'Hacker News story.';
      let image: string | null = null;
      if (itemUrl && isSafePublicUrl(itemUrl)) {
        image = await fetchArticleImage(itemUrl);
      }

      return {
        title,
        description,
        image,
        type: 'article' as const,
      };
    }
  }

  const userMatch = pathname.match(/^\/user\/([^/]+)$/);
  if (userMatch) {
    const id = decodeURIComponent(userMatch[1]);
    const user = await fetchJSON(`${env.HN_API_BASE}/user/${encodeURIComponent(id)}.json`);
    if (!isRecord(user)) return null;

    const karma = getNumber(user, 'karma') ?? 0;
    const created = getNumber(user, 'created') ?? 0;
    const date = created ? new Date(created * 1000).toISOString().slice(0, 10) : 'unknown date';

    return {
      title: `${id} | HNews`,
      description: `${karma} karma | Member since ${date}`,
      image: absoluteUrl(env.DEFAULT_OG_IMAGE, env.SITE_URL),
      type: 'website' as const,
    };
  }

  return {
    title: 'HNews - Hacker News Reader',
    description: 'Alternative frontend for Hacker News.',
    image: absoluteUrl(env.DEFAULT_OG_IMAGE, env.SITE_URL),
    type: 'website' as const,
  };
}

async function fetchJSON(url: string) {
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) return null;
  return (await res.json()) as unknown;
}

export async function fetchArticleOgMeta(articleUrl: string): Promise<OgMeta> {
  const empty: OgMeta = { imageUrl: null, title: null, description: null };

  let parsed: URL;
  try {
    parsed = new URL(articleUrl);
  } catch {
    return empty;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'HNews OG Fetcher',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok || !res.body) return empty;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let bytesRead = 0;
    let htmlChunk = '';

    while (bytesRead < 50 * 1024) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      bytesRead += value.byteLength;
      htmlChunk += decoder.decode(value, { stream: true });
      if (htmlChunk.includes('</head>')) {
        break;
      }
    }

    const ogImage = matchMetaContent(htmlChunk, 'og:image');
    const twImage = matchMetaContent(htmlChunk, 'twitter:image');
    const candidate = ogImage || twImage;

    // Title: og:title → twitter:title → <title>
    const ogTitle =
      matchMetaContent(htmlChunk, 'og:title') ||
      matchMetaContent(htmlChunk, 'twitter:title') ||
      matchHtmlTitle(htmlChunk);

    // Description: og:description → twitter:description → meta description
    const ogDesc =
      matchMetaContent(htmlChunk, 'og:description') ||
      matchMetaContent(htmlChunk, 'twitter:description') ||
      matchMetaContent(htmlChunk, 'description');

    return {
      imageUrl: candidate ? resolveImageUrl(candidate, parsed) : null,
      title: ogTitle ? truncate(decodeEntities(ogTitle), 200) : null,
      description: ogDesc ? truncate(decodeEntities(ogDesc), 300) : null,
    };
  } catch {
    return empty;
  } finally {
    clearTimeout(timeout);
  }
}

/** Legacy wrapper used by buildMetaForPath — returns only the image URL. */
async function fetchArticleImage(articleUrl: string): Promise<string | null> {
  const meta = await fetchArticleOgMeta(articleUrl);
  return meta.imageUrl;
}

function injectMeta(
  html: string,
  meta: { title: string; description: string; image: string | null; type: 'article' | 'website' },
  pathname: string,
  env: Env,
) {
  const cleaned = html.replace(
    /<meta\b[^>]*(?:property|name)=["'](?:og:|twitter:)[^"']*["'][^>]*>\s*/gi,
    '',
  );
  const ogUrl = absoluteUrl(pathname, env.SITE_URL);
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  const type = meta.type;

  const imageTags = meta.image
    ? `
<meta property="og:image" content="${escapeAttr(meta.image)}">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${escapeAttr(meta.image)}">`
    : `
<meta name="twitter:card" content="summary">`;

  const tags = `
<meta property="og:type" content="${type}">
<meta property="og:url" content="${ogUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:site_name" content="HNews">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">${imageTags}`;

  const idx = cleaned.toLowerCase().indexOf('</title>');
  if (idx !== -1) {
    return cleaned.slice(0, idx + 8) + tags + cleaned.slice(idx + 8);
  }

  const headIdx = cleaned.toLowerCase().indexOf('<head>');
  if (headIdx !== -1) {
    return cleaned.slice(0, headIdx + 6) + tags + cleaned.slice(headIdx + 6);
  }

  return tags + cleaned;
}

// ---------------------------------------------------------------------------
// OG Image API handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/og-image?url=<article-url>
 * Returns JSON `{ imageUrl: string | null }` with the OG image URL for a page.
 */
export async function handleOgImageApi(reqUrl: URL): Promise<Response> {
  const articleUrl = reqUrl.searchParams.get('url');
  if (!articleUrl) {
    return jsonResponse({ imageUrl: null }, 400);
  }

  if (!isSafePublicUrl(articleUrl)) {
    return jsonResponse({ imageUrl: null }, 400);
  }

  try {
    const ogMeta = await fetchArticleOgMeta(articleUrl);

    // Validate that the discovered image URL is also a safe public URL
    if (ogMeta.imageUrl && !isSafePublicUrl(ogMeta.imageUrl)) {
      ogMeta.imageUrl = null;
    }

    return jsonResponse(ogMeta, 200, {
      'cache-control': 'public, max-age=604800', // 7 days
    });
  } catch {
    return jsonResponse({ imageUrl: null, title: null, description: null }, 200, {
      'cache-control': 'public, max-age=3600', // cache failures for 1 hour
    });
  }
}

/**
 * GET /api/og-image-proxy?url=<image-url>
 * Proxies the actual image, enforcing HTTPS, size limits, and content-type validation.
 * Only serves image/* content types to prevent data exfiltration.
 */
export async function handleOgImageProxy(reqUrl: URL): Promise<Response> {
  const imageUrl = reqUrl.searchParams.get('url');
  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400, headers: CORS_HEADERS });
  }

  if (!isSafePublicUrl(imageUrl)) {
    return new Response('Invalid url', { status: 400, headers: CORS_HEADERS });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        accept: 'image/*',
        'user-agent': 'HNews OG Proxy',
      },
    });

    if (!res.ok || !res.body) {
      return new Response('Upstream error', { status: 502, headers: CORS_HEADERS });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 400, headers: CORS_HEADERS });
    }

    // Block SVGs to prevent XSS via proxied SVG content
    if (contentType.includes('svg')) {
      return new Response('SVG not allowed', { status: 400, headers: CORS_HEADERS });
    }

    // Enforce size limit via Content-Length header when available
    const contentLength = Number(res.headers.get('content-length') || 0);
    if (contentLength > MAX_IMAGE_SIZE) {
      return new Response('Image too large', { status: 413, headers: CORS_HEADERS });
    }

    // Stream-read with hard size limit
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_IMAGE_SIZE) {
        reader.cancel();
        return new Response('Image too large', { status: 413, headers: CORS_HEADERS });
      }
      chunks.push(value);
    }

    // Concatenate chunks
    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': contentType,
        'content-length': String(totalBytes),
        'cache-control': 'public, max-age=604800', // 7 days
        // Security: prevent content sniffing and framing
        'x-content-type-options': 'nosniff',
        'content-disposition': 'inline',
        ...CORS_HEADERS,
      },
    });
  } catch {
    return new Response('Proxy error', { status: 502, headers: CORS_HEADERS });
  } finally {
    clearTimeout(timeout);
  }
}
