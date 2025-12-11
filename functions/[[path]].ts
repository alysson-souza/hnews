export interface Env {
  HN_API_BASE: string;
  SITE_URL: string;
  DEFAULT_OG_IMAGE: string;
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

export async function onRequest(context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const userAgent = request.headers.get('user-agent') || '';

  // Prevent recursion when we fetch index.html internally.
  if (request.headers.get('x-hnews-og-bypass') === '1') {
    return context.next();
  }

  // Never treat static assets as SPA routes.
  if (isAssetPath(pathname) || pathname === '/index.html' || pathname === '/404.html') {
    return context.next();
  }

  const isCrawler = CRAWLER_UA_RE.test(userAgent);

  let meta: {
    title: string;
    description: string;
    image: string;
    type: 'article' | 'website';
  } | null = null;

  if (isCrawler) {
    try {
      meta = await buildMetaForPath(pathname, env);
    } catch {
      meta = null;
    }
  }

  const response = await fetchIndexHtml(request, url);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

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
}

function isAssetPath(pathname: string) {
  return /\.[a-z0-9]+$/i.test(pathname);
}

async function fetchIndexHtml(request: Request, url: URL) {
  const indexUrl = new URL('/index.html', url);
  const headers = new Headers(request.headers);
  headers.set('x-hnews-og-bypass', '1');
  // Avoid compressed bodies when we need to inject meta.
  headers.set('accept-encoding', 'identity');

  return fetch(indexUrl.toString(), {
    method: 'GET',
    headers,
    redirect: 'follow',
  });
}

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
    if (!item || typeof item !== 'object') return null;

    if (item.type === 'comment') {
      const text = truncate(stripHtml(String(item.text || '')), 200);
      let parentTitle = '';
      if (item.parent) {
        const parent = await fetchJSON(`${env.HN_API_BASE}/item/${item.parent}.json`);
        if (parent && typeof parent.title === 'string') parentTitle = parent.title;
      }

      const description = parentTitle ? `Re: ${parentTitle} — ${text}` : text;
      return {
        title: `Comment by ${item.by || 'unknown'} | HNews`,
        description: description || 'Hacker News comment.',
        image: absoluteUrl(env.DEFAULT_OG_IMAGE, env.SITE_URL),
        type: 'article' as const,
      };
    }

    if (item.type === 'story' || item.type === 'job' || item.type === 'poll') {
      const title = String(item.title || 'HNews');
      const score = typeof item.score === 'number' ? item.score : undefined;
      const author = item.by ? String(item.by) : undefined;
      const comments =
        typeof item.descendants === 'number'
          ? item.descendants
          : Array.isArray(item.kids)
            ? item.kids.length
            : undefined;
      const domain = item.url ? safeHostname(item.url) : undefined;

      const parts: string[] = [];
      if (typeof score === 'number') parts.push(`${score} points`);
      if (author) parts.push(`by ${author}`);
      if (typeof comments === 'number') parts.push(`${comments} comments`);
      if (domain) parts.push(domain);

      const description = parts.join(' | ') || 'Hacker News story.';
      const image =
        item.url && typeof item.url === 'string'
          ? (await fetchArticleImage(item.url)) || absoluteUrl(env.DEFAULT_OG_IMAGE, env.SITE_URL)
          : absoluteUrl(env.DEFAULT_OG_IMAGE, env.SITE_URL);

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
    if (!user || typeof user !== 'object') return null;

    const karma = typeof user.karma === 'number' ? user.karma : 0;
    const created = typeof user.created === 'number' ? user.created : 0;
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
  return res.json();
}

async function fetchArticleImage(articleUrl: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(articleUrl);
  } catch {
    return null;
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

    if (!res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let bytesRead = 0;
    let htmlChunk = '';

    while (bytesRead < 50 * 1024) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      bytesRead += value.byteLength;
      htmlChunk += decoder.decode(value, { stream: true });
      if (
        htmlChunk.includes('</head>') ||
        htmlChunk.includes('og:image') ||
        htmlChunk.includes('twitter:image')
      ) {
        break;
      }
    }

    const og = matchMetaContent(htmlChunk, 'og:image');
    const tw = matchMetaContent(htmlChunk, 'twitter:image');
    const candidate = og || tw;
    if (!candidate) return null;

    return resolveImageUrl(candidate, parsed);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function matchMetaContent(html: string, key: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  );
  const m = html.match(re);
  return m?.[1] || null;
}

function resolveImageUrl(raw: string, base: URL) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `${base.protocol}${trimmed}`;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

function injectMeta(
  html: string,
  meta: { title: string; description: string; image: string; type: 'article' | 'website' },
  pathname: string,
  env: Env,
) {
  const ogUrl = absoluteUrl(pathname, env.SITE_URL);
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  const image = escapeAttr(meta.image);
  const type = meta.type;

  const tags = `
<meta property="og:type" content="${type}">
<meta property="og:url" content="${ogUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:site_name" content="HNews">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">`;

  const idx = html.toLowerCase().indexOf('</title>');
  if (idx !== -1) {
    return html.slice(0, idx + 8) + tags + html.slice(idx + 8);
  }

  const headIdx = html.toLowerCase().indexOf('<head>');
  if (headIdx !== -1) {
    return html.slice(0, headIdx + 6) + tags + html.slice(headIdx + 6);
  }

  return tags + html;
}

function escapeAttr(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripHtml(value: string) {
  return decodeEntities(
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function decodeEntities(value: string) {
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

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + '…';
}

function safeHostname(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function absoluteUrl(path: string, siteUrl: string) {
  const base = siteUrl.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
