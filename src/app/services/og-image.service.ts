// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, inject, NgZone, effect } from '@angular/core';
import { CacheManagerService } from './cache-manager.service';
import { ThumbnailRecoveryService } from './thumbnail-recovery.service';

/** Result stored in the cache for each article URL. */
interface OgImageCacheEntry {
  /** The proxied OG image URL, or null if no image was found. */
  imageUrl: string | null;
  /** The og:title from the article, or null. */
  title: string | null;
  /** The og:description from the article, or null. */
  description: string | null;
}

/** Data passed to observe() callbacks. */
export interface OgImageResult {
  imageUrl: string | null;
  title: string | null;
  description: string | null;
}

function sameOgImageResult(
  a: OgImageResult | null | undefined,
  b: OgImageResult | null | undefined,
): boolean {
  return a?.imageUrl === b?.imageUrl && a?.title === b?.title && a?.description === b?.description;
}

function isRetryableFallbackResult(result: OgImageResult | null | undefined): boolean {
  return result?.imageUrl === null && result?.title === null && result?.description === null;
}

type OgImageFetchOutcome =
  | {
      kind: 'stable';
      result: OgImageResult;
      ttl?: number;
    }
  | {
      kind: 'transientFailure';
    };

const RETRYABLE_FALLBACK_TTL = 60 * 60 * 1000;

/**
 * Client-side validation that the article URL is a public HTTP(S) URL.
 * Mirrors the server-side `isSafePublicUrl()` to avoid sending obviously
 * invalid requests to the worker.
 */
function isValidArticleUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;

  const host = parsed.hostname.toLowerCase();
  // Block IP addresses, localhost, internal TLDs
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  if (host.startsWith('[') || host.includes(':')) return false;
  if (
    host === 'metadata.google.internal' ||
    host === 'metadata.google' ||
    host === 'instance-data' ||
    host === 'kubernetes.default'
  ) {
    return false;
  }
  if (host === 'localhost' || !host.includes('.')) return false;
  if (host.endsWith('.internal') || host.endsWith('.local') || host.endsWith('.localhost')) {
    return false;
  }

  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;
  const allowedPorts = [80, 443, 8080, 8443];
  if (!allowedPorts.includes(port)) return false;

  return true;
}

@Injectable({ providedIn: 'root' })
export class OgImageService {
  private cacheManager = inject(CacheManagerService);
  private ngZone = inject(NgZone);
  private recovery = inject(ThumbnailRecoveryService);

  /** Maximum concurrent OG image API requests. */
  private readonly MAX_CONCURRENCY = 5;
  private activeRequests = 0;
  private queue: Array<{ articleUrl: string; force: boolean }> = [];
  private inflightUrls = new Set<string>();
  private requestGeneration = 0;

  constructor() {
    // Retry only transient failures on shared recovery events.
    effect(() => {
      const version = this.recovery.recoveryVersion();
      if (version > 0) {
        const queuedUrls = Array.from(new Set(this.queue.map((entry) => entry.articleUrl)));
        this.requestGeneration++;
        this.activeRequests = 0;
        this.queue = [];
        this.inflightUrls.clear();
        for (const articleUrl of queuedUrls) {
          if (this.listeners.has(articleUrl)) {
            this.enqueue(articleUrl);
          }
        }
        this.retryTransientFailures();
      }
    });
  }

  /** IntersectionObserver shared across all thumbnail elements. */
  private observer: IntersectionObserver | null = null;
  /** Maps observed elements to their article URLs. */
  private observedElements = new Map<Element, string>();
  /** Resolved OG metadata, keyed by article URL. */
  private resolvedResults = new Map<string, OgImageResult>();
  /** URLs whose latest fetch failed transiently and should be retried on recovery. */
  private transientFailures = new Set<string>();
  /** Callbacks to notify when a URL resolves. */
  private listeners = new Map<string, Set<(result: OgImageResult) => void>>();

  /**
   * Register an element for viewport-based lazy loading of its OG image.
   * When the element enters the viewport, the OG image URL is fetched.
   *
   * @returns A cleanup function to call on destroy.
   */
  observe(
    element: Element,
    articleUrl: string,
    callback: (result: OgImageResult) => void,
  ): () => void {
    const nullResult: OgImageResult = { imageUrl: null, title: null, description: null };

    // Skip invalid URLs entirely
    if (!isValidArticleUrl(articleUrl)) {
      callback(nullResult);
      return () => {};
    }

    // SSR guard: IntersectionObserver is browser-only
    if (typeof IntersectionObserver === 'undefined') {
      callback(nullResult);
      return () => {};
    }

    // If already resolved, callback immediately
    if (this.resolvedResults.has(articleUrl)) {
      callback(this.resolvedResults.get(articleUrl)!);
    }

    // Register listener for future resolution / SWR updates
    if (!this.listeners.has(articleUrl)) {
      this.listeners.set(articleUrl, new Set());
    }
    this.listeners.get(articleUrl)!.add(callback);

    // Observe the element
    this.observedElements.set(element, articleUrl);
    this.getObserver().observe(element);

    return () => {
      this.observedElements.delete(element);
      this.observer?.unobserve(element);
      this.listeners.get(articleUrl)?.delete(callback);
      if (this.listeners.get(articleUrl)?.size === 0) {
        this.listeners.delete(articleUrl);
        this.transientFailures.delete(articleUrl);
      }
    };
  }

