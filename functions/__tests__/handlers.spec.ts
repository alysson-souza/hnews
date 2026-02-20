import { handleOgImageApi, handleOgImageProxy, injectMeta } from '../[[path]]';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUrl(path: string, params?: Record<string, string>): URL {
  const url = new URL(path, 'https://hnews.test');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return url;
}

/**
 * Create a mock ReadableStream from a Uint8Array body.
 */
function bodyStream(data: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });
}

/**
 * Build a mock fetch that returns the given Response for any call.
 */
function mockFetch(response: Response): typeof globalThis.fetch {
  return vi.fn().mockResolvedValue(response);
}

/**
 * Build HTML with OG meta tags for fetchArticleOgMeta to parse.
 */
function ogHtml(opts: {
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twImage?: string;
  title?: string;
}): string {
  const parts: string[] = ['<html><head>'];
  if (opts.title) parts.push(`<title>${opts.title}</title>`);
  if (opts.ogImage) parts.push(`<meta property="og:image" content="${opts.ogImage}">`);
  if (opts.ogTitle) parts.push(`<meta property="og:title" content="${opts.ogTitle}">`);
  if (opts.ogDescription)
    parts.push(`<meta property="og:description" content="${opts.ogDescription}">`);
  if (opts.twImage) parts.push(`<meta name="twitter:image" content="${opts.twImage}">`);
  parts.push('</head><body></body></html>');
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// handleOgImageApi
// ---------------------------------------------------------------------------

describe('handleOgImageApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns 400 when url param is missing', async () => {
    const res = await handleOgImageApi(makeUrl('/api/og-image'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ imageUrl: null });
  });

  it('returns 400 for unsafe article URL (private IP)', async () => {
    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'http://192.168.1.1/secret' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ imageUrl: null });
  });

  it('returns 400 for unsafe article URL (non-HTTP scheme)', async () => {
    const res = await handleOgImageApi(makeUrl('/api/og-image', { url: 'ftp://example.com/file' }));
    expect(res.status).toBe(400);
  });

  it('returns OG meta with image URL on success', async () => {
    const html = ogHtml({
      ogImage: 'https://cdn.example.com/og.jpg',
      ogTitle: 'Test Article',
      ogDescription: 'A test description',
    });
    const htmlResponse = new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    vi.stubGlobal('fetch', mockFetch(htmlResponse));

    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'https://example.com/article' }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imageUrl).toBe('https://cdn.example.com/og.jpg');
    expect(body.title).toBe('Test Article');
    expect(body.description).toBe('A test description');
  });

  it('returns null imageUrl when page has no OG image', async () => {
    const html = ogHtml({ title: 'No OG Image' });
    const htmlResponse = new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    vi.stubGlobal('fetch', mockFetch(htmlResponse));

    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'https://example.com/article' }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imageUrl).toBeNull();
  });

  it('nullifies discovered image URL that fails SSRF check', async () => {
    const html = ogHtml({
      ogImage: 'http://169.254.169.254/latest/meta-data',
      ogTitle: 'SSRF Test',
    });
    const htmlResponse = new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    vi.stubGlobal('fetch', mockFetch(htmlResponse));

    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'https://example.com/article' }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imageUrl).toBeNull();
  });

  it('falls back to twitter:image when og:image is missing', async () => {
    const html = ogHtml({ twImage: 'https://cdn.example.com/tw.jpg' });
    const htmlResponse = new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    vi.stubGlobal('fetch', mockFetch(htmlResponse));

    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'https://example.com/article' }),
    );

    const body = await res.json();
    expect(body.imageUrl).toBe('https://cdn.example.com/tw.jpg');
  });

  it('sets 7-day cache header on success', async () => {
    const html = ogHtml({ ogImage: 'https://cdn.example.com/img.jpg' });
    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response(html, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    );

    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'https://example.com/article' }),
    );

    expect(res.headers.get('cache-control')).toBe('public, max-age=604800');
  });

  it('sets CORS headers', async () => {
    const res = await handleOgImageApi(makeUrl('/api/og-image'));
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('returns 200 with null values when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'https://example.com/article' }),
    );

    // fetchArticleOgMeta catches errors internally and returns empty OgMeta,
    // so handleOgImageApi's try branch succeeds with null values (7-day cache).
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imageUrl).toBeNull();
    expect(body.title).toBeNull();
    expect(body.description).toBeNull();
    expect(res.headers.get('cache-control')).toBe('public, max-age=604800');
  });

  it('returns null for non-ok upstream response', async () => {
    vi.stubGlobal('fetch', mockFetch(new Response('Not Found', { status: 404 })));

    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'https://example.com/missing' }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imageUrl).toBeNull();
  });

  it('resolves relative OG image URLs against article URL', async () => {
    const html = ogHtml({ ogImage: '/static/og.jpg' });
    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response(html, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    );

    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'https://blog.example.com/post/123' }),
    );

    const body = await res.json();
    expect(body.imageUrl).toBe('https://blog.example.com/static/og.jpg');
  });

  it('decodes HTML entities in title and description', async () => {
    const html = ogHtml({
      ogTitle: 'A &amp; B',
      ogDescription: '&lt;Hello&gt; &quot;World&quot;',
      ogImage: 'https://cdn.example.com/img.jpg',
    });
    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response(html, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    );

    const res = await handleOgImageApi(
      makeUrl('/api/og-image', { url: 'https://example.com/article' }),
    );

    const body = await res.json();
    expect(body.title).toBe('A & B');
    expect(body.description).toBe('<Hello> "World"');
  });
});

// ---------------------------------------------------------------------------
// handleOgImageProxy
// ---------------------------------------------------------------------------

