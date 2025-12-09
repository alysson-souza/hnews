// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  LibreDirectInstances,
  LIBREDIRECT_INSTANCES_URL,
  INSTANCES_CACHE_TTL,
  PrivacyFrontend,
} from '../models/privacy-redirect';

interface CachedInstances {
  data: LibreDirectInstances;
  timestamp: number;
}

const STORAGE_KEY = 'libredirect.instances.v1';

/**
 * API client for fetching privacy frontend instances from libredirect.
 * Implements 24-hour caching with localStorage persistence.
 */
@Injectable({ providedIn: 'root' })
export class LibreDirectApiClient {
  private http = inject(HttpClient);

  /**
   * Fetch instances for all privacy frontends.
   * Returns cached data if available and not expired.
   *
   * @returns Observable of LibreDirectInstances or null if fetch fails
   */
  fetchInstances(): Observable<LibreDirectInstances | null> {
    // Check cache first
    const cached = this.loadFromCache();
    if (cached && !this.isCacheExpired(cached.timestamp)) {
      return of(cached.data);
    }

    // Fetch fresh data
    return this.http.get<LibreDirectInstances>(LIBREDIRECT_INSTANCES_URL).pipe(
      tap((data) => this.saveToCache(data)),
      catchError((error) => {
        console.warn('[LibreDirectApiClient] Failed to fetch instances:', error);
        // Return stale cache if available, otherwise null
        return of(cached?.data ?? null);
      }),
    );
  }

  /**
   * Get clearnet instances for a specific frontend.
   *
   * @param instances The full instances data
   * @param frontend The frontend to get instances for
   * @returns Array of clearnet URLs or empty array if not found
   */
  getClearnetInstances(
    instances: LibreDirectInstances,
    frontend: PrivacyFrontend,
  ): readonly string[] {
    const frontendData = instances[frontend];
    if (!frontendData || !Array.isArray(frontendData.clearnet)) {
      return [];
    }

    // Filter out any malformed URLs and ensure they are valid HTTPS URLs
    return frontendData.clearnet.filter((url: string) => {
      if (typeof url !== 'string') return false;
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    });
  }

  /**
   * Clear the cached instances data.
   */
  clearCache(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  private loadFromCache(): CachedInstances | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as CachedInstances;
    } catch {
      return null;
    }
  }

  private saveToCache(data: LibreDirectInstances): void {
    if (typeof window === 'undefined') return;
    try {
      const cached: CachedInstances = {
        data,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }

  private isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > INSTANCES_CACHE_TTL;
  }
}
