// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Live contract checks against the real Hacker News and Algolia APIs.
 *
 * The rest of the e2e suite serves fixture data via route interception, so nothing
 * there notices if an upstream response shape changes. These tests exist solely to
 * catch that drift. They assert the SHAPE the app's mappers depend on, never
 * specific values, which change constantly.
 *
 * Run on a schedule, not per-commit: `npm run e2e:live`. They are excluded from the
 * default suite by living outside `testDir` (see playwright.config.ts).
 *
 * Field expectations here mirror `mapToHNItem` in src/app/models/hn.ts and the
 * interfaces in src/app/models/algolia.ts. Change them together.
 */

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';
const ALGOLIA_BASE = 'https://hn.algolia.com/api/v1';

/** A long-dead, immutable story with comments: the 2007 Dropbox "Show HN" post. */
const STABLE_STORY_ID = 8863;
/** A permanent account. */
const STABLE_USER_ID = 'pg';

const HN_ITEM_TYPES = ['job', 'story', 'comment', 'poll', 'pollopt'];

async function getJson(request: APIRequestContext, url: string): Promise<unknown> {
  const response = await request.get(url);
  expect(response.status(), `GET ${url}`).toBe(200);
  return response.json();
}

test.describe('Hacker News Firebase API contract', () => {
  test('story-list endpoints return non-empty arrays of numeric ids', async ({ request }) => {
    for (const feed of ['topstories', 'newstories', 'beststories', 'askstories', 'showstories']) {
      const body = await getJson(request, `${HN_BASE}/${feed}.json`);

      expect(Array.isArray(body), `${feed} must be an array`).toBe(true);
      const ids = body as unknown[];
      expect(ids.length, `${feed} must not be empty`).toBeGreaterThan(0);
      expect(ids.every((id) => typeof id === 'number' && Number.isFinite(id))).toBe(true);
    }
  });

  test('item endpoint returns the fields mapToHNItem requires', async ({ request }) => {
    const item = (await getJson(request, `${HN_BASE}/item/${STABLE_STORY_ID}.json`)) as Record<
      string,
      unknown
    >;

    // mapToHNItem returns null unless all three of these hold
    expect(typeof item['id']).toBe('number');
    expect(typeof item['time']).toBe('number');
    expect(HN_ITEM_TYPES).toContain(item['type']);

    expect(item['id']).toBe(STABLE_STORY_ID);
    expect(item['type']).toBe('story');

    // Fields the story list and item page render
    expect(typeof item['by']).toBe('string');
    expect(typeof item['title']).toBe('string');
    expect(typeof item['score']).toBe('number');
    expect(typeof item['descendants']).toBe('number');
    expect(Array.isArray(item['kids'])).toBe(true);
    expect((item['kids'] as unknown[]).every((k) => typeof k === 'number')).toBe(true);
  });

  test('comment items expose parent and text', async ({ request }) => {
    const story = (await getJson(request, `${HN_BASE}/item/${STABLE_STORY_ID}.json`)) as {
      kids: number[];
    };
    const firstCommentId = story.kids[0];

    const comment = (await getJson(request, `${HN_BASE}/item/${firstCommentId}.json`)) as Record<
      string,
      unknown
    >;

    expect(comment['type']).toBe('comment');
    expect(typeof comment['time']).toBe('number');
    expect(typeof comment['parent']).toBe('number');
    // A live comment carries text; a deleted one carries the deleted flag instead
    if (comment['deleted'] !== true) {
      expect(typeof comment['text']).toBe('string');
    }
  });

  test('user endpoint returns the fields HNUser requires', async ({ request }) => {
    const user = (await getJson(request, `${HN_BASE}/user/${STABLE_USER_ID}.json`)) as Record<
      string,
      unknown
    >;

    expect(user['id']).toBe(STABLE_USER_ID);
    expect(typeof user['created']).toBe('number');
    expect(typeof user['karma']).toBe('number');
    expect(Array.isArray(user['submitted'])).toBe(true);
  });
});

test.describe('Algolia HN Search API contract', () => {
  test('search returns hits with the fields the result list renders', async ({ request }) => {
    const body = (await getJson(
      request,
      `${ALGOLIA_BASE}/search?advancedSyntax=true&query=javascript&tags=story`,
    )) as Record<string, unknown>;

    expect(typeof body['nbHits']).toBe('number');
    expect(Array.isArray(body['hits'])).toBe(true);

    const hits = body['hits'] as Record<string, unknown>[];
    expect(hits.length).toBeGreaterThan(0);

    const hit = hits[0];
    // objectID is the item id the app links to, and is a STRING upstream
    expect(typeof hit['objectID']).toBe('string');
    expect(typeof hit['created_at']).toBe('string');
    expect(typeof hit['created_at_i']).toBe('number');
    expect(typeof hit['author']).toBe('string');
    expect(typeof hit['title']).toBe('string');
    expect(Array.isArray(hit['_tags'])).toBe(true);
  });

  test('search_by_date returns date-descending hits', async ({ request }) => {
    const body = (await getJson(
      request,
      `${ALGOLIA_BASE}/search_by_date?advancedSyntax=true&query=the&tags=story`,
    )) as { hits: { created_at_i: number }[] };

    expect(body.hits.length).toBeGreaterThan(1);
    const timestamps = body.hits.map((h) => h.created_at_i);
    expect(timestamps.every((t) => typeof t === 'number')).toBe(true);

    // The app relies on this endpoint being pre-sorted newest-first
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
    }
  });

  test('items endpoint returns a nested children tree', async ({ request }) => {
    const item = (await getJson(request, `${ALGOLIA_BASE}/items/${STABLE_STORY_ID}`)) as Record<
      string,
      unknown
    >;

    expect(item['id']).toBe(STABLE_STORY_ID);
    expect(typeof item['created_at']).toBe('string');
    expect(typeof item['created_at_i']).toBe('number');
    expect(item['type']).toBe('story');
    expect(Array.isArray(item['children'])).toBe(true);

    // The nested tree is what lets the app avoid N+1 comment fetches
    const children = item['children'] as Record<string, unknown>[];
    expect(children.length).toBeGreaterThan(0);

    const child = children[0];
    expect(typeof child['id']).toBe('number');
    expect(child['type']).toBe('comment');
    expect(child['parent_id']).toBe(STABLE_STORY_ID);
    expect(Array.isArray(child['children'])).toBe(true);
  });
});
