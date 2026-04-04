// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { OgImageService } from './og-image.service';
import { CacheManagerService } from './cache-manager.service';
import { PageLifecycleService } from './page-lifecycle.service';
import { ThumbnailRecoveryService } from './thumbnail-recovery.service';

// ---------------------------------------------------------------------------
// Mock IntersectionObserver
// ---------------------------------------------------------------------------

type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly elements = new Set<Element>();
  readonly callback: IntersectionCallback;
  readonly options: IntersectionObserverInit | undefined;

  constructor(callback: IntersectionCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  observe(el: Element): void {
    this.elements.add(el);
  }

  unobserve(el: Element): void {
    this.elements.delete(el);
  }

  disconnect(): void {
    this.elements.clear();
  }

  /** Simulate an element entering the viewport. */
  triggerEntry(el: Element, isIntersecting: boolean): void {
    this.callback([{ target: el, isIntersecting } as IntersectionObserverEntry]);
  }

  /** Simulate multiple entries. */
  triggerEntries(entries: Array<{ target: Element; isIntersecting: boolean }>): void {
    this.callback(entries.map((e) => e as unknown as IntersectionObserverEntry));
  }
}

// ---------------------------------------------------------------------------
// CacheManagerService stub
// ---------------------------------------------------------------------------

class CacheManagerServiceStub {
  get = vi.fn(async <T>(scope: string, key: string): Promise<T | null> => {
    void scope;
    void key;
    return null;
  });
  set = vi.fn(async <T>(scope: string, key: string, data: T, ttl?: number): Promise<void> => {
    void scope;
    void key;
    void data;
    void ttl;
  });
  /**
   * Pass-through to the fetcher by default.
   * Tests can override to simulate cached data.
   */
  getWithSWR = vi.fn(
    async <T>(_scope: string, _key: string, fetcher: () => Promise<T>): Promise<T | null> => {
      return fetcher();
    },
  );
  clearInflightFetches = vi.fn();
}

class PageLifecycleServiceStub {
  hiddenSince = signal<number | null>(null);
  isVisible = signal(true);
  resumeCount = signal(0);
  wasDiscarded = false;
}

