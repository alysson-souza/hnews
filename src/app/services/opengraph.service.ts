// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, from, switchMap, merge, timer, timeout } from 'rxjs';
import { CacheManagerService } from './cache-manager.service';
import { RateLimiterService } from './rate-limiter.service';
import { API_CONFIG } from '../config/api.config';
import type { ApiConfig } from '../config/api.config';
import { OpenGraphData } from './opengraph/opengraph.types';
export type { OpenGraphData } from './opengraph/opengraph.types';
import { OpenGraphProvider } from './opengraph/opengraph.provider';
import { MicrolinkProvider } from './opengraph/providers/microlink.provider';
import { LinkPreviewProvider } from './opengraph/providers/linkpreview.provider';
import { OpenGraphIOProvider } from './opengraph/providers/opengraphio.provider';
import { QuotaGuardService } from './opengraph/quota-guard.service';
import { UserSettingsService } from './user-settings.service';

@Injectable({
  providedIn: 'root',
})
export class OpenGraphService {
  private http = inject(HttpClient);
  private cache = inject(CacheManagerService);
  private rateLimiter = inject(RateLimiterService);
  private apiConfig = inject(API_CONFIG);
  private quota = inject(QuotaGuardService);
  private userSettings = inject(UserSettingsService);

  // Circuit breaker for failed URLs
  private failedUrls = new Set<string>();
  private readonly MAX_RETRIES = 3;
  private retryCount = new Map<string, number>();

  // Data URI fallback to avoid external requests
  private readonly FALLBACK_ICON =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSI+CiAgPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iI0U1RTdFQiIvPgogIDxwYXRoIGQ9Ik0yOCAyMGg4bC00IDEyaDRsLTggMTIgMi0xMGgtNGwyLTE0eiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';

