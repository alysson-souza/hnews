// SPDX-License-Identifier: MIT
// Installs Playwright route interception for every Hacker News network call the
// app makes (Firebase HN API + Algolia HN Search API), backed by an `HNDataset`.
//
// Routes read from the dataset object at request time (not a snapshot), so a
// test can mutate `dataset` (via the helpers in hn-fixture-data.ts) before
// triggering navigation and have the mock immediately reflect the change.

import type { BrowserContext, Route } from '@playwright/test';
import type { AlgoliaHitRaw, HNDataset, HNItem, StoryType } from './hn-fixture-data';

interface AlgoliaItemResponse {
  id: number;
  created_at: string;
  created_at_i: number;
  type: string;
  author: string | null;
  title: string | null;
  url: string | null;
  text: string | null;
  points: number | null;
  parent_id: number | null;
  story_id: number | null;
  children: AlgoliaItemResponse[];
}

interface AlgoliaSearchResponse {
  hits: AlgoliaHitRaw[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

const FIREBASE_HOST = 'hacker-news.firebaseio.com';
const ALGOLIA_HOST = 'hn.algolia.com';
const HITS_PER_PAGE = 20;

// A minimal valid 1x1 transparent PNG, reused as a deterministic stand-in for
// every image byte response (OG images and favicons) the app's own
// Cloudflare Pages functions would otherwise fetch from the open internet.
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

async function handleOgImage(route: Route, url: URL): Promise<void> {
  const articleUrl = url.searchParams.get('url');
  if (!articleUrl) {
    await route.fulfill({
      status: 400,
      json: { imageUrl: null, faviconUrl: null, title: null, description: null },
    });
    return;
  }

  await route.fulfill({
    json: {
      imageUrl: 'https://example.com/fixture-og-image.png',
      faviconUrl: 'https://example.com/fixture-favicon.png',
      title: 'Fixture OG Title',
      description: 'Fixture OG description used by the e2e suite.',
    },
  });
}

async function handleImageBytes(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: ONE_PIXEL_PNG,
  });
}

function storyListKeyFromPath(pathname: string): StoryType | null {
  const match = pathname.match(/\/v0\/(top|best|new|ask|show|job)stories\.json$/);
  return (match?.[1] as StoryType | undefined) ?? null;
}

function toAlgoliaItem(id: number, items: Map<number, HNItem>): AlgoliaItemResponse | null {
  const item = items.get(id);
  if (!item || item.deleted) return null;

  return {
    id: item.id,
    created_at: new Date(item.time * 1000).toISOString(),
    created_at_i: item.time,
    type: item.type,
    author: item.by ?? null,
    title: item.title ?? null,
    url: item.url ?? null,
    text: item.text ?? null,
    points: item.score ?? null,
    parent_id: item.parent ?? null,
    story_id: item.storyId ?? null,
    children: (item.kids ?? [])
      .map((kidId) => toAlgoliaItem(kidId, items))
      .filter((child): child is AlgoliaItemResponse => child !== null),
  };
}

function searchableText(hit: AlgoliaHitRaw): string {
  return [hit.title, hit.story_title, hit.comment_text, hit.story_text, hit.url]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}

function matchesTags(hit: AlgoliaHitRaw, tags: string | null): boolean {
  if (!tags || tags === '(story,comment)') return true;
  const wanted = tags.replace(/[()]/g, '').split(',');
  const hitTags = hit._tags ?? [];
  return wanted.some((tag) => hitTags.includes(tag));
}

function handleSearch(dataset: HNDataset, url: URL, sortByDate: boolean): AlgoliaSearchResponse {
  const query = (url.searchParams.get('query') ?? '').trim().toLowerCase();
  const tags = url.searchParams.get('tags');
  const page = Number(url.searchParams.get('page') ?? '0') || 0;
  const numericFilters = url.searchParams.get('numericFilters');

  let matches = dataset.searchPool.filter((hit) => matchesTags(hit, tags));

  if (query.length > 0) {
    matches = matches.filter((hit) => searchableText(hit).includes(query));
  }

  const createdAfterMatch = numericFilters?.match(/created_at_i>(\d+)/);
  if (createdAfterMatch) {
    const threshold = Number(createdAfterMatch[1]);
    matches = matches.filter((hit) => (hit.created_at_i ?? 0) > threshold);
  }

  if (sortByDate) {
    matches = [...matches].sort((a, b) => (b.created_at_i ?? 0) - (a.created_at_i ?? 0));
  }

  const nbHits = matches.length;
  const nbPages = Math.max(1, Math.ceil(nbHits / HITS_PER_PAGE));
  const start = page * HITS_PER_PAGE;
  const hits = matches.slice(start, start + HITS_PER_PAGE);

  return { hits, nbHits, page, nbPages, hitsPerPage: HITS_PER_PAGE };
}

