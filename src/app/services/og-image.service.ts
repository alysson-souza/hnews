// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, NgZone } from '@angular/core';
import { CacheManagerService } from './cache-manager.service';

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
  if (host === 'localhost' || !host.includes('.')) return false;
  if (host.endsWith('.internal') || host.endsWith('.local') || host.endsWith('.localhost')) {
    return false;
  }
  return true;
}

@Injectable({ providedIn: 'root' })
export class OgImageService {
  private cacheManager = inject(CacheManagerService);
  private ngZone = inject(NgZone);

  /** Maximum concurrent OG image API requests. */
  private readonly MAX_CONCURRENCY = 5;
  private activeRequests = 0;
  private queue: Array<{
    articleUrl: string;
    resolve: (url: string | null) => void;
  }> = [];

  /** IntersectionObserver shared across all thumbnail elements. */
  private observer: IntersectionObserver | null = null;
  /** Maps observed elements to their article URLs. */
  private observedElements = new Map<Element, string>();
  /** Resolved OG metadata, keyed by article URL. */
  private resolvedResults = new Map<string, OgImageResult>();
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

              // Fetch OG image (skip if already resolved or in-flight)
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
    if (this.activeRequests < this.MAX_CONCURRENCY) {
      this.activeRequests++;
      this.fetchOgImage(articleUrl).finally(() => {
        this.activeRequests--;
        this.drainQueue();
      });
    } else {
      // Only queue if not already queued
      if (!this.queue.some((q) => q.articleUrl === articleUrl)) {
        this.queue.push({
          articleUrl,
          resolve: () => {
            /* resolved via listeners */
          },
        });
      }
    }
  }

  private drainQueue(): void {
    while (this.activeRequests < this.MAX_CONCURRENCY && this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.activeRequests++;
      this.fetchOgImage(next.articleUrl).finally(() => {
        this.activeRequests--;
        this.drainQueue();
      });
    }
  }

  private async fetchOgImage(articleUrl: string): Promise<void> {
    const cacheKey = `og:${articleUrl}`;
    const nullResult: OgImageResult = { imageUrl: null, title: null, description: null };

    const result = await this.cacheManager.getWithSWR<OgImageCacheEntry>(
      'ogImage',
      cacheKey,
      async () => {
        const apiUrl = `/api/og-image?url=${encodeURIComponent(articleUrl)}`;
        const res = await fetch(apiUrl);

        // If we get a non-JSON response (e.g. SPA index.html on GitHub Pages),
        // treat it as "no worker available".
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          return { imageUrl: null, title: null, description: null };
        }

        if (!res.ok) {
          return { imageUrl: null, title: null, description: null };
        }

        const data = (await res.json()) as {
          imageUrl: string | null;
          title: string | null;
          description: string | null;
        };
        return {
          imageUrl: data.imageUrl
            ? `/api/og-image-proxy?url=${encodeURIComponent(data.imageUrl)}`
            : null,
          title: data.title || null,
          description: data.description || null,
        };
      },
    );

    const ogResult: OgImageResult = result ?? nullResult;
    this.resolvedResults.set(articleUrl, ogResult);

    // Notify all listeners
    const callbacks = this.listeners.get(articleUrl);
    if (callbacks) {
      for (const cb of callbacks) {
        cb(ogResult);
      }
    }
  }
}
