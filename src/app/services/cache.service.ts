// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable } from '@angular/core';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private readonly STORAGE_PREFIX = 'hnews_cache_';

  private readonly DEFAULT_TTL = {
    STORY_LIST: 5 * 60 * 1000, // 5 minutes
    STORY_ITEM: 30 * 60 * 1000, // 30 minutes
    USER_PROFILE: 60 * 60 * 1000, // 1 hour
    OPEN_GRAPH: 24 * 60 * 60 * 1000, // 24 hours
  };

  constructor() {
    this.cleanupOldEntries();
  }

  set<T>(key: string, data: T, ttl?: number): void {
    if (typeof window === 'undefined') {
      return;
    }

    const storage = window.localStorage;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL.STORY_ITEM,
    };

    try {
      storage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Cache storage failed:', e);
      this.cleanupOldEntries();
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const storage = window.localStorage;

    try {
      const item = storage.getItem(this.STORAGE_PREFIX + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      if (now - entry.timestamp > entry.ttl) {
        storage.removeItem(this.STORAGE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch (e) {
      console.warn('Cache retrieval failed:', e);
      return null;
    }
  }

  clear(pattern?: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const storage = window.localStorage;

    const keys = Object.keys(storage);
    keys.forEach((key) => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        if (!pattern || key.includes(pattern)) {
          storage.removeItem(key);
        }
      }
    });
  }

  private cleanupOldEntries(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const storage = window.localStorage;

    const keys = Object.keys(storage);
    const now = Date.now();

    keys.forEach((key) => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        try {
          const item = storage.getItem(key);
          if (item) {
            const entry: CacheEntry<unknown> = JSON.parse(item);
            if (now - entry.timestamp > entry.ttl) {
              storage.removeItem(key);
            }
          }
        } catch {
          storage.removeItem(key);
        }
      }
    });
  }

  getTTL(type: keyof typeof this.DEFAULT_TTL): number {
    return this.DEFAULT_TTL[type];
  }
}