class ThumbnailRecoveryServiceStub {
  recoveryVersion = signal(0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchResponse(
  body: unknown,
  {
    ok = true,
    status = ok ? 200 : 500,
    contentType = 'application/json',
  }: { ok?: boolean; status?: number; contentType?: string } = {},
): Response {
  return {
    ok,
    status,
    headers: { get: (h: string) => (h === 'content-type' ? contentType : null) },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

/** Flush microtasks so observe()'s IntersectionObserver callback + fetch pipeline settle. */
async function flush(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OgImageService', () => {
  let service: OgImageService;
  let cacheStub: CacheManagerServiceStub;
  let pageLifecycleStub: PageLifecycleServiceStub;
  let thumbnailRecoveryStub: ThumbnailRecoveryServiceStub;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    fetchSpy = vi
      .fn()
      .mockResolvedValue(makeFetchResponse({ imageUrl: null, title: null, description: null }));
    vi.stubGlobal('fetch', fetchSpy);

    cacheStub = new CacheManagerServiceStub();
    pageLifecycleStub = new PageLifecycleServiceStub();
    thumbnailRecoveryStub = new ThumbnailRecoveryServiceStub();

    TestBed.configureTestingModule({
      providers: [
        OgImageService,
        { provide: CacheManagerService, useValue: cacheStub },
        { provide: PageLifecycleService, useValue: pageLifecycleStub },
        { provide: ThumbnailRecoveryService, useValue: thumbnailRecoveryStub },
      ],
    });

    service = TestBed.inject(OgImageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  // URL validation (tested indirectly through observe())
  // -----------------------------------------------------------------------

  describe('URL validation', () => {
    it('rejects non-HTTP schemes', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'ftp://example.com', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects IP addresses', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'http://192.168.1.1/page', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects localhost', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'http://localhost:3000', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects bare hostnames without dots', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'http://intranet/page', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects .internal TLD', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'http://app.internal/page', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects .local TLD', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'http://mybox.local/page', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects .localhost TLD', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'http://app.localhost/page', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects URLs with embedded credentials', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'http://user:pass@example.com', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects malformed URLs', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'not-a-url', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects URLs on non-standard ports', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'https://example.com:3000/page', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('rejects metadata hostnames blocked by the worker', () => {
      const cb = vi.fn();
      service.observe(document.createElement('div'), 'https://metadata.google.internal/page', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('accepts valid HTTPS URLs', () => {
      const cb = vi.fn();
      const cleanup = service.observe(
        document.createElement('div'),
        'https://example.com/page',
        cb,
      );
      // Should NOT have been called with null — it registers for future notification
      expect(cb).not.toHaveBeenCalled();
      cleanup();
    });

    it('accepts valid HTTP URLs', () => {
      const cb = vi.fn();
      const cleanup = service.observe(document.createElement('div'), 'http://example.com/page', cb);
      expect(cb).not.toHaveBeenCalled();
      cleanup();
    });
  });

  // -----------------------------------------------------------------------
  // SSR guard
  // -----------------------------------------------------------------------

  describe('SSR guard', () => {
    it('returns null result when IntersectionObserver is undefined', () => {
      vi.stubGlobal('IntersectionObserver', undefined);

      const cb = vi.fn();
      service.observe(document.createElement('div'), 'https://example.com/page', cb);
      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
    });

    it('accepts valid URLs on allowed alternate ports', () => {
      const cb = vi.fn();
      const cleanup = service.observe(
        document.createElement('div'),
        'https://example.com:8443/page',
        cb,
      );
      expect(cb).not.toHaveBeenCalled();
      cleanup();
    });
  });

  // -----------------------------------------------------------------------
  // observe() basics
  // -----------------------------------------------------------------------

  describe('observe()', () => {
    it('creates an IntersectionObserver with 600px rootMargin', () => {
      const el = document.createElement('div');
      const cleanup = service.observe(el, 'https://example.com', vi.fn());

      expect(MockIntersectionObserver.instances.length).toBe(1);
      expect(MockIntersectionObserver.instances[0].options?.rootMargin).toBe('600px 0px');
      cleanup();
    });

    it('reuses the same IntersectionObserver for multiple elements', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');

      const cleanup1 = service.observe(el1, 'https://example.com/a', vi.fn());
      const cleanup2 = service.observe(el2, 'https://example.com/b', vi.fn());

      expect(MockIntersectionObserver.instances.length).toBe(1);
      expect(MockIntersectionObserver.instances[0].elements.size).toBe(2);
      cleanup1();
      cleanup2();
    });

    it('adds element to the observer', () => {
      const el = document.createElement('div');
      const cleanup = service.observe(el, 'https://example.com', vi.fn());

      expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(true);
      cleanup();
    });

    it('returns already-resolved result immediately', async () => {
      const el1 = document.createElement('div');
      const url = 'https://example.com/page';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse({
          imageUrl: 'https://img.example.com/og.jpg',
          title: 'Example',
          description: 'Desc',
        }),
      );

      const cb1 = vi.fn();
      service.observe(el1, url, cb1);

      // Trigger intersection for first observer
      MockIntersectionObserver.instances[0].triggerEntry(el1, true);
      await flush();

      const expectedProxy =
        '/api/og-image-proxy?url=' + encodeURIComponent('https://img.example.com/og.jpg');
      expect(cb1).toHaveBeenCalledWith({
        imageUrl: expectedProxy,
        title: 'Example',
        description: 'Desc',
      });

      // Second observer for same URL — should get result immediately
      const cb2 = vi.fn();
      const el2 = document.createElement('div');
      const cleanup = service.observe(el2, url, cb2);

      expect(cb2).toHaveBeenCalledWith({
        imageUrl: expectedProxy,
        title: 'Example',
        description: 'Desc',
      });
      cleanup();
    });
  });

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  describe('cleanup', () => {
    it('unobserves element when cleanup is called', () => {
      const el = document.createElement('div');
      const cleanup = service.observe(el, 'https://example.com', vi.fn());

      expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(true);
      cleanup();
      expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(false);
    });

    it('removes listener when cleanup is called', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/page';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse({
          imageUrl: 'https://img.example.com/og.jpg',
          title: 'T',
          description: 'D',
        }),
      );

      const cb = vi.fn();
      const cleanup = service.observe(el, url, cb);

      // Cleanup before intersection
      cleanup();

      // Trigger intersection — callback should NOT fire
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      // cb was never called (no immediate resolution, no intersection notification)
      expect(cb).not.toHaveBeenCalled();
    });

    it('removes listener set for a URL when cleanup removes the last one', () => {
      const el = document.createElement('div');
      const url = 'https://example.com/page';

      const cleanup = service.observe(el, url, vi.fn());
      cleanup();

      // Access private field to verify cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listeners = (service as any).listeners as Map<string, Set<unknown>>;
      expect(listeners.has(url)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Intersection → fetch pipeline
  // -----------------------------------------------------------------------

  describe('intersection triggers fetch', () => {
    it('fetches OG data when element becomes visible', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse({
          imageUrl: 'https://cdn.example.com/img.png',
          title: 'Article Title',
          description: 'Article Description',
        }),
      );

      const cb = vi.fn();
      service.observe(el, url, cb);

      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(cacheStub.get).toHaveBeenCalledWith('ogImage', `og:${url}`);
      expect(cacheStub.set).toHaveBeenCalledWith('ogImage', `og:${url}`, {
        imageUrl:
          '/api/og-image-proxy?url=' + encodeURIComponent('https://cdn.example.com/img.png'),
        title: 'Article Title',
        description: 'Article Description',
      });
      expect(cb).toHaveBeenCalledWith({
        imageUrl:
          '/api/og-image-proxy?url=' + encodeURIComponent('https://cdn.example.com/img.png'),
        title: 'Article Title',
        description: 'Article Description',
      });
    });

    it('skips non-intersecting entries', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      const cb = vi.fn();
      service.observe(el, url, cb);

      MockIntersectionObserver.instances[0].triggerEntry(el, false);
      await flush();

      expect(cacheStub.get).not.toHaveBeenCalled();
      expect(cb).not.toHaveBeenCalled();
    });

    it('unobserves element after first intersection', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse({ imageUrl: null, title: null, description: null }),
      );

      service.observe(el, url, vi.fn());
      const observer = MockIntersectionObserver.instances[0];

      observer.triggerEntry(el, true);
      await flush();

      // Element should have been unobserved after triggering
      expect(observer.elements.has(el)).toBe(false);
    });

    it('does not re-fetch for already resolved URL', async () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValue(
        makeFetchResponse({ imageUrl: null, title: 'T', description: null }),
      );

      service.observe(el1, url, vi.fn());
      MockIntersectionObserver.instances[0].triggerEntry(el1, true);
      await flush();

      // Reset the spy count
      cacheStub.get.mockClear();

      // Second element with same URL intersects
      service.observe(el2, url, vi.fn());
      MockIntersectionObserver.instances[0].triggerEntry(el2, true);
      await flush();

      expect(cacheStub.get).not.toHaveBeenCalled();
    });

    it('notifies all listeners for the same URL', async () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse({
          imageUrl: 'https://cdn.example.com/img.png',
          title: 'Title',
          description: null,
        }),
      );

      const cb1 = vi.fn();
      const cb2 = vi.fn();

      service.observe(el1, url, cb1);
      service.observe(el2, url, cb2);

      // Only trigger one element — both should be notified
      MockIntersectionObserver.instances[0].triggerEntry(el1, true);
      await flush();

      const expected = {
        imageUrl:
          '/api/og-image-proxy?url=' + encodeURIComponent('https://cdn.example.com/img.png'),
        title: 'Title',
        description: null,
      };
      expect(cb1).toHaveBeenCalledWith(expected);
      expect(cb2).toHaveBeenCalledWith(expected);
    });
  });

  // -----------------------------------------------------------------------
  // fetchOgImage internals
  // -----------------------------------------------------------------------

  describe('fetchOgImage', () => {
    it('wraps image URL with proxy endpoint', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse({
          imageUrl: 'https://cdn.example.com/image.jpg',
          title: null,
          description: null,
        }),
      );

      const cb = vi.fn();
      service.observe(el, url, cb);
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl:
            '/api/og-image-proxy?url=' + encodeURIComponent('https://cdn.example.com/image.jpg'),
        }),
      );
    });

    it('returns null imageUrl when API returns null imageUrl', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse({ imageUrl: null, title: 'T', description: 'D' }),
      );

      const cb = vi.fn();
      service.observe(el, url, cb);
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: 'T',
        description: 'D',
      });
    });

    it('treats non-JSON responses as a stable favicon fallback result', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse('<html>SPA</html>', { contentType: 'text/html' }),
      );

      const cb = vi.fn();
      service.observe(el, url, cb);
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
      expect(cacheStub.set).toHaveBeenCalledWith(
        'ogImage',
        `og:${url}`,
        {
          imageUrl: null,
          title: null,
          description: null,
        },
        60 * 60 * 1000,
      );
    });

    it('treats non-ok HTML 404 responses as a stable favicon fallback result', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse('<html>SPA fallback</html>', {
          ok: false,
          status: 404,
          contentType: 'text/html',
        }),
      );

      const cb = vi.fn();
      service.observe(el, url, cb);
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(cb).toHaveBeenCalledWith({
        imageUrl: null,
        title: null,
        description: null,
      });
      expect(cacheStub.set).toHaveBeenCalledWith(
        'ogImage',
        `og:${url}`,
        {
          imageUrl: null,
          title: null,
          description: null,
        },
        60 * 60 * 1000,
      );
    });

    it('does not cache non-ok responses as a stable null result', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(makeFetchResponse({ error: 'bad' }, { ok: false }));

      const cb = vi.fn();
      service.observe(el, url, cb);
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(cb).not.toHaveBeenCalled();
      expect(cacheStub.set).not.toHaveBeenCalled();
    });

    it('treats non-ok HTML 5xx responses as transient failures', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse('<html>error</html>', { ok: false, contentType: 'text/html' }),
      );

      const cb = vi.fn();
      service.observe(el, url, cb);
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(cb).not.toHaveBeenCalled();
      expect(cacheStub.set).not.toHaveBeenCalled();
    });

    it('retries transient failures on recovery triggers', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(
        makeFetchResponse({
          imageUrl: 'https://cdn.example.com/after-recovery.jpg',
          title: 'Recovered',
          description: 'Recovered description',
        }),
      );

      const cb = vi.fn();
      service.observe(el, url, cb);
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(cb).not.toHaveBeenCalled();
      expect(cacheStub.set).not.toHaveBeenCalled();

      thumbnailRecoveryStub.recoveryVersion.set(1);
      TestBed.flushEffects();
      await flush();

      expect(cb).toHaveBeenCalledWith({
        imageUrl:
          '/api/og-image-proxy?url=' +
          encodeURIComponent('https://cdn.example.com/after-recovery.jpg'),
        title: 'Recovered',
        description: 'Recovered description',
      });
    });

    it('uses correct cache scope and key', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse({ imageUrl: null, title: null, description: null }),
      );

      service.observe(el, url, vi.fn());
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(cacheStub.get).toHaveBeenCalledWith('ogImage', 'og:https://example.com/article');
    });

    it('calls fetch with correct API URL', async () => {
      const el = document.createElement('div');
      const url = 'https://example.com/article?foo=bar';

      fetchSpy.mockResolvedValueOnce(
        makeFetchResponse({ imageUrl: null, title: null, description: null }),
      );

      service.observe(el, url, vi.fn());
      MockIntersectionObserver.instances[0].triggerEntry(el, true);
      await flush();

      expect(fetchSpy).toHaveBeenCalledWith(`/api/og-image?url=${encodeURIComponent(url)}`);
    });
  });

  // -----------------------------------------------------------------------
  // Concurrency limiting
  // -----------------------------------------------------------------------

  describe('concurrency queue', () => {
    it('processes up to 5 concurrent requests', async () => {
      const resolvers: Array<() => void> = [];

      // Each fetch returns a pending promise we control
      fetchSpy.mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolvers.push(() =>
              resolve(makeFetchResponse({ imageUrl: null, title: null, description: null })),
            );
          }),
      );

      const elements: HTMLElement[] = [];

      for (let i = 0; i < 8; i++) {
        const el = document.createElement('div');
        const url = `https://example.com/article-${i}`;
        elements.push(el);
        service.observe(el, url, vi.fn());
      }

      // Trigger all intersections at once
      MockIntersectionObserver.instances[0].triggerEntries(
        elements.map((el) => ({ target: el, isIntersecting: true })),
      );

      await flush();

      // Only 5 fetches should have started (MAX_CONCURRENCY = 5)
      expect(resolvers.length).toBe(5);

      // Resolve the first 5
      resolvers.forEach((r) => r());
      await flush();

      // Remaining 3 should now be in flight
      expect(resolvers.length).toBe(8);
    });

    it('does not queue duplicate URLs', async () => {
      const resolvers: Array<() => void> = [];

      fetchSpy.mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolvers.push(() =>
              resolve(makeFetchResponse({ imageUrl: null, title: null, description: null })),
            );
          }),
      );

      // Fill up concurrency with 5 different URLs
      const fillElements: HTMLElement[] = [];
      for (let i = 0; i < 5; i++) {
        const el = document.createElement('div');
        fillElements.push(el);
        service.observe(el, `https://example.com/fill-${i}`, vi.fn());
      }
      const observer = MockIntersectionObserver.instances[0];
      observer.triggerEntries(fillElements.map((el) => ({ target: el, isIntersecting: true })));
      await flush();
      expect(resolvers.length).toBe(5);

      // Queue same URL twice via two different elements
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      const dupeUrl = 'https://example.com/dupe';
      service.observe(el1, dupeUrl, vi.fn());
      service.observe(el2, dupeUrl, vi.fn());
      observer.triggerEntry(el1, true);
      observer.triggerEntry(el2, true);
      await flush();

      // Resolve all 5 active requests
      resolvers.forEach((r) => r());
      await flush();

      // Only one additional fetch for the deduped URL
      expect(resolvers.length).toBe(6);
    });

    it('dedupes concurrent in-flight fetches for the same URL', async () => {
      const resolvers: Array<() => void> = [];

      fetchSpy.mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolvers.push(() =>
              resolve(
                makeFetchResponse({
                  imageUrl: 'https://cdn.example.com/shared.jpg',
                  title: 'Shared',
                  description: null,
                }),
              ),
            );
          }),
      );

      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      const url = 'https://example.com/shared';
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      service.observe(el1, url, cb1);
      service.observe(el2, url, cb2);

      MockIntersectionObserver.instances[0].triggerEntries([
        { target: el1, isIntersecting: true },
        { target: el2, isIntersecting: true },
      ]);
      await flush();

      expect(resolvers.length).toBe(1);

      resolvers[0]();
      await flush();

      expect(cb1).toHaveBeenCalledWith({
        imageUrl:
          '/api/og-image-proxy?url=' + encodeURIComponent('https://cdn.example.com/shared.jpg'),
        title: 'Shared',
        description: null,
      });
      expect(cb2).toHaveBeenCalledWith({
        imageUrl:
          '/api/og-image-proxy?url=' + encodeURIComponent('https://cdn.example.com/shared.jpg'),
        title: 'Shared',
        description: null,
      });
    });
  });

  // -----------------------------------------------------------------------
  // Recovery handling
  // -----------------------------------------------------------------------

  describe('recovery handling', () => {
    it('resets activeRequests to 0 on recovery', async () => {
      const resolvers: Array<() => void> = [];
      fetchSpy.mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolvers.push(() =>
              resolve(makeFetchResponse({ imageUrl: null, title: null, description: null })),
            );
          }),
      );

      // Start 5 concurrent requests to fill the concurrency limit
      const elements: HTMLElement[] = [];
      for (let i = 0; i < 5; i++) {
        const el = document.createElement('div');
        elements.push(el);
        service.observe(el, `https://example.com/resume-${i}`, vi.fn());
      }
      MockIntersectionObserver.instances[0].triggerEntries(
        elements.map((el) => ({ target: el, isIntersecting: true })),
      );
      await flush();
      expect(resolvers.length).toBe(5);

      // Simulate recovery — should reset activeRequests
      thumbnailRecoveryStub.recoveryVersion.set(1);
      TestBed.flushEffects();

      // Now a 6th request should be processable (not blocked by concurrency)
      const el6 = document.createElement('div');
      service.observe(el6, 'https://example.com/resume-new', vi.fn());
      MockIntersectionObserver.instances[0].triggerEntry(el6, true);
      await flush();

      // The new fetch should have started (resolvers.length increased)
      expect(resolvers.length).toBe(6);
    });

    it('preserves queued URLs across recovery', async () => {
      const resolvers: Array<() => void> = [];
      fetchSpy.mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolvers.push(() =>
              resolve(
                makeFetchResponse({
                  imageUrl: 'https://cdn.example.com/recovered.jpg',
                  title: 'Recovered',
                  description: null,
                }),
              ),
            );
          }),
      );

      const callbacks = Array.from({ length: 6 }, () => vi.fn());
      const elements = Array.from({ length: 6 }, () => document.createElement('div'));

      for (let i = 0; i < 6; i++) {
        service.observe(elements[i], `https://example.com/queued-${i}`, callbacks[i]);
      }

      MockIntersectionObserver.instances[0].triggerEntries(
        elements.map((el) => ({ target: el, isIntersecting: true })),
      );
      await flush();

      expect(resolvers.length).toBe(5);

      thumbnailRecoveryStub.recoveryVersion.set(1);
      TestBed.flushEffects();
      await flush();

      expect(resolvers.length).toBe(6);

      resolvers[5]();
      await flush();

      expect(callbacks[5]).toHaveBeenCalledWith({
        imageUrl:
          '/api/og-image-proxy?url=' + encodeURIComponent('https://cdn.example.com/recovered.jpg'),
        title: 'Recovered',
        description: null,
      });
    });
  });
});