describe('handleOgImageProxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns 400 when url param is missing', async () => {
    const res = await handleOgImageProxy(makeUrl('/api/og-image-proxy'));
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toBe('Missing url parameter');
  });

  it('returns 400 for unsafe URL (localhost)', async () => {
    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'http://localhost/img.png' }),
    );
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toBe('Invalid url');
  });

  it('returns 400 for unsafe URL (private IP)', async () => {
    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'http://10.0.0.1/img.png' }),
    );
    expect(res.status).toBe(400);
  });

  it('proxies a valid image successfully', async () => {
    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
    const stream = bodyStream(imageData);
    const imageResponse = new Response(stream, {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': String(imageData.length),
      },
    });
    vi.stubGlobal('fetch', mockFetch(imageResponse));

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/og.png' }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-disposition')).toBe('inline');
    expect(res.headers.get('cache-control')).toBe('public, max-age=604800');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');

    const body = new Uint8Array(await res.arrayBuffer());
    expect(body).toEqual(imageData);
  });

  it('returns 502 for non-ok upstream response', async () => {
    vi.stubGlobal('fetch', mockFetch(new Response('Not Found', { status: 404 })));

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/missing.png' }),
    );

    expect(res.status).toBe(502);
    expect(await res.text()).toBe('Upstream error');
  });

  it('returns 400 for non-image content type', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response('not an image', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    );

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/page.html' }),
    );

    expect(res.status).toBe(400);
    expect(await res.text()).toBe('Not an image');
  });

  it('blocks SVG content type (XSS prevention)', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response('<svg></svg>', {
          status: 200,
          headers: { 'content-type': 'image/svg+xml' },
        }),
      ),
    );

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/img.svg' }),
    );

    expect(res.status).toBe(400);
    expect(await res.text()).toBe('SVG not allowed');
  });

  it('returns 413 when Content-Length exceeds limit', async () => {
    const oversizedLength = 6 * 1024 * 1024; // 6 MB
    // Must provide a body stream so the handler doesn't bail with 502 on !res.body
    const stream = bodyStream(new Uint8Array(0));
    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response(stream, {
          status: 200,
          headers: {
            'content-type': 'image/jpeg',
            'content-length': String(oversizedLength),
          },
        }),
      ),
    );

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/huge.jpg' }),
    );

    expect(res.status).toBe(413);
    expect(await res.text()).toBe('Image too large');
  });

  it('returns 413 when stream exceeds limit (no Content-Length)', async () => {
    // Create a stream that delivers more than 5MB
    const chunkSize = 1024 * 1024; // 1 MB per chunk
    let chunksSent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (chunksSent >= 6) {
          controller.close();
          return;
        }
        controller.enqueue(new Uint8Array(chunkSize));
        chunksSent++;
      },
    });

    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response(stream, {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        }),
      ),
    );

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/huge.jpg' }),
    );

    expect(res.status).toBe(413);
    expect(await res.text()).toBe('Image too large');
  });

  it('returns 502 when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/img.png' }),
    );

    expect(res.status).toBe(502);
    expect(await res.text()).toBe('Proxy error');
  });

  it('sets correct content-length in response', async () => {
    const imageData = new Uint8Array(1024);
    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response(bodyStream(imageData), {
          status: 200,
          headers: {
            'content-type': 'image/png',
          },
        }),
      ),
    );

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/img.png' }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBe('1024');
  });

  it('allows image/jpeg content type', async () => {
    const imageData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // JPEG magic
    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response(bodyStream(imageData), {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        }),
      ),
    );

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/photo.jpg' }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
  });

  it('allows image/webp content type', async () => {
    const imageData = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // RIFF magic
    vi.stubGlobal(
      'fetch',
      mockFetch(
        new Response(bodyStream(imageData), {
          status: 200,
          headers: { 'content-type': 'image/webp' },
        }),
      ),
    );

    const res = await handleOgImageProxy(
      makeUrl('/api/og-image-proxy', { url: 'https://cdn.example.com/photo.webp' }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/webp');
  });
});

// ---------------------------------------------------------------------------
// injectMeta
// ---------------------------------------------------------------------------

const mockEnv = { SITE_URL: 'https://hnews.test' } as Parameters<typeof injectMeta>[3];
const baseMeta = { title: 'Test', description: 'Desc', type: 'article' as const };
const baseHtml = '<html><head><title>HNews</title></head><body></body></html>';

describe('injectMeta', () => {
  describe('with image', () => {
    const html = injectMeta(
      baseHtml,
      { ...baseMeta, image: 'https://cdn.example.com/og.jpg' },
      '/item/123',
      mockEnv,
    );

    it('includes og:image tag', () => {
      expect(html).toContain('<meta property="og:image" content="https://cdn.example.com/og.jpg">');
    });

    it('includes og:image:width and og:image:height tags', () => {
      expect(html).toContain('<meta property="og:image:width" content="512">');
      expect(html).toContain('<meta property="og:image:height" content="512">');
    });

    it('includes twitter:card summary_large_image', () => {
      expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    });

    it('includes twitter:image tag', () => {
      expect(html).toContain(
        '<meta name="twitter:image" content="https://cdn.example.com/og.jpg">',
      );
    });
  });

  describe('without image', () => {
    const html = injectMeta(baseHtml, { ...baseMeta, image: null }, '/item/456', mockEnv);

    it('omits og:image tag', () => {
      expect(html).not.toContain('og:image"');
    });

    it('omits twitter:image tag', () => {
      expect(html).not.toContain('twitter:image"');
    });

    it('includes twitter:card summary', () => {
      expect(html).toContain('<meta name="twitter:card" content="summary">');
    });

    it('does not include summary_large_image', () => {
      expect(html).not.toContain('summary_large_image');
    });
  });
});