  private getObserver(): IntersectionObserver {
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          this.ngZone.run(() => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;

              const articleUrl = this.observedElements.get(entry.target);
              if (!articleUrl) continue;

              // Stop observing once triggered
              this.observer!.unobserve(entry.target);

              if (!this.resolvedResults.has(articleUrl)) {
                this.enqueue(articleUrl);
              }
            }
          });
        },
        {
          // Start loading ~600px before the element enters the viewport
          rootMargin: '600px 0px',
        },
      );
    }
    return this.observer;
  }

  private enqueue(articleUrl: string): void {
    this.enqueueWithPriority(articleUrl, false);
  }

  retry(articleUrl: string): void {
    if (!this.listeners.has(articleUrl)) return;
    this.enqueueWithPriority(articleUrl, true);
  }

  private enqueueWithPriority(articleUrl: string, force: boolean): void {
    const generation = this.requestGeneration;
    const queued = this.queue.find((entry) => entry.articleUrl === articleUrl);

    if (queued) {
      queued.force = queued.force || force;
      return;
    }

    if (this.inflightUrls.has(articleUrl)) {
      return;
    }

    if (this.activeRequests < this.MAX_CONCURRENCY) {
      this.startFetch(articleUrl, force, generation);
    } else {
      this.queue.push({ articleUrl, force });
    }
  }

  private startFetch(articleUrl: string, force: boolean, generation: number): void {
    this.activeRequests++;
    this.inflightUrls.add(articleUrl);
    this.fetchOgImage(articleUrl, force, generation).finally(() => {
      if (generation !== this.requestGeneration) {
        return;
      }
      this.inflightUrls.delete(articleUrl);
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this.drainQueue(generation);
    });
  }

  private drainQueue(generation: number): void {
    if (generation !== this.requestGeneration) {
      return;
    }

    while (this.activeRequests < this.MAX_CONCURRENCY && this.queue.length > 0) {
      const next = this.queue.shift()!;
      if (this.inflightUrls.has(next.articleUrl)) {
        continue;
      }
      this.startFetch(next.articleUrl, next.force, generation);
    }
  }

  private retryTransientFailures(): void {
    for (const articleUrl of Array.from(this.transientFailures)) {
      if (!this.listeners.has(articleUrl)) {
        this.transientFailures.delete(articleUrl);
        continue;
      }
      this.retry(articleUrl);
    }
  }

  private notifyListeners(articleUrl: string, result: OgImageResult): void {
    const callbacks = this.listeners.get(articleUrl);
    if (!callbacks) return;
    for (const cb of callbacks) {
      cb(result);
    }
  }

  private async fetchOgImage(
    articleUrl: string,
    force: boolean,
    generation: number,
  ): Promise<void> {
    const cacheKey = `og:${articleUrl}`;
    const existingStableResult = this.resolvedResults.get(articleUrl) ?? null;
    let deliveredStableResult = existingStableResult;

    if (!force) {
      const cached = await this.cacheManager.get<OgImageCacheEntry>('ogImage', cacheKey);
      if (generation !== this.requestGeneration) return;

      if (cached) {
        const cachedResult: OgImageResult = {
          imageUrl: cached.imageUrl,
          title: cached.title,
          description: cached.description,
        };
        if (isRetryableFallbackResult(cachedResult)) {
          this.resolvedResults.delete(articleUrl);
        } else {
          this.resolvedResults.set(articleUrl, cachedResult);
        }
        this.transientFailures.delete(articleUrl);
        if (!sameOgImageResult(existingStableResult, cachedResult)) {
          this.notifyListeners(articleUrl, cachedResult);
        }
        deliveredStableResult = cachedResult;
        return;
      }
    }

    const outcome = await this.fetchOgImageFromApi(articleUrl);
    if (generation !== this.requestGeneration) return;

    if (outcome.kind === 'transientFailure') {
      if (!deliveredStableResult) {
        this.transientFailures.add(articleUrl);
      }
      return;
    }

    this.transientFailures.delete(articleUrl);
    if (isRetryableFallbackResult(outcome.result)) {
      this.resolvedResults.delete(articleUrl);
    } else {
      this.resolvedResults.set(articleUrl, outcome.result);
    }
    try {
      await this.cacheManager.set('ogImage', cacheKey, outcome.result, outcome.ttl);
    } catch (error) {
      console.warn(`Failed to cache OG metadata for ${articleUrl}:`, error);
    }
    if (generation !== this.requestGeneration) return;
    if (!sameOgImageResult(deliveredStableResult, outcome.result)) {
      this.notifyListeners(articleUrl, outcome.result);
    }
  }

  private async fetchOgImageFromApi(articleUrl: string): Promise<OgImageFetchOutcome> {
    try {
      const apiUrl = `/api/og-image?url=${encodeURIComponent(articleUrl)}`;
      const res = await fetch(apiUrl);

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        if (!contentType.includes('application/json') && res.status === 404) {
          return {
            kind: 'stable',
            result: { imageUrl: null, title: null, description: null },
            ttl: RETRYABLE_FALLBACK_TTL,
          };
        }
        return { kind: 'transientFailure' };
      }

      if (!contentType.includes('application/json')) {
        return {
          kind: 'stable',
          result: { imageUrl: null, title: null, description: null },
          ttl: RETRYABLE_FALLBACK_TTL,
        };
      }

      const data = (await res.json()) as {
        imageUrl: string | null;
        title: string | null;
        description: string | null;
      };
      return {
        kind: 'stable',
        result: {
          imageUrl: data.imageUrl
            ? `/api/og-image-proxy?url=${encodeURIComponent(data.imageUrl)}`
            : null,
          title: data.title || null,
          description: data.description || null,
        },
      };
    } catch {
      return { kind: 'transientFailure' };
    }
  }
}
