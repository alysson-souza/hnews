// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

const HN_HOST_PATTERN = /^(?:www\.)?news\.ycombinator\.com$/i;

/**
 * Story type paths that should be translated to internal routes.
 */
const STORY_TYPE_PATHS: Record<string, string> = {
  '': '/top',
  '/': '/top',
  '/news': '/top',
  '/front': '/top',
  '/newest': '/newest',
  '/new': '/newest',
  '/best': '/best',
  '/ask': '/ask',
  '/show': '/show',
  '/jobs': '/jobs',
};

/**
 * Check if a URL is a Hacker News link.
 *
 * @param url The URL to check
 * @returns true if the URL points to news.ycombinator.com
 */
export function isHnLink(url: string): boolean {
  if (!url) return false;

  try {
    const normalized = normalizeUrl(url);
    if (!normalized) return false;

    const parsedUrl = new URL(normalized);
    return HN_HOST_PATTERN.test(parsedUrl.hostname);
  } catch {
    return false;
  }
}

/**
 * Translate a Hacker News URL to an internal route.
 *
 * Supported translations:
 * - /item?id=12345 → /item/12345
 * - /user?id=username → /user/username
 * - / or /news or /front → /top
 * - /newest, /best, /ask, /show, /jobs → same paths
 * - /from?site=domain → /search?query=site:domain
 * - /submitted?id=user → /search?query=author:user
 *
 * @param url The Hacker News URL to translate
 * @returns The internal route, or null if the URL cannot be translated
 */
export function translateHnLink(url: string): string | null {
  if (!url) return null;

  try {
    const normalized = normalizeUrl(url);
    if (!normalized) return null;

    const parsedUrl = new URL(normalized);

    if (!HN_HOST_PATTERN.test(parsedUrl.hostname)) {
      return null;
    }

    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;

    // Handle item URLs: /item?id=12345 → /item/12345
    if (pathname === '/item') {
      const id = searchParams.get('id');
      if (!id) return null;
      return `/item/${id}`;
    }

    // Handle user URLs: /user?id=username → /user/username
    if (pathname === '/user') {
      const id = searchParams.get('id');
      if (!id) return null;
      return `/user/${id}`;
    }

    // Handle from URLs: /from?site=domain → /search?query=site:domain
    if (pathname === '/from') {
      const site = searchParams.get('site');
      if (!site) return null;
      return `/search?query=site:${encodeURIComponent(site)}`;
    }

    // Handle submitted URLs: /submitted?id=user → /search?query=author:user
    if (pathname === '/submitted') {
      const id = searchParams.get('id');
      if (!id) return null;
      return `/search?query=author:${encodeURIComponent(id)}`;
    }

    // Handle story type pages (/, /news, /newest, /best, /ask, /show, /jobs)
    const storyTypePath = STORY_TYPE_PATHS[pathname];
    if (storyTypePath !== undefined) {
      return storyTypePath;
    }

    // Unsupported path
    return null;
  } catch {
    return null;
  }
}

/**
 * Normalize a URL by ensuring it has a protocol.
 */
function normalizeUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Handle protocol-relative URLs
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // Add https:// if no protocol
  if (!trimmed.match(/^https?:\/\//i)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}
