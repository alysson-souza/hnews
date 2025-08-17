// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, from, map, of, switchMap, timeout } from 'rxjs';
import { OpenGraphProvider } from '../opengraph.provider';
import { OpenGraphData } from '../opengraph.types';
import { RateLimiterService } from '../../rate-limiter.service';
import { ApiConfig } from '../../../config/api.config';
import { QuotaGuardService } from '../quota-guard.service';

export class MicrolinkProvider implements OpenGraphProvider {
  name = 'microlink';

  constructor(
    private http: HttpClient,
    private rateLimiter: RateLimiterService,
    private apiConfig: ApiConfig,
    private quota: QuotaGuardService,
    private fallbacks: { getSafeFaviconUrl: (u: string) => string; FALLBACK_ICON: string },
  ) {}

  isEnabled(): boolean {
    return true; // Microlink works without a key
  }

  fetch(url: string): Observable<OpenGraphData> {
    interface MicroLinkResponse {
      status: string;
      data?: {
        title?: string;
        description?: string;
        image?: { url?: string };
        screenshot?: { url?: string };
        publisher?: string;
        logo?: { url?: string };
        url?: string;
      };
    }

    const apiUrl = `${this.apiConfig.microlink?.apiUrl || 'https://api.microlink.io'}/?url=${encodeURIComponent(url)}`;
    let headers = new HttpHeaders();
    const apiKey = this.apiConfig.microlink?.apiKey;
    if (apiKey) headers = headers.set('x-api-key', apiKey);

    return from(this.quota.tryConsume('microlink', 'day', 50)).pipe(
      switchMap((allowed) => {
        if (!allowed) return of(this.toDefault(url));
        return from(
          this.rateLimiter.throttle<MicroLinkResponse>('microlink', () =>
            firstValueFrom(this.http.get<MicroLinkResponse>(apiUrl, { headers })),
          ),
        ).pipe(
          timeout(8000),
          map((response) => {
            if (response.status === 'success' && response.data) {
              const data = response.data;
              return {
                title: data.title || '',
                description: data.description || '',
                image: data.image?.url || data.screenshot?.url || '',
                siteName: data.publisher || '',
                favicon:
                  data.logo?.url ||
                  this.fallbacks.getSafeFaviconUrl(url) ||
                  this.fallbacks.FALLBACK_ICON,
                url: data.url || url,
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
