// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IndexedDBService } from './indexed-db.service';
import { CacheService } from './cache.service';
import { HNItem, HNUser } from '../models/hn';
import {
  CACHE_TTL_STORIES,
  CACHE_TTL_ITEM,
  CACHE_TTL_USER,
  CACHE_TTL_SEARCH,
  CACHE_TTL_METADATA,
  CACHE_TTL_OG_IMAGE,
} from '../config/cache.config';

export enum StorageType {
  MEMORY = 'memory',
  INDEXED_DB = 'indexeddb',
  LOCAL_STORAGE = 'localstorage',
  SERVICE_WORKER = 'serviceworker',
}

export interface CacheConfig {
  storageType: StorageType;
  ttl: number;
  fallback?: StorageType;
}

interface MemoryCacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable({
  providedIn: 'root',
})
export class CacheManagerService {
  private indexedDB = inject(IndexedDBService);
  private legacyCache = inject(CacheService); // Existing localStorage cache
  private ttlStories = inject(CACHE_TTL_STORIES);
  private ttlItem = inject(CACHE_TTL_ITEM);
  private ttlUser = inject(CACHE_TTL_USER);
  private ttlSearch = inject(CACHE_TTL_SEARCH);
  private ttlMetadata = inject(CACHE_TTL_METADATA);
  private ttlOgImage = inject(CACHE_TTL_OG_IMAGE);

  // Memory cache for frequently accessed items
  private memoryCache = new Map<string, MemoryCacheItem<unknown>>();
  private readonly MAX_MEMORY_ITEMS = 100;
  private updateStreams = new Map<string, Subject<unknown>>();
  private subjectRefCounts = new Map<string, number>();

  // In-flight fetch deduplication
  private inflightFetches = new Map<string, Promise<unknown>>();

  // Service Worker communication
  private swRegistration: ServiceWorkerRegistration | null = null;

  // Cache configurations for different data types
  private cacheConfigs = new Map<string, CacheConfig>([
    [
      'story',
      {
        storageType: StorageType.INDEXED_DB,
        ttl: this.ttlItem,
        fallback: StorageType.LOCAL_STORAGE,
      },
    ],
    [
      'storyList',
      {
        storageType: StorageType.INDEXED_DB,
        ttl: this.ttlStories,
        fallback: StorageType.LOCAL_STORAGE,
      },
    ],
    [
      'user',
      {
        storageType: StorageType.INDEXED_DB,
        ttl: this.ttlUser,
        fallback: StorageType.LOCAL_STORAGE,
      },
    ],
    [
      'search',
      {
        storageType: StorageType.INDEXED_DB,
        ttl: this.ttlSearch,
        fallback: StorageType.LOCAL_STORAGE,
      },
    ],
    [
      'metadata',
      {
        storageType: StorageType.INDEXED_DB,
        ttl: this.ttlMetadata,
        fallback: StorageType.LOCAL_STORAGE,
      },
    ],
    [
      'preference',
      {
        storageType: StorageType.LOCAL_STORAGE,
        ttl: Infinity, // Never expire preferences
      },
    ],
    [
      'image',
      {
        storageType: StorageType.SERVICE_WORKER,
        ttl: 7 * 24 * 60 * 60 * 1000,
      },
    ],
    [
      'ogImage',
      {
        storageType: StorageType.INDEXED_DB,
        ttl: this.ttlOgImage,
        fallback: StorageType.LOCAL_STORAGE,
      },
    ],
  ]);

  constructor() {
    this.initServiceWorker();
    this.initMigration().catch((error) => {
      console.warn('Cache migration failed, continuing with fresh cache:', error);
    });
    this.startMemoryCacheCleanup();
  }

  private async initServiceWorker(): Promise<void> {
    if (typeof window !== 'undefined' && 'serviceWorker' in window.navigator) {
      try {
        this.swRegistration = await window.navigator.serviceWorker.ready;
      } catch (error) {
        console.error('Service Worker not available:', error);
      }
    }
  }

