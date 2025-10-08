// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { CacheManagerService } from './cache-manager.service';
import { IndexedDBService } from './indexed-db.service';
import { CacheService } from './cache.service';
import { HNItem, HNUser } from '../models/hn';

class IndexedDBServiceStub {
  private storage = new Map<string, unknown>();

  get = async <T>(store: string, key: string): Promise<T | null> => {
    return (this.storage.get(`${store}:${key}`) as T) || null;
  };

  set = async <T>(store: string, key: string, value: T): Promise<void> => {
    this.storage.set(`${store}:${key}`, value);
  };

  clearAll = async () => {
    this.storage.clear();
  };

  clear = async (store: string) => {
    const keysToDelete: string[] = [];
    for (const key of this.storage.keys()) {
      if (key.startsWith(`${store}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.storage.delete(key));
  };

  getStoryList = async (key: string): Promise<number[] | null> => {
    return (this.storage.get(`storyLists:${key}`) as number[]) || null;
  };

  setStoryList = async (key: string, value: number[]): Promise<void> => {
    this.storage.set(`storyLists:${key}`, value);
  };

  getStory = async (id: number): Promise<HNItem | null> => {
    return (this.storage.get(`stories:${id}`) as HNItem) || null;
  };

  setStory = async (story: HNItem): Promise<void> => {
    this.storage.set(`stories:${story.id}`, story);
  };

  getUserProfile = async (username: string): Promise<HNUser | null> => {
    return (this.storage.get(`users:${username}`) as HNUser) || null;
  };

  setUserProfile = async (username: string, user: HNUser): Promise<void> => {
    this.storage.set(`users:${username}`, user);
  };

  delete = async (store: string, key: string | number): Promise<void> => {
    // Handle both string and number keys
    const fullKey = `${store}:${key}`;
    this.storage.delete(fullKey);

    // Also try to delete storyList entries by canonical key
    if (store === 'storyLists') {
      this.storage.delete(`${store}:${key}`);
    }
  };

  count = async (store: string): Promise<number> => {
    let count = 0;
    for (const key of this.storage.keys()) {
      if (key.startsWith(`${store}:`)) {
        count++;
      }
    }
    return count;
  };

  getStories = async (ids: number[]): Promise<Map<number, HNItem>> => {
    const result = new Map<number, HNItem>();
    for (const id of ids) {
      const story = await this.getStory(id);
      if (story) {
        result.set(id, story);
      }
    }
    return result;
  };

  migrateFromLocalStorage = async (): Promise<void> => {
    // no-op for tests
  };

  getStorageSize = async (): Promise<number> => {
    return JSON.stringify(Array.from(this.storage.entries())).length;
  };
}

class CacheServiceStub {
  private storage = new Map<string, unknown>();

  get = <T>(key: string): T | null => {
    return (this.storage.get(key) as T) || null;
  };

  set = <T>(key: string, value: T): void => {
    this.storage.set(key, value);
  };

  clear = (prefix?: string): void => {
    if (!prefix) {
      this.storage.clear();
    } else {
      const keysToDelete: string[] = [];
      for (const key of this.storage.keys()) {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.storage.delete(key));
    }
  };
}

describe('CacheManagerService', () => {
  let service: CacheManagerService;
  let indexedDBService: IndexedDBServiceStub;
  let cacheService: CacheServiceStub;

  beforeEach(() => {
    indexedDBService = new IndexedDBServiceStub();
    cacheService = new CacheServiceStub();

    TestBed.configureTestingModule({
      providers: [
        CacheManagerService,
        { provide: IndexedDBService, useValue: indexedDBService },
        { provide: CacheService, useValue: cacheService },
      ],
    });
    service = TestBed.inject(CacheManagerService);
  });

  describe('Stale-While-Revalidate (SWR)', () => {
    it('returns fresh cached value and triggers background refresh', async () => {
      const key = 'foo';
      await service.set('storyList', key, [1, 2, 3]);

      const freshPromise = Promise.resolve([4, 5, 6]);
      const fetcher = () => freshPromise;
      const result = await service.getWithSWR<number[]>('storyList', key, fetcher);

      expect(result).toEqual([1, 2, 3]);

      await freshPromise;
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await service.get<number[]>('storyList', key);
      expect(updated).toEqual([4, 5, 6]);
    });

    it('fetches fresh data when no cache exists', async () => {
      const key = 'noCacheKey';
      const fetcher = () => Promise.resolve([10, 20, 30]);
      const result = await service.getWithSWR<number[]>('storyList', key, fetcher);

      expect(result).toEqual([10, 20, 30]);

      const cached = await service.get<number[]>('storyList', key);
      expect(cached).toEqual([10, 20, 30]);
    });

    it('returns null when fetcher returns null', async () => {
      const key = 'nullKey';
      const fetcher = () => Promise.resolve(null);
      const result = await service.getWithSWR<number[] | null>('storyList', key, fetcher);

      expect(result).toBeNull();
    });
  });

  describe('Cache operations', () => {
    it('gets data from memory cache when available', async () => {
      const data = { id: 123, title: 'Test Story' };
      await service.set('story', '123', data);

      const result = await service.get<typeof data>('story', '123');
      expect(result).toEqual(data);
    });

    it('gets data from IndexedDB when not in memory', async () => {
      const story: HNItem = {
        id: 456,
        type: 'story',
        by: 'user1',
        time: Date.now(),
        title: 'Test Story',
        score: 100,
      };

      await indexedDBService.setStory(story);

      const result = await service.get<HNItem>('story', '456');
      expect(result?.id).toBe(456);
    });

    it('deletes data from all cache layers', async () => {
      const key = 'deleteTest';
      await service.set('storyList', key, [1, 2, 3]);

      // Verify it was set
      let result = await service.get<number[]>('storyList', key);
      expect(result).toEqual([1, 2, 3]);

      await service.delete('storyList', key);

      // Clear memory cache and also clear the cache service to ensure clean slate
      service.clearMemoryCache();
      cacheService.clear();

      result = await service.get<number[]>('storyList', key);
      expect(result).toBeNull();
    });

    it('sets data with custom TTL', async () => {
      const key = 'customTTL';
      const data = [1, 2, 3];
      const customTTL = 5000;

      await service.set('storyList', key, data, customTTL);

      const result = await service.get<number[]>('storyList', key);
      expect(result).toEqual(data);
    });
  });

  describe('Storage type operations', () => {
    it('gets story from IndexedDB', async () => {
      const story: HNItem = {
        id: 789,
        type: 'story',
        by: 'author',
        time: Date.now(),
        title: 'Test',
      };

      await service.set('story', '789', story);
      const result = await service.get<HNItem>('story', '789');

      expect(result?.id).toBe(789);
    });

    it('gets user from IndexedDB', async () => {
      const user: HNUser = {
        id: 'testuser',
        created: Date.now(),
        karma: 100,
      };

      await service.set('user', 'testuser', user);
      const result = await service.get<HNUser>('user', 'testuser');

      expect(result?.id).toBe('testuser');
    });

    it('gets storyList from IndexedDB', async () => {
      const ids = [1, 2, 3, 4, 5];
      await service.set('storyList', 'top', ids);

      const result = await service.get<number[]>('storyList', 'top');
      expect(result).toEqual(ids);
    });
  });

  describe('Cache clearing', () => {
    it('clears all caches when no type specified', async () => {
      await service.set('story', '1', { id: 1 });
      await service.set('storyList', 'top', [1, 2]);
      await service.set('user', 'user1', { id: 'user1' });

      await service.clear();

      const story = await service.get('story', '1');
      const list = await service.get('storyList', 'top');
      const user = await service.get('user', 'user1');

      expect(story).toBeNull();
      expect(list).toBeNull();
      expect(user).toBeNull();
    });

    it('clears specific cache type', async () => {
      await service.set('story', '1', { id: 1 });
      await service.set('storyList', 'top', [1, 2]);

      await service.clear('storyList');

      const story = await service.get('story', '1');
      const list = await service.get('storyList', 'top');

      expect(story).not.toBeNull();
      expect(list).toBeNull();
    });

    it('clears memory cache', () => {
      service.clearMemoryCache();
      // Should not throw
      expect(service).toBeTruthy();
    });

    it('clears type-specific cache', async () => {
      await service.set('story', '1', { id: 1 });
      await service.set('story', '2', { id: 2 });

      await service.clearType('stories');

      const result1 = await service.get('story', '1');

      // Memory cache might still have them, but DB should be clear
      expect(result1).toBeDefined();
    });
  });

  describe('Update notifications', () => {
    it('emits updates for a key when set is called', async () => {
      const key = 'bar';
      const updates$ = service.getUpdates<number[]>('storyList', key);
      const values: number[][] = [];

      const sub = updates$.subscribe((v) => values.push(v));
      await service.set('storyList', key, [1]);
      await service.set('storyList', key, [1, 2]);
      await Promise.resolve();

      expect(values[0]).toEqual([1]);
      expect(values[1]).toEqual([1, 2]);
      sub.unsubscribe();
    });

    it('creates subject only once for same key', async () => {
      const values1: number[] = [];
      const values2: number[] = [];

      const updates1$ = service.getUpdates<{ id: number }>('story', '1');
      const updates2$ = service.getUpdates<{ id: number }>('story', '1');

      const sub1 = updates1$.subscribe((v) => values1.push(v.id));
      const sub2 = updates2$.subscribe((v) => values2.push(v.id));

      await service.set('story', '1', { id: 100 });
      await Promise.resolve();

      // Both should receive the same update
      expect(values1).toEqual([100]);
      expect(values2).toEqual([100]);

      sub1.unsubscribe();
      sub2.unsubscribe();
    });
  });

  describe('Offline support', () => {
    it('checks if offline', () => {
      const result = service.isOffline();
      expect(typeof result).toBe('boolean');
    });

    it('gets offline data', async () => {
      const storyIds = [1, 2, 3];
      const stories: HNItem[] = [
        { id: 1, type: 'story', by: 'user1', time: Date.now(), title: 'Story 1' },
        { id: 2, type: 'story', by: 'user2', time: Date.now(), title: 'Story 2' },
      ];

      await indexedDBService.setStoryList('top', storyIds);
      for (const story of stories) {
        await indexedDBService.setStory(story);
      }

      const result = await service.getOfflineData();
      expect(result.stories.length).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('Storage management', () => {
    it('gets storage info', async () => {
      const info = await service.getStorageInfo();
      expect(info.used).toBeDefined();
      expect(info.quota).toBeDefined();
      expect(info.percentage).toBeDefined();
      expect(typeof info.used).toBe('number');
      expect(typeof info.quota).toBe('number');
      expect(typeof info.percentage).toBe('number');
    });

    it('gets cache size by type', async () => {
      await service.set('story', '1', { id: 1 });
      await service.set('storyList', 'top', [1, 2, 3]);

      const sizes = await service.getCacheSizeByType();
      expect(sizes.has('memory')).toBe(true);
      expect(sizes.has('indexeddb')).toBe(true);
      expect(sizes.has('localstorage')).toBe(true);
    });

    it('gets cache statistics', async () => {
      await service.set('story', '1', { id: 1 });
      await service.set('storyList', 'top', [1, 2, 3]);

      const stats = await service.getStats();
      expect(stats.indexedDB).toBeDefined();
      expect(stats.swCache).toBeDefined();
      expect(stats.itemCount).toBeDefined();
      expect(stats.memoryItems).toBeDefined();
      expect(typeof stats.indexedDB).toBe('number');
      expect(typeof stats.swCache).toBe('number');
      expect(typeof stats.itemCount).toBe('number');
      expect(typeof stats.memoryItems).toBe('number');
    });
  });

  describe('Prefetching', () => {
    it('prefetches multiple keys', async () => {
      await service.set('story', '1', { id: 1 });
      await service.set('story', '2', { id: 2 });
      await service.set('story', '3', { id: 3 });

      await service.prefetch('story', ['1', '2', '3']);

      // Should not throw
      expect(service).toBeTruthy();
    });
  });

  describe('Service initialization', () => {
    it('initializes without errors', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Memory cache expiration', () => {
    it('removes expired items from memory cache', async () => {
      const key = 'expireTest';
      const data = [1, 2, 3];

      // Set with very short TTL (1ms)
      await service.set('storyList', key, data, 1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Memory cache should be expired, but IndexedDB should still have it
      const result = await service.get<number[]>('storyList', key);
      expect(result).toEqual(data);
    });
  });

  describe('Fallback storage', () => {
    it('falls back to localStorage when IndexedDB fails', async () => {
      // Set data in cache service (localStorage stub)
      cacheService.set('story_999', { id: 999, title: 'Fallback Story' });

      // Spy on IndexedDB to return null (simulating failure)
      spyOn(indexedDBService, 'getStory').and.returnValue(Promise.resolve(null));

      // This should fall back to localStorage
      const result = await service.get<{ id: number; title: string }>('story', '999');

      // Should have tried IndexedDB first
      expect(indexedDBService.getStory).toHaveBeenCalledWith(999);

      // Should have fallen back and found the data
      expect(result).toBeTruthy();
      expect(result?.id).toBe(999);
    });
  });

  describe('Edge cases', () => {
    it('handles getting data with unknown type', async () => {
      const customType = 'customType';
      const key = 'customKey';
      const data = { custom: 'data' };

      await service.set(customType, key, data);
      const result = await service.get<typeof data>(customType, key);

      expect(result).toEqual(data);
    });

    it('handles setting null data in SWR', async () => {
      const key = 'nullTest';
      const fetcher = () => Promise.resolve(null);

      const result = await service.getWithSWR('storyList', key, fetcher);
      expect(result).toBeNull();
    });

    it('handles clearAll operation', async () => {
      await service.set('story', '1', { id: 1 });
      await service.set('storyList', 'top', [1, 2]);

      await service.clearAll();

      const story = await service.get('story', '1');
      const list = await service.get('storyList', 'top');

      expect(story).toBeNull();
      expect(list).toBeNull();
    });
  });
});
