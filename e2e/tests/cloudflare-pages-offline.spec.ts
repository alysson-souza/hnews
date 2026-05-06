import { expect, test, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';

type HeaderSet = Record<string, string>;

const distDir = join(process.cwd(), 'dist', 'hnews', 'browser');

test.describe('Cloudflare Pages offline boot', () => {
  let server: Server;
  let baseUrl: string;

  test.beforeAll(async () => {
    const app = await startCloudflareLikeServer();
    server = app.server;
    baseUrl = app.baseUrl;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test('keeps the Angular service worker healthy when Pages may transform HTML', async ({
    page,
    context,
  }) => {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await waitForServiceWorkerControl(page);

    await expect
      .poll(() => getServiceWorkerState(page), {
        timeout: 15_000,
        message: 'Angular service worker should fully initialize without hash mismatches',
      })
      .toContain('Driver state: NORMAL');

    await context.setOffline(true);
    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).not.toBe(503);
    await expect(page.getByText('HNews').first()).toBeVisible();
    await expect(page.locator('body')).not.toHaveText('Offline');
  });
});

async function startCloudflareLikeServer(): Promise<{ server: Server; baseUrl: string }> {
  const headerRules = await loadHeaderRules();

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://localhost');
      const assetPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
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
