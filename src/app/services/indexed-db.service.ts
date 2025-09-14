// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable } from '@angular/core';
import { HNItem, HNUser } from '../models/hn';

export interface CachedItem<T> {
  key: string | number;
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
}

export interface DBSchema {
  stories: CachedItem<HNItem>;
  users: CachedItem<HNUser>;
  storyLists: CachedItem<number[]>;
  apiCache: CachedItem<unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDBService {
  private dbName = 'hnews-cache-db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // Store names
  private stores = {
    STORIES: 'stories',
    USERS: 'users',
    STORY_LISTS: 'storyLists',
    API_CACHE: 'apiCache',
  };

  // Default TTLs in milliseconds
  private ttls = {
    STORY_LIST: 5 * 60 * 1000, // 5 minutes
    STORY_ITEM: 30 * 60 * 1000, // 30 minutes
    USER_PROFILE: 60 * 60 * 1000, // 1 hour
  };

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.cleanupExpired();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(this.stores.STORIES)) {
          const storyStore = db.createObjectStore(this.stores.STORIES, { keyPath: 'key' });
          storyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.USERS)) {
          const userStore = db.createObjectStore(this.stores.USERS, { keyPath: 'key' });
          userStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.STORY_LISTS)) {
          const listStore = db.createObjectStore(this.stores.STORY_LISTS, { keyPath: 'key' });
          listStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.API_CACHE)) {
          const apiStore = db.createObjectStore(this.stores.API_CACHE, { keyPath: 'key' });
          apiStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('IndexedDB not available');
    }
    return this.db;
  }

  // Generic get method
  async get<T>(storeName: string, key: string | number): Promise<T | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result as CachedItem<T> | undefined;

          if (!result) {
            resolve(null);
            return;
          }

          const now = Date.now();
          if (now - result.timestamp > result.ttl) {
            this.delete(storeName, key);
            resolve(null);
            return;
          }

          resolve(result.data);
        };

        request.onerror = () => {
          console.error('IndexedDB get error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  // Generic set method
  async set<T>(storeName: string, key: string | number, data: T, ttl?: number): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const cachedItem: CachedItem<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl: ttl || this.getDefaultTTL(storeName),
      };

      const request = store.put(cachedItem);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('IndexedDB set error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB set error:', error);
    }
  }

  // Generic delete method
  async delete(storeName: string, key: string | number): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('IndexedDB delete error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB delete error:', error);
    }
  }

  // Clear a specific store
  async clear(storeName: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('IndexedDB clear error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
    }
  }

  // Clear all stores
  async clearAll(): Promise<void> {
    const stores = Object.values(this.stores);
    await Promise.all(stores.map((store) => this.clear(store)));
  }

  // Specific methods for different data types
  async getStory(id: number): Promise<HNItem | null> {
    return this.get<HNItem>(this.stores.STORIES, id);
  }

  async setStory(story: HNItem): Promise<void> {
    return this.set(this.stores.STORIES, story.id, story, this.ttls.STORY_ITEM);
  }

  async getStoryList(type: string): Promise<number[] | null> {
    return this.get<number[]>(this.stores.STORY_LISTS, type);
  }

  async setStoryList(type: string, ids: number[]): Promise<void> {
    return this.set(this.stores.STORY_LISTS, type, ids, this.ttls.STORY_LIST);
  }

  async getUserProfile(username: string): Promise<HNUser | null> {
    return this.get<HNUser>(this.stores.USERS, username);
  }

  async setUserProfile(username: string, profile: HNUser): Promise<void> {
    return this.set(this.stores.USERS, username, profile, this.ttls.USER_PROFILE);
  }

  // Batch operations
  async getStories(ids: number[]): Promise<Map<number, HNItem>> {
    const result = new Map<number, HNItem>();
    const promises = ids.map(async (id) => {
      const story = await this.getStory(id);
      if (story) {
        result.set(id, story);
      }
    });

    await Promise.all(promises);
    return result;
  }

  async setStories(stories: HNItem[]): Promise<void> {
    const promises = stories.map((story) => this.setStory(story));
    await Promise.all(promises);
  }

  // Cleanup expired items
  private async cleanupExpired(): Promise<void> {
    if (!this.db) return;

    const stores = Object.values(this.stores);
    const now = Date.now();

    for (const storeName of stores) {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('timestamp');
        const request = index.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const item = cursor.value as CachedItem<unknown>;
            if (now - item.timestamp > item.ttl) {
              cursor.delete();
            }
            cursor.continue();
          }
        };
      } catch (error) {
        console.error('Cleanup error for store', storeName, error);
      }
    }
  }

  // Get storage size
  async getStorageSize(): Promise<number> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return 0;
    }

    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }

  // Get default TTL for a store
  private getDefaultTTL(storeName: string): number {
    switch (storeName) {
      case this.stores.STORIES:
        return this.ttls.STORY_ITEM;
      case this.stores.USERS:
        return this.ttls.USER_PROFILE;
      case this.stores.STORY_LISTS:
        return this.ttls.STORY_LIST;
      default:
        return this.ttls.STORY_ITEM;
    }
  }

  // Migration from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    const prefix = 'hnews_cache_';
    const keys = Object.keys(localStorage);
    let migrated = 0;

    for (const key of keys) {
      if (key.startsWith(prefix)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const data = JSON.parse(value);
            const cleanKey = key.replace(prefix, '');

            // Determine which store to use based on key pattern
            if (cleanKey.startsWith('user_')) {
              const username = cleanKey.replace('user_', '');
              await this.setUserProfile(username, data.data);
              migrated++;
            } else if (cleanKey.includes('stories')) {
              await this.set(this.stores.STORY_LISTS, cleanKey, data.data, data.ttl);
              migrated++;
            }
          }
        } catch (error) {
          console.error('Migration error for key:', key, error);
        }
      }
    }

    if (migrated > 0) {
      console.log(`Migrated ${migrated} items from localStorage to IndexedDB`);
    }
  }

  // Count items in a store
  async count(storeName: string): Promise<number> {
    await this.initDB();
    const tx = this.db!.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
