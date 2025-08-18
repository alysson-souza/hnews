// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, from, map, of, switchMap, timeout } from 'rxjs';
import { OpenGraphProvider } from '../opengraph.provider';
import { OpenGraphData } from '../opengraph.types';
import { RateLimiterService } from '../../rate-limiter.service';
import { ApiConfig } from '../../../config/api.config';
import { QuotaGuardService } from '../quota-guard.service';

export class LinkPreviewProvider implements OpenGraphProvider {
  name = 'linkpreview';

  constructor(
    private http: HttpClient,
    private rateLimiter: RateLimiterService,
    private apiConfig: ApiConfig,
    private quota: QuotaGuardService,
    private fallbacks: { getSafeFaviconUrl: (u: string) => string; FALLBACK_ICON: string },
  ) {}

  isEnabled(): boolean {
    const key = this.apiConfig.linkpreview?.apiKey;
    // Treat 'free' as not a usable key for LinkPreview (requires actual key)
    return !!(key && key !== 'free');
  }

  fetch(url: string): Observable<OpenGraphData> {
    interface LinkPreviewResponse {
      title?: string;
      description?: string;
      image?: string;
      url?: string;
      error?: string;
    }

    const apiKey = this.apiConfig.linkpreview?.apiKey;
    if (!apiKey || apiKey === 'free') {
      return of(this.toDefault(url));
    }
    const apiUrlBase = this.apiConfig.linkpreview?.apiUrl || 'https://api.linkpreview.net';
    const apiUrl = `${apiUrlBase}/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(url)}`;

    return from(this.quota.tryConsume('linkpreview', 'hour', 60)).pipe(
      switchMap((allowed) => {
        if (!allowed) return of(this.toDefault(url));
        return from(
          this.rateLimiter.throttle<LinkPreviewResponse>('linkpreview', () =>
            firstValueFrom(this.http.get<LinkPreviewResponse>(apiUrl)),
          ),
        ).pipe(
          timeout(8000),
          map((resp) => {
            if (resp && !resp.error) {
              const finalUrl = resp.url || url;
              return {
                title: resp.title || '',
                description: resp.description || '',
                image: resp.image || '',
                siteName: this.getDomain(finalUrl),
                favicon: this.fallbacks.getSafeFaviconUrl(finalUrl) || this.fallbacks.FALLBACK_ICON,
                url: finalUrl,
              } satisfies OpenGraphData;
            }
            return this.toDefault(url);
          }),
          catchError(() => of(this.toDefault(url))),
        );
      }),
    );
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