  getOpenGraphData(url: string): Observable<OpenGraphData> {
    if (!url) {
      return of(this.getDefaultData(url));
    }

    // Circuit breaker: if URL has failed too many times, return default immediately
    if (this.failedUrls.has(url)) {
      return of(this.getDefaultData(url));
    }

    // Check cache first
    return from(this.cache.get<OpenGraphData>('opengraph', url)).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        // Check retry count
        const retries = this.retryCount.get(url) || 0;
        if (retries >= this.MAX_RETRIES) {
          this.failedUrls.add(url);
          return of(this.getDefaultData(url));
        }

        // Fetch from API if not cached with timeout protection
        this.retryCount.set(url, retries + 1);

        return this.fetchViaProviders(url).pipe(
          timeout(10000), // 10 second timeout for individual requests
          switchMap((data) => {
            // Success: reset retry count and cache result
            this.retryCount.delete(url);
            return from(this.cache.set('opengraph', url, data)).pipe(map(() => data));
          }),
          catchError((error) => {
            console.warn(`OpenGraph fetch failed for ${url} (attempt ${retries + 1}):`, error);

            // If we've hit max retries, add to failed URLs
            if (retries + 1 >= this.MAX_RETRIES) {
              this.failedUrls.add(url);
            }

            const defaultData = this.getDefaultData(url);
            return from(this.cache.set('opengraph', url, defaultData)).pipe(map(() => defaultData));
          }),
        );
      }),
    );
  }

  private fetchViaProviders(url: string): Observable<OpenGraphData> {
    // Build active providers list based on config, weighted order
    const providers: OpenGraphProvider[] = this.buildProviders();

    if (providers.length === 0) {
      // No providers configured/enabled -> return default (no external calls)
      return of(this.getDefaultData(url));
    }

    // Hedged requests: start first provider immediately, then stagger others
    const hedgeDelayMs = 700;
    const streams = providers.map((p, i) =>
      timer(i * hedgeDelayMs).pipe(
        switchMap(() =>
          p.fetch(url).pipe(
            timeout(8000),
            catchError(() => of(undefined as unknown as OpenGraphData)),
          ),
        ),
      ),
    );

    return new Observable<OpenGraphData>((subscriber) => {
      let settled = false;
      const subs = streams.map((s) =>
        s.subscribe({
          next: (data) => {
            if (!settled && data && (data.title || data.description || data.image)) {
              settled = true;
              subscriber.next(data);
              subscriber.complete();
            }
          },
          error: () => {
            // ignore; other streams may succeed
          },
          complete: () => {
            // if all complete without emitting, fall back later
          },
        }),
      );

      // Fallback timeout in case every provider returns empty
      const fallbackTimer = setTimeout(() => {
        if (!settled) {
          settled = true;
          subscriber.next(this.getDefaultData(url));
          subscriber.complete();
        }
      }, 9000);

      return () => {
        clearTimeout(fallbackTimer);
        subs.forEach((sub) => sub.unsubscribe());
      };
    });
  }

  private buildProviders(): OpenGraphProvider[] {
    const fallbacks = {
      getSafeFaviconUrl: (u: string) => this.getSafeFaviconUrl(u),
      FALLBACK_ICON: this.FALLBACK_ICON,
    };

    const effective = this.mergeApiConfig(
      this.apiConfig,
      this.userSettings.getApiConfigOverrides(),
    );

    const linkPreview = new LinkPreviewProvider(
      this.http,
      this.rateLimiter,
      effective,
      this.quota,
      fallbacks,
    );
    const microlink = new MicrolinkProvider(
      this.http,
      this.rateLimiter,
      effective,
      this.quota,
      fallbacks,
    );
    const ogio = new OpenGraphIOProvider(
      this.http,
      this.rateLimiter,
      effective,
      this.quota,
      fallbacks,
    );

    const ordered: OpenGraphProvider[] = [];
    // Weighted preference: LinkPreview -> Microlink -> OpenGraph.io
    if (linkPreview.isEnabled()) ordered.push(linkPreview);
    if (microlink.isEnabled()) ordered.push(microlink);
    if (ogio.isEnabled()) ordered.push(ogio);
    return ordered;
  }

  private mergeApiConfig(base: ApiConfig, overrides: ApiConfig): ApiConfig {
    const out: ApiConfig = {
      microlink: { ...(base?.microlink || {}) },
      linkpreview: { ...(base?.linkpreview || {}) },
      opengraphio: { ...(base?.opengraphio || {}) },
    };
    if (overrides?.microlink) {
      out.microlink = { ...out.microlink, ...overrides.microlink };
    }
    if (overrides?.linkpreview) {
      out.linkpreview = { ...out.linkpreview, ...overrides.linkpreview };
    }
    if (overrides?.opengraphio) {
      out.opengraphio = { ...out.opengraphio, ...overrides.opengraphio };
    }
    return out;
  }

  private getDefaultData(url: string): OpenGraphData {
    return {
      title: '',
      description: '',
      image: '',
      siteName: this.getDomain(url),
      favicon: this.getSafeFaviconUrl(url) || this.FALLBACK_ICON,
      url,
    };
  }

  private getDomain(url: string): string {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return '';
    }
  }

  private getSafeFaviconUrl(url: string): string {
    if (!url) return this.FALLBACK_ICON;

    const domain = this.getDomain(url);
    if (!domain) return this.FALLBACK_ICON;

    // Don't generate external favicon URLs for failed domains
    if (this.failedUrls.has(url)) {
      return this.FALLBACK_ICON;
    }

    // For known problematic patterns, use fallback immediately
    if (
      domain.includes('localhost') ||
      domain.includes('127.0.0.1') ||
      domain.includes('0.0.0.0') ||
      domain.length < 3
    ) {
      return this.FALLBACK_ICON;
    }

    // Try Google's favicon service, but with circuit breaker protection
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }

  // Streaming batch fetch that emits results progressively
  getOpenGraphDataBatch(urls: string[]): Observable<Map<string, OpenGraphData>> {
    if (!urls || urls.length === 0) {
      return of(new Map());
    }

    // Filter out invalid URLs and deduplicate
    const validUrls = [...new Set(urls.filter((url) => url && url.length > 0))];

    // Check cache first and separate cached from uncached
    return from(
      Promise.all(
        validUrls.map((url) =>
          this.cache.get<OpenGraphData>('opengraph', url).then((cached) => ({ url, cached })),
        ),
      ),
    ).pipe(
      switchMap((cacheResults) => {
        const cachedResult = new Map<string, OpenGraphData>();
        const uncachedUrls: string[] = [];

        cacheResults.forEach(({ url, cached }) => {
          if (cached) {
            cachedResult.set(url, cached);
          } else {
            uncachedUrls.push(url);
          }
        });

        // If all URLs are cached, return immediately
        if (uncachedUrls.length === 0) {
          return of(cachedResult);
        }

        // Start with cached results, then stream uncached results
        const batchSize = 8; // Increased batch size for better performance
        const batches: string[][] = [];

        for (let i = 0; i < uncachedUrls.length; i += batchSize) {
          batches.push(uncachedUrls.slice(i, i + batchSize));
        }

        // Create streaming observable that emits individual results immediately
        const batchStreams = batches.map((batch) => {
          const individualStreams = batch.map((url, urlIndex) => {
            // Each URL gets a small stagger within the batch to spread out requests
            const urlDelay = urlIndex * 200; // 200ms between URLs in same batch

            return timer(urlDelay).pipe(
              switchMap(() =>
                this.getOpenGraphData(url).pipe(
                  timeout(12000),
                  map((data) => {
                    // Emit immediately with single result
                    const singleMap = new Map<string, OpenGraphData>();
                    singleMap.set(url, data);
                    return singleMap;
                  }),
                  catchError((error) => {
                    console.warn(`Individual request failed for ${url}:`, error);
                    const singleMap = new Map<string, OpenGraphData>();
                    singleMap.set(url, this.getDefaultData(url));
                    return of(singleMap);
                  }),
                ),
              ),
            );
          });

          // Merge individual streams within this batch with batch-level delay
          const batchMerged = merge(...individualStreams);

          return batchMerged;
        });

        // Merge cached results with streaming batch results
        return merge(of(cachedResult), merge(...batchStreams));
      }),
    );
  }

  // Alternative: Use a simple CORS proxy if needed
  getOpenGraphDataViaProxy(url: string): Observable<OpenGraphData> {
    // This would require setting up a proxy server or using a public one
    // For now, we'll use the Microlink API above
    return this.getOpenGraphData(url);
  }
}
