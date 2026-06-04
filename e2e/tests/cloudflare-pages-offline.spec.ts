import { expect, test, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';

type HeaderSet = Record<string, string>;

const distDir = join(process.cwd(), 'dist', 'hnews', 'browser');

test.describe('Cloudflare Pages offline boot', () => {
  let server: Server | undefined;
  let baseUrl: string;

  test.beforeAll(async () => {
    const app = await startCloudflareLikeServer();
    server = app.server;
    baseUrl = app.baseUrl;
  });

  test.afterAll(async () => {
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test('keeps the Angular service worker healthy when Pages may transform HTML', async ({
    page,
    context,
  }) => {
    await page.goto(`${baseUrl}settings`, { waitUntil: 'networkidle' });
    await waitForServiceWorkerControl(page);

    await expect
      .poll(() => getServiceWorkerState(page), {
        timeout: 15_000,
        message: 'Angular service worker should fully initialize without hash mismatches',
      })
      .toContain('Driver state: NORMAL');

    await context.setOffline(true);
    const response = await page.goto(`${baseUrl}settings`, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).not.toBe(503);
    await expect(page.getByText('HNews').first()).toBeVisible();
  });

  test('renders cached story lists with the saved-results offline state', async ({
    page,
    context,
  }) => {
    await installServiceWorkerWithoutStoryData(page, baseUrl);
    await seedStoryListCache(page);

    await context.setOffline(true);
    await page.goto(`${baseUrl}top`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Showing saved results. Connect to refresh.')).toBeVisible();
    await expect(page.getByText('Cached Offline Story')).toBeVisible();
  });

  test('renders the empty saved-results state when no story list cache exists', async ({
    page,
    context,
  }) => {
    await installServiceWorkerWithoutStoryData(page, baseUrl);

    await context.setOffline(true);
    await page.goto(`${baseUrl}top`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Showing saved results. Connect to refresh.')).toBeVisible();
    await expect(page.getByText('No saved results')).toBeVisible();
  });

  test('disables search while offline', async ({ page, context }) => {
    await installServiceWorkerWithoutStoryData(page, baseUrl);

    await context.setOffline(true);
    await page.goto(`${baseUrl}search`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Search unavailable offline')).toBeVisible();
    await expect(
      page.getByRole('searchbox', { name: 'Search Hacker News content' }),
    ).toBeDisabled();
    await expect(
      page.locator('#main-content').getByRole('button', { name: 'Submit Search' }),
    ).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Filter by type' })).toBeDisabled();
  });
});

async function installServiceWorkerWithoutStoryData(page: Page, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}settings`, { waitUntil: 'networkidle' });
  await waitForServiceWorkerControl(page);
}

async function seedStoryListCache(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const storyIds = [1001, 1002];
    const timestamp = Date.now();
    const ttl = 24 * 60 * 60 * 1000;
    const stories = [
      {
        id: 1001,
        type: 'story',
        by: 'offline_user',
        time: 1_700_000_000,
        title: 'Cached Offline Story',
        url: 'https://example.com/offline-story',
        score: 42,
        descendants: 3,
      },
      {
        id: 1002,
        type: 'story',
        by: 'offline_user',
        time: 1_700_000_100,
        title: 'Second Cached Story',
        url: 'https://example.com/second-story',
        score: 21,
        descendants: 1,
      },
    ];

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('hnews-cache-db', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const upgradeDb = request.result;
        for (const storeName of ['stories', 'users', 'storyLists', 'apiCache']) {
          if (!upgradeDb.objectStoreNames.contains(storeName)) {
            const store = upgradeDb.createObjectStore(storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        }
      };
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      for (const story of stories) {
        store.put({ key: story.id, data: story, timestamp, ttl });
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    sessionStorage.setItem(
      'hnews-story-list-top',
      JSON.stringify({
        storyIds,
        currentPage: 0,
        totalStoryIds: storyIds,
        storyType: 'top',
        selectedIndex: null,
        timestamp,
      }),
    );

    db.close();
  });
}

async function startCloudflareLikeServer(): Promise<{ server: Server; baseUrl: string }> {
  const headerRules = await loadHeaderRules();

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://localhost');
      const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
      const assetPath = extname(requestedPath) === '' ? '/index.html' : requestedPath;
      const filePath = toDistFilePath(assetPath);
      const headers = headersFor(headerRules, assetPath);
      const contentType = contentTypeFor(filePath);

      for (const [name, value] of Object.entries(headers)) {
        response.setHeader(name, value);
      }
      response.setHeader('Content-Type', contentType);

      if (contentType.startsWith('text/html')) {
        let html = await readFile(filePath, 'utf8');
        if (shouldInjectAnalytics(headers)) {
          html = injectCloudflareAnalytics(html);
        }
        response.end(html);
        return;
      }

      createReadStream(filePath)
        .on('error', () => {
          response.writeHead(404);
          response.end('Not found');
        })
        .pipe(response);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start Cloudflare-like test server');
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}/`,
  };
}

async function loadHeaderRules(): Promise<Map<string, HeaderSet>> {
  const source = await readFile(join(distDir, '_headers'), 'utf8');
  const rules = new Map<string, HeaderSet>();
  let currentPath: string | null = null;

  for (const line of source.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      currentPath = line.trim();
      rules.set(currentPath, {});
      continue;
    }

    if (!currentPath) {
      continue;
    }

    const [name, ...valueParts] = line.trim().split(':');
    rules.get(currentPath)![name] = valueParts.join(':').trim();
  }

  return rules;
}

function headersFor(rules: Map<string, HeaderSet>, assetPath: string): HeaderSet {
  return {
    ...(rules.get('/*') ?? {}),
    ...(rules.get(assetPath) ?? {}),
  };
}

function toDistFilePath(assetPath: string): string {
  const normalizedPath = normalize(assetPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return join(distDir, normalizedPath);
}

function shouldInjectAnalytics(headers: HeaderSet): boolean {
  return !headers['Cache-Control']?.toLowerCase().includes('no-transform');
}

function injectCloudflareAnalytics(html: string): string {
  return html.replace(
    '</body>',
    '<!-- Cloudflare Pages Analytics --><script defer src=\'https://static.cloudflareinsights.com/beacon.min.js\' data-cf-beacon=\'{"token":"test"}\'></script><!-- Cloudflare Pages Analytics --></body>',
  );
}

function contentTypeFor(filePath: string): string {
  switch (extname(filePath)) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript';
    case '.json':
      return 'application/json';
    case '.css':
      return 'text/css';
    case '.svg':
      return 'image/svg+xml';
    case '.webmanifest':
      return 'application/manifest+json';
    case '.png':
      return 'image/png';
    case '.ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    await navigator.serviceWorker.ready;
  });

  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload({ waitUntil: 'networkidle' });
  }
}

async function getServiceWorkerState(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const response = await fetch('/ngsw/state');
    return response.text();
  });
}
