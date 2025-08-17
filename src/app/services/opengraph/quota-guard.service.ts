// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { CacheManagerService } from '../cache-manager.service';
import { QuotaPeriod } from './opengraph.types';

@Injectable({ providedIn: 'root' })
export class QuotaGuardService {
  private cache = inject(CacheManagerService);

  async tryConsume(providerKey: string, period: QuotaPeriod, limit: number): Promise<boolean> {
    try {
      const now = new Date();
      const keyPart =
        period === 'hour'
          ? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
              now.getUTCDate(),
            ).padStart(2, '0')}-H${String(now.getUTCHours()).padStart(2, '0')}`
          : period === 'day'
            ? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
                now.getUTCDate(),
              ).padStart(2, '0')}`
            : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const cacheKey = `quota_${providerKey}_${period}_${keyPart}`;
      const current = (await this.cache.get<number>('apiCache', cacheKey)) || 0;
      if (current >= limit) return false;

      // TTL until boundary
      let boundary: Date;
      if (period === 'hour') {
        boundary = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours() + 1,
          ),
        );
      } else if (period === 'day') {
        boundary = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
        );
      } else {
        boundary = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      }
      const ttl = Math.max(1000, boundary.getTime() - now.getTime());
      await this.cache.set<number>('apiCache', cacheKey, current + 1, ttl);
      return true;
    } catch {
      // If quota storage fails, allow to avoid breaking app functionality
      return true;
    }
  }
}
