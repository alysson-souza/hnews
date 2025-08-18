// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, from, map, of, timeout } from 'rxjs';
import { OpenGraphProvider } from '../opengraph.provider';
import { OpenGraphData } from '../opengraph.types';
import { RateLimiterService } from '../../rate-limiter.service';
import { ApiConfig } from '../../../config/api.config';
import { QuotaGuardService } from '../quota-guard.service';

interface OpenGraphIOResponse {
  openGraph?: {
    title?: string;
    description?: string;
    image?: { url?: string } | string;
    site_name?: string;
    url?: string;
  };
  requestInfo?: { url?: string };
  error?: string | { message?: string };
}

export class OpenGraphIOProvider implements OpenGraphProvider {
  name = 'opengraphio';
  private mutex: Promise<void> = Promise.resolve();

  constructor(
    private http: HttpClient,
    private rateLimiter: RateLimiterService,
    private apiConfig: ApiConfig,
    private quota: QuotaGuardService,
    private fallbacks: { getSafeFaviconUrl: (u: string) => string; FALLBACK_ICON: string },
  ) {}

  isEnabled(): boolean {
    return !!this.apiConfig.opengraphio?.appId; // requires real App ID
  }

  fetch(url: string): Observable<OpenGraphData> {
    const appId = this.apiConfig.opengraphio?.appId;
    if (!appId) {
      return of(this.toDefault(url));
    }
    const apiUrlBase = this.apiConfig.opengraphio?.apiUrl || 'https://opengraph.io/api/1.1/site';
    const apiUrl = `${apiUrlBase}/${encodeURIComponent(url)}?app_id=${encodeURIComponent(appId)}`;

    return from(
      this.runExclusive(async () => {
        const allowed = await this.quota.tryConsume('opengraphio', 'month', 100);
        if (!allowed) return this.toDefault(url);
        return this.rateLimiter.throttle<OpenGraphIOResponse>('opengraphio', () =>
          firstValueFrom(this.http.get<OpenGraphIOResponse>(apiUrl)),
        );
      }),
    ).pipe(
      timeout(8000),
      map((resp) => {
        if (!resp) return this.toDefault(url);
        if (this.isOgResponse(resp)) {
          const ogResp = resp as OpenGraphIOResponse;
          const og = ogResp.openGraph || {};
          const imageUrl = this.extractImageUrl(og);
          const finalUrl = og.url || ogResp.requestInfo?.url || url;
          if (Object.keys(og).length > 0) {
            return {
              title: og.title || '',
              description: og.description || '',
              image: imageUrl || '',
              siteName: (og as { site_name?: string }).site_name || this.getDomain(finalUrl),
              favicon: this.fallbacks.getSafeFaviconUrl(finalUrl) || this.fallbacks.FALLBACK_ICON,
              url: finalUrl,
            } satisfies OpenGraphData;
          }
          return this.toDefault(url);
        } else {
          return resp as OpenGraphData;
        }
      }),
      catchError(() => of(this.toDefault(url))),
    );
  }

  private runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const prev = this.mutex;
    this.mutex = new Promise<void>((res) => (release = res));
    return prev
      .catch(() => undefined)
      .then(async () => {
        try {
          return await fn();
        } finally {
          release!();
        }
      });
  }

  private isOgResponse(value: unknown): value is OpenGraphIOResponse {
    if (!value || typeof value !== 'object') return false;
    const rec = value as Record<string, unknown>;
    return 'openGraph' in rec || 'requestInfo' in rec;
  }

  private extractImageUrl(og: { image?: { url?: string } | string }): string {
    const img = og?.image;
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (typeof img === 'object' && 'url' in img) return (img as { url?: string }).url || '';
    return '';
  }

  private toDefault(url: string): OpenGraphData {
    return {
      title: '',
      description: '',
      image: '',
      siteName: this.getDomain(url),
      favicon: this.fallbacks.getSafeFaviconUrl(url) || this.fallbacks.FALLBACK_ICON,
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
}