async function handleFirebase(route: Route, dataset: HNDataset, url: URL): Promise<void> {
  const pathname = url.pathname;
  const cors = { 'Access-Control-Allow-Origin': '*' };

  const listKey = storyListKeyFromPath(pathname);
  if (listKey) {
    await route.fulfill({ json: dataset.storyLists[listKey], headers: cors });
    return;
  }

  const itemMatch = pathname.match(/\/v0\/item\/(\d+)\.json$/);
  if (itemMatch) {
    const id = Number(itemMatch[1]);
    await route.fulfill({ json: dataset.items.get(id) ?? null, headers: cors });
    return;
  }

  const userMatch = pathname.match(/\/v0\/user\/([^/]+)\.json$/);
  if (userMatch) {
    const id = decodeURIComponent(userMatch[1]);
    await route.fulfill({ json: dataset.users.get(id) ?? null, headers: cors });
    return;
  }

  if (pathname.endsWith('/v0/maxitem.json')) {
    const maxId = Math.max(0, ...Array.from(dataset.items.keys()));
    await route.fulfill({ json: maxId, headers: cors });
    return;
  }

  if (pathname.endsWith('/v0/updates.json')) {
    await route.fulfill({ json: { items: [], profiles: [] }, headers: cors });
    return;
  }

  await route.fulfill({ status: 404, json: null, headers: cors });
}

async function handleAlgolia(route: Route, dataset: HNDataset, url: URL): Promise<void> {
  const pathname = url.pathname;
  const cors = { 'Access-Control-Allow-Origin': '*' };

  if (pathname === '/api/v1/search' || pathname === '/api/v1/search_by_date') {
    const response = handleSearch(dataset, url, pathname.endsWith('search_by_date'));
    await route.fulfill({ json: response, headers: cors });
    return;
  }

  const itemMatch = pathname.match(/\/api\/v1\/items\/(\d+)$/);
  if (itemMatch) {
    const id = Number(itemMatch[1]);
    const item = toAlgoliaItem(id, dataset.items);
    if (!item) {
      await route.fulfill({ status: 404, json: { message: 'Not found' }, headers: cors });
      return;
    }
    await route.fulfill({ json: item, headers: cors });
    return;
  }

  await route.fulfill({ status: 404, json: null, headers: cors });
}

/**
 * Installs interception for every Firebase HN + Algolia HN Search request the
 * app can make, serving responses derived from `dataset`. No request to
 * either host reaches the real network once this is installed.
 *
 * Routed at the browser-context level (not the page level): the app registers
 * an Angular Service Worker in production builds, and once it takes control
 * of the page its data-group fetch handler issues its own network requests
 * that a plain `page.route()` never sees. Context-level routing intercepts
 * those too, so mocking survives reloads after the service worker activates.
 */
export async function installHNRoutes(context: BrowserContext, dataset: HNDataset): Promise<void> {
  await context.route(`https://${FIREBASE_HOST}/**`, async (route) => {
    const url = new URL(route.request().url());
    await handleFirebase(route, dataset, url);
  });

  await context.route(`https://${ALGOLIA_HOST}/**`, async (route) => {
    const url = new URL(route.request().url());
    await handleAlgolia(route, dataset, url);
  });

  // The app's own same-origin Cloudflare Pages functions (functions/[[path]].ts)
  // reach out to the open internet server-side (og:image scraping, image
  // proxying, Google favicons). Intercepted here at context level so
  // `wrangler pages dev` never dials out during the e2e suite.
  await context.route('**/api/og-image?**', async (route) => {
    const url = new URL(route.request().url());
    await handleOgImage(route, url);
  });
  await context.route('**/api/og-image-proxy?**', async (route) => {
    await handleImageBytes(route);
  });
  await context.route('**/api/favicons?**', async (route) => {
    await handleImageBytes(route);
  });
}