  private async initMigration(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    // Check if migration is needed
    const migrationDone = window.localStorage.getItem('hnews_migration_v2');
    if (!migrationDone) {
      await this.indexedDB.migrateFromLocalStorage();
      window.localStorage.setItem('hnews_migration_v2', 'true');
    }

    // One-time reset of storyLists to correct any legacy key/aliasing issues
    // that could cause categories to display the wrong list. Safe to clear;
    // lists are cheap to refetch and repopulate.
    const listResetFlag = 'hnews_storyLists_reset_2025_09_14';
    if (!window.localStorage.getItem(listResetFlag)) {
      try {
        await this.indexedDB.clear('storyLists');
      } catch {
        // Swallow errors; lack of IndexedDB shouldn't block startup
      }
      window.localStorage.setItem(listResetFlag, 'true');
    }
  }

  private startMemoryCacheCleanup(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Clean up expired memory cache items every minute
    window.setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.memoryCache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.memoryCache.delete(key);
        }
      }

      // Implement LRU if cache is too large
      if (this.memoryCache.size > this.MAX_MEMORY_ITEMS) {
        const sortedEntries = Array.from(this.memoryCache.entries()).sort(
          (a, b) => a[1].timestamp - b[1].timestamp,
        );

        const toRemove = sortedEntries.slice(0, sortedEntries.length - this.MAX_MEMORY_ITEMS);
        toRemove.forEach(([key]) => this.memoryCache.delete(key));
      }

      // Also cleanup unused RxJS subjects
      this.cleanupUnusedSubjects();
    }, 60000);
  }

  // Main cache operations

  /**
   * Stale-while-revalidate utility: returns cached data immediately if fresh, then triggers background refresh.
   * @param type Cache type string
   * @param key Cache key
   * @param fetcher Function to fetch fresh data
   * @returns Promise<T> resolves to cached or fresh data
   */
  async getWithSWR<T>(type: string, key: string, fetcher: () => Promise<T>): Promise<T | null> {
    const fullKey = `${type}:${key}`;

    const cached = await this.get<T | null>(type, key);
    if (cached !== null) {
      // Check if background refresh already in progress
      if (!this.inflightFetches.has(fullKey)) {
        const fetchPromise = fetcher()
          .then(async (fresh) => {
            if (fresh !== null && fresh !== undefined) {
              await this.set(type, key, fresh);
            }
            return fresh;
          })
          .catch((error) => {
            console.error(`Background refresh failed for ${fullKey}:`, error);
            return null;
          })
          .finally(() => {
            // Clean up completed fetch
            this.inflightFetches.delete(fullKey);
          });

        this.inflightFetches.set(fullKey, fetchPromise);
      }
      return cached;
    }

    // No cache - check if fetch already in progress
    if (this.inflightFetches.has(fullKey)) {
      return (await this.inflightFetches.get(fullKey)) as T | null;
    }

    // Start new fetch
    const fetchPromise = fetcher()
      .then(async (fresh) => {
        if (fresh !== null && fresh !== undefined) {
          await this.set(type, key, fresh);
          return fresh;
        }
        return null;
      })
      .catch((error) => {
        console.error(`Fetch failed for ${fullKey}:`, error);
        return null;
      })
      .finally(() => {
        this.inflightFetches.delete(fullKey);
      });

    this.inflightFetches.set(fullKey, fetchPromise);
    return fetchPromise as Promise<T | null>;
  }

  async get<T>(type: string, key: string): Promise<T | null> {
    const config = this.cacheConfigs.get(type) || {
      storageType: StorageType.INDEXED_DB,
      ttl: 30 * 60 * 1000,
    };

    // Check memory cache first
    const memoryKey = `${type}:${key}`;
    const memoryCached = this.getFromMemory<T>(memoryKey);
    if (memoryCached !== null) {
      return memoryCached;
    }

    // Try primary storage
    let result = await this.getFromStorage<T>(config.storageType, type, key);

    // Try fallback storage if primary fails
    if (result === null && config.fallback) {
      result = await this.getFromStorage<T>(config.fallback, type, key);
    }

    // Cache in memory if found
    if (result !== null) {
      this.setInMemory(memoryKey, result, config.ttl);
    }

    return result;
  }

  async set<T>(type: string, key: string, data: T, ttl?: number): Promise<void> {
    const config = this.cacheConfigs.get(type) || {
      storageType: StorageType.INDEXED_DB,
      ttl: ttl || 30 * 60 * 1000,
    };

    const finalTTL = ttl || config.ttl;
    const memoryKey = `${type}:${key}`;

    try {
      // Set in primary storage first
      await this.setInStorage(config.storageType, type, key, data, finalTTL);

      // Set in fallback storage (best effort)
      if (config.fallback) {
        try {
          await this.setInStorage(config.fallback, type, key, data, finalTTL);
        } catch (error) {
          console.warn(`Failed to set fallback storage for ${memoryKey}:`, error);
          // Continue - primary storage succeeded
        }
      }

      // Only update memory cache after successful storage writes
      this.setInMemory(memoryKey, data, finalTTL);

      // Notify subscribers of successful update
      this.emitUpdate<T>(type, key, data);
    } catch (error) {
      console.error(`Failed to set cache for ${memoryKey}:`, error);
      // Don't update memory or notify subscribers if storage failed
      throw error;
    }
  }

  async delete(type: string, key: string): Promise<void> {
    const config = this.cacheConfigs.get(type) || {
      storageType: StorageType.INDEXED_DB,
      ttl: 30 * 60 * 1000,
    };

    // Delete from memory
    const memoryKey = `${type}:${key}`;
    this.memoryCache.delete(memoryKey);

    // Delete from primary storage
    await this.deleteFromStorage(config.storageType, type, key);

    // Delete from fallback storage
    if (config.fallback) {
      await this.deleteFromStorage(config.fallback, type, key);
    }
  }

  async clear(type?: string): Promise<void> {
    if (!type) {
      // Clear everything
      this.memoryCache.clear();
      await this.indexedDB.clearAll();
      this.legacyCache.clear();
      await this.clearServiceWorkerCache();
    } else {
      // Clear specific type
      const keysToDelete = Array.from(this.memoryCache.keys()).filter((key) =>
        key.startsWith(`${type}:`),
      );
      keysToDelete.forEach((key) => this.memoryCache.delete(key));

      // Clear from IndexedDB and localStorage
      const config = this.cacheConfigs.get(type);
      if (config?.storageType === StorageType.INDEXED_DB) {
        // Clear specific store in IndexedDB based on type
        const storeMap: Record<string, string> = {
          story: 'stories',
          storyList: 'storyLists',
          user: 'users',
        };
        const storeName = storeMap[type];
        if (storeName) {
          await this.indexedDB.clear(storeName);
        }
      }

      this.legacyCache.clear(type);
    }
  }

  // Storage-specific operations

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private setInMemory<T>(key: string, data: T, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private async getFromStorage<T>(
    storageType: StorageType,
    type: string,
    key: string,
  ): Promise<T | null> {
    switch (storageType) {
      case StorageType.INDEXED_DB:
        return this.getFromIndexedDB<T>(type, key);
      case StorageType.LOCAL_STORAGE:
        return this.legacyCache.get<T>(`${type}_${key}`);
      case StorageType.SERVICE_WORKER:
        // Service Worker cache is handled automatically for network requests
        return null;
      default:
        return null;
    }
  }

  private async setInStorage<T>(
    storageType: StorageType,
    type: string,
    key: string,
    data: T,
    ttl: number,
  ): Promise<void> {
    switch (storageType) {
      case StorageType.INDEXED_DB:
        await this.setInIndexedDB(type, key, data, ttl);
        break;
      case StorageType.LOCAL_STORAGE:
        this.legacyCache.set(`${type}_${key}`, data, ttl);
        break;
      case StorageType.SERVICE_WORKER:
        // Service Worker cache is handled automatically for network requests
        break;
    }
  }

  private async deleteFromStorage(
    storageType: StorageType,
    type: string,
    key: string,
  ): Promise<void> {
    switch (storageType) {
      case StorageType.INDEXED_DB:
        await this.deleteFromIndexedDB(type, key);
        break;
      case StorageType.LOCAL_STORAGE:
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(`hnews_cache_${type}_${key}`);
        }
        break;
      case StorageType.SERVICE_WORKER:
        // Service Worker cache deletion requires messaging
        await this.deleteFromServiceWorker(key);
        break;
    }
  }

  // IndexedDB helpers

  private async getFromIndexedDB<T>(type: string, key: string): Promise<T | null> {
    switch (type) {
      case 'story':
        return this.indexedDB.getStory(Number(key)) as Promise<T | null>;
      case 'storyList':
        return this.indexedDB.getStoryList(key) as Promise<T | null>;
      case 'user':
        return this.indexedDB.getUserProfile(key) as Promise<T | null>;
      default:
        return this.indexedDB.get<T>('apiCache', key);
    }
  }

  private async setInIndexedDB<T>(type: string, key: string, data: T, ttl: number): Promise<void> {
    switch (type) {
      case 'story':
        await this.indexedDB.setStory(data as unknown as HNItem);
        break;
      case 'storyList':
        await this.indexedDB.setStoryList(key, data as unknown as number[]);
        break;
      case 'user':
        await this.indexedDB.setUserProfile(key, data as unknown as HNUser);
        break;
      default:
        await this.indexedDB.set('apiCache', key, data, ttl);
    }
  }

  private async deleteFromIndexedDB(type: string, key: string): Promise<void> {
    const storeMap: Record<string, string> = {
      story: 'stories',
      storyList: 'storyLists',
      user: 'users',
    };

    const storeName = storeMap[type] || 'apiCache';
    await this.indexedDB.delete(storeName, key);
  }

  // Service Worker communication

  private async clearServiceWorkerCache(): Promise<void> {
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({ action: 'clear-cache' });
    }
  }

  private async deleteFromServiceWorker(key: string): Promise<void> {
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({
        action: 'delete-cache-item',
        key,
      });
    }
  }

  // Storage size management

  async getStorageInfo(): Promise<{
    used: number;
    quota: number;
    percentage: number;
  }> {
    if (
      typeof window === 'undefined' ||
      !window.navigator.storage ||
      !window.navigator.storage.estimate
    ) {
      return { used: 0, quota: 0, percentage: 0 };
    }

    const estimate = await window.navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (used / quota) * 100 : 0;

    return { used, quota, percentage };
  }

  async getCacheSizeByType(): Promise<Map<string, number>> {
    const sizes = new Map<string, number>();

    // Memory cache size (rough estimate)
    let memorySize = 0;
    this.memoryCache.forEach((value) => {
      memorySize += JSON.stringify(value).length;
    });
    sizes.set('memory', memorySize);

    // IndexedDB size
    const dbSize = await this.indexedDB.getStorageSize();
    sizes.set('indexeddb', dbSize);

    // localStorage size
    let localStorageSize = 0;
    if (typeof window !== 'undefined') {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith('hnews_')) {
          const value = window.localStorage.getItem(key) || '';
          localStorageSize += key.length + value.length;
        }
      }
    }
    sizes.set('localstorage', localStorageSize);

    return sizes;
  }

  // Prefetching support

  async prefetch<T>(type: string, keys: string[]): Promise<void> {
    const promises = keys.map((key) => this.get<T>(type, key));
    await Promise.all(promises);
  }

  // Offline support

  isOffline(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return !window.navigator.onLine;
  }

  async getOfflineData(): Promise<{
    stories: HNItem[];
    hasMore: boolean;
  }> {
    const storyIds = (await this.indexedDB.getStoryList('top')) || [];
    const stories = await this.indexedDB.getStories(storyIds.slice(0, 30));

    return {
      stories: Array.from(stories.values()),
      hasMore: storyIds.length > 30,
    };
  }

  // Helper method to clear memory cache
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    this.clearMemoryCache();
    await this.indexedDB.clearAll();
    this.legacyCache.clear();
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }
  }

  // Clear a specific cache type
  async clearType(type: string): Promise<void> {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(`${type}:`)) {
        this.memoryCache.delete(key);
      }
    }
    const storeMap: Record<string, string> = {
      stories: 'stories',
      storyLists: 'storyLists',
      users: 'users',
      apiCache: 'apiCache',
    };

    const storeName = storeMap[type];
    if (storeName) {
      await this.indexedDB.clear(storeName);
    }
    this.legacyCache.clear(type);
  }

  // Get cache statistics
  async getStats(): Promise<{
    indexedDB: number;
    swCache: number;
    itemCount: number;
    memoryItems: number;
  }> {
    let indexedDBSize = 0;
    let swCacheSize = 0;
    let itemCount = 0;

    // Get IndexedDB stats
    if (
      typeof window !== 'undefined' &&
      'navigator' in window &&
      'storage' in window.navigator &&
      window.navigator.storage &&
      'estimate' in window.navigator.storage
    ) {
      const estimate = await window.navigator.storage.estimate();
      indexedDBSize = estimate.usage || 0;
    }

    // Count items in IndexedDB
    const stores = ['stories', 'users', 'storyLists', 'apiCache'];
    for (const store of stores) {
      const count = await this.indexedDB.count(store);
      itemCount += count;
    }

    // Get Service Worker cache size (estimate)
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await window.caches.keys();
      for (const name of cacheNames) {
        const cache = await window.caches.open(name);
        const keys = await cache.keys();
        // Rough approximation: assume ~10KB per cached item
        swCacheSize += keys.length * 10000;
      }
    }

    return {
      indexedDB: indexedDBSize,
      swCache: swCacheSize,
      itemCount,
      memoryItems: this.memoryCache.size,
    };
  }

  // Update notification API
  getUpdates<T>(type: string, key: string): Observable<T> {
    const fullKey = `${type}:${key}`;
    const subject = this.getOrCreateSubject(fullKey);

    // Track subscriptions
    this.subjectRefCounts.set(fullKey, (this.subjectRefCounts.get(fullKey) || 0) + 1);

    return (subject.asObservable() as Observable<T>).pipe(
      finalize(() => {
        // Decrement ref count when subscription ends
        const count = (this.subjectRefCounts.get(fullKey) || 1) - 1;
        this.subjectRefCounts.set(fullKey, count);

        // Clean up subject if no subscribers
        if (count <= 0) {
          const subj = this.updateStreams.get(fullKey);
          if (subj) {
            subj.complete();
            this.updateStreams.delete(fullKey);
            this.subjectRefCounts.delete(fullKey);
          }
        }
      }),
    );
  }

  private emitUpdate<T>(type: string, key: string, data: T): void {
    const subject = this.getOrCreateSubject(`${type}:${key}`);
    subject.next(data);
  }

  private getOrCreateSubject(fullKey: string): Subject<unknown> {
    let subject = this.updateStreams.get(fullKey);
    if (!subject) {
      subject = new Subject<unknown>();
      this.updateStreams.set(fullKey, subject);
    }
    return subject;
  }

  private cleanupUnusedSubjects(): void {
    for (const [key, count] of this.subjectRefCounts.entries()) {
      if (count <= 0) {
        const subject = this.updateStreams.get(key);
        if (subject) {
          subject.complete();
        }
        this.updateStreams.delete(key);
        this.subjectRefCounts.delete(key);
      }
    }
  }
}
