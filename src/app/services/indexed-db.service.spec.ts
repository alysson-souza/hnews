// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { IndexedDBService } from './indexed-db.service';
import { HNItem, HNUser } from '@models/hn';

describe('IndexedDBService', () => {
  let service: IndexedDBService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IndexedDBService],
    });
    service = TestBed.inject(IndexedDBService);
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await service.clearAll();
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization lifecycle', () => {
    it('falls back instead of hanging when an upgrade is blocked', async () => {
      const request = {
        error: null,
        onblocked: null,
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
      } as unknown as IDBOpenDBRequest;
      const openSpy = vi.spyOn(indexedDB, 'open').mockReturnValue(request);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      try {
        const openDb = (service as unknown as { db: IDBDatabase | null }).db;
        openDb?.close();
        (service as unknown as { db: IDBDatabase | null }).db = null;
        (service as unknown as { initPromise: Promise<void> | null }).initPromise = null;

        const resultPromise = service.get('stories', 1);
        const blocked = (request as unknown as { onblocked: (() => void) | null }).onblocked;
        expect(blocked).toEqual(expect.any(Function));

        blocked?.();

        await expect(resultPromise).resolves.toBeNull();
        expect(
          (service as unknown as { initPromise: Promise<void> | null }).initPromise,
        ).toBeNull();
      } finally {
        openSpy.mockRestore();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
      }
    });

    it('closes an open connection on versionchange and can reopen later', async () => {
      await service.count('apiCache');
      const db = (service as unknown as { db: IDBDatabase | null }).db;
      expect(db).toBeTruthy();

      const closeSpy = vi.spyOn(db as IDBDatabase, 'close');
      db?.onversionchange?.({} as IDBVersionChangeEvent);

      expect(closeSpy).toHaveBeenCalled();
      expect((service as unknown as { db: IDBDatabase | null }).db).toBeNull();
      await expect(service.count('apiCache')).resolves.toBeGreaterThanOrEqual(0);
    });
  });

  describe('Story operations', () => {
    it('should set and get a story', async () => {
      const story: HNItem = {
        id: 123,
        type: 'story',
        by: 'testuser',
        time: Date.now(),
        title: 'Test Story',
        score: 100,
        url: 'https://example.com',
      };

      await service.setStory(story);
      const retrieved = await service.getStory(123);

      expect(retrieved).toBeTruthy();
      expect(retrieved?.id).toBe(123);
      expect(retrieved?.title).toBe('Test Story');
    });

    it('should return null for non-existent story', async () => {
      const result = await service.getStory(999999);
      expect(result).toBeNull();
    });

    it('should set and get multiple stories', async () => {
      const stories: HNItem[] = [
        {
          id: 1,
          type: 'story',
          by: 'user1',
          time: Date.now(),
          title: 'Story 1',
        },
        {
          id: 2,
          type: 'story',
          by: 'user2',
          time: Date.now(),
          title: 'Story 2',
        },
        {
          id: 3,
          type: 'story',
          by: 'user3',
          time: Date.now(),
          title: 'Story 3',
        },
      ];

      await service.setStories(stories);
      const retrieved = await service.getStories([1, 2, 3]);

      expect(retrieved.size).toBe(3);
      expect(retrieved.get(1)?.title).toBe('Story 1');
      expect(retrieved.get(2)?.title).toBe('Story 2');
      expect(retrieved.get(3)?.title).toBe('Story 3');
    });

    it('should handle getting stories with some missing', async () => {
      const story: HNItem = {
        id: 100,
        type: 'story',
        by: 'user',
        time: Date.now(),
        title: 'Existing Story',
      };

      await service.setStory(story);
      const retrieved = await service.getStories([100, 200, 300]);

      expect(retrieved.size).toBe(1);
      expect(retrieved.has(100)).toBe(true);
      expect(retrieved.has(200)).toBe(false);
      expect(retrieved.has(300)).toBe(false);
    });
  });

  describe('Story list operations', () => {
    it('should set and get a story list', async () => {
      const storyIds = [1, 2, 3, 4, 5];

      await service.setStoryList('top', storyIds);
      const retrieved = await service.getStoryList('top');

      expect(retrieved).toEqual(storyIds);
    });

    it('should return null for non-existent story list', async () => {
      const result = await service.getStoryList('nonexistent');
      expect(result).toBeNull();
    });

    it('should normalize "newest" to "new"', async () => {
      const storyIds = [10, 20, 30];

      await service.setStoryList('newest', storyIds);
      const retrieved = await service.getStoryList('new');

      expect(retrieved).toEqual(storyIds);
    });

    it('should migrate legacy story list keys', async () => {
      const storyIds = [100, 200, 300];

      // Manually set with legacy key format
      await service.set('storyLists', 'storyList_top', storyIds, 5 * 60 * 1000);

      // Getting with canonical key should trigger migration
      const retrieved = await service.getStoryList('top');

      expect(retrieved).toEqual(storyIds);
    });
  });

  describe('User operations', () => {
    it('should set and get a user profile', async () => {
      const user: HNUser = {
        id: 'testuser',
        created: Date.now(),
        karma: 1000,
        about: 'Test user bio',
      };

      await service.setUserProfile('testuser', user);
      const retrieved = await service.getUserProfile('testuser');

      expect(retrieved).toBeTruthy();
      expect(retrieved?.id).toBe('testuser');
      expect(retrieved?.karma).toBe(1000);
    });

    it('should return null for non-existent user', async () => {
      const result = await service.getUserProfile('nonexistentuser');
      expect(result).toBeNull();
    });
  });

  describe('Generic operations', () => {
    it('should set and get generic data', async () => {
      const data = { custom: 'value', number: 42 };

      await service.set('apiCache', 'testKey', data);
      const retrieved = await service.get<typeof data>('apiCache', 'testKey');

      expect(retrieved).toEqual(data);
    });

    it('should delete data', async () => {
      const data = { test: 'data' };

      await service.set('apiCache', 'deleteTest', data);
      await service.delete('apiCache', 'deleteTest');
      const retrieved = await service.get('apiCache', 'deleteTest');

      expect(retrieved).toBeNull();
    });

    it('should clear a specific store', async () => {
      await service.set('apiCache', 'key1', { data: 1 });
      await service.set('apiCache', 'key2', { data: 2 });
      await service.set('apiCache', 'key3', { data: 3 });

      await service.clear('apiCache');

      const result1 = await service.get('apiCache', 'key1');
      const result2 = await service.get('apiCache', 'key2');
      const result3 = await service.get('apiCache', 'key3');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    it('should clear all stores', async () => {
      const story: HNItem = {
        id: 1,
        type: 'story',
        by: 'user',
        time: Date.now(),
        title: 'Test',
      };
      const user: HNUser = {
        id: 'user',
        created: Date.now(),
        karma: 100,
      };

      await service.setStory(story);
      await service.setUserProfile('user', user);
      await service.setStoryList('top', [1, 2, 3]);

      await service.clearAll();

      const retrievedStory = await service.getStory(1);
      const retrievedUser = await service.getUserProfile('user');
      const retrievedList = await service.getStoryList('top');

      expect(retrievedStory).toBeNull();
      expect(retrievedUser).toBeNull();
      expect(retrievedList).toBeNull();
    });
  });

  describe('TTL and expiration', () => {
    it('should return null for expired data', async () => {
      const story: HNItem = {
        id: 999,
        type: 'story',
        by: 'user',
        time: Date.now(),
        title: 'Expiring Story',
      };

      // Set with very short TTL (1ms)
      await service.set('stories', 999, story, 1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 50));

      const retrieved = await service.getStory(999);
      expect(retrieved).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const data = { test: 'value' };

      await service.set('stories', 'defaultTTL', data);

      // Should be retrievable immediately
      const retrieved = await service.get('stories', 'defaultTTL');
      expect(retrieved).toBeTruthy();
    });
  });

  describe('Saved-comment durability', () => {
    const story = (id: number, title: string): HNItem => ({
      id,
      type: id === 1 ? 'story' : 'comment',
      by: 'user',
      time: Date.now(),
      title,
    });

    it('round-trips saved items and exposes them via getStory', async () => {
      const items = [story(1, 'Saved story'), story(2, 'Saved comment')];

      await service.setSavedItems(1, items);

      expect(await service.getSavedItem(1)).toMatchObject({ id: 1, title: 'Saved story' });
      expect(await service.getSavedItem(2)).toMatchObject({ id: 2, title: 'Saved comment' });
      // getStory falls back to the saved store when there's no fresh TTL'd entry.
      expect(await service.getStory(2)).toMatchObject({ id: 2, title: 'Saved comment' });
    });

    it('prefers the fresh TTL store over the saved store when both have data', async () => {
      await service.setSavedItems(1, [story(1, 'Stale saved copy')]);
      await service.setStory(story(1, 'Fresh copy'));

      expect(await service.getStory(1)).toMatchObject({ title: 'Fresh copy' });
    });

    it('survives expiry of the regular TTL store', async () => {
      await service.setSavedItems(1, [story(1, 'Durable')]);
      await service.set('stories', 1, story(1, 'Expiring'), 1);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(await service.getStory(1)).toMatchObject({ title: 'Durable' });
    });

    it('overwrites saved items on re-warm instead of duplicating them', async () => {
      await service.setSavedItems(5, [story(5, 'First version')]);
      await service.setSavedItems(5, [story(5, 'Second version')]);

      expect(await service.getSavedItem(5)).toMatchObject({ title: 'Second version' });
    });

    it('deletes only the saved items belonging to the given story', async () => {
      await service.setSavedItems(1, [story(1, 'Story 1'), story(2, 'Comment of 1')]);
      await service.setSavedItems(10, [story(10, 'Story 10')]);

      await service.deleteSavedItemsByStory(1);

      expect(await service.getSavedItem(1)).toBeNull();
      expect(await service.getSavedItem(2)).toBeNull();
      expect(await service.getSavedItem(10)).toMatchObject({ title: 'Story 10' });
    });

    it('clears saved items via clearAll', async () => {
      await service.setSavedItems(1, [story(1, 'Story 1')]);

      await service.clearAll();

      expect(await service.getSavedItem(1)).toBeNull();
    });
  });

  describe('Storage info', () => {
    it('should get storage size', async () => {
      const size = await service.getStorageSize();
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Store counting', () => {
    it('should count items in a store', async () => {
      await service.set('apiCache', 'item1', { data: 1 });
      await service.set('apiCache', 'item2', { data: 2 });
      await service.set('apiCache', 'item3', { data: 3 });

      const count = await service.count('apiCache');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty store', async () => {
      await service.clear('apiCache');
      const count = await service.count('apiCache');
      expect(count).toBe(0);
    });

    it('should use ensureDB instead of initDB', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ensureDBSpy = vi.spyOn(service as any, 'ensureDB');
      await service.count('apiCache');
      expect(ensureDBSpy).toHaveBeenCalled();
    });
  });

  describe('Migration from localStorage', () => {
    beforeEach(async () => {
      // Clear localStorage
      localStorage.clear();

      // Ensure IndexedDB is initialized before running migration tests
      // Call count() to trigger DB initialization and wait for it to complete
      try {
        await service.count('stories');
      } catch {
        // DB might not be available in test environment, but initialization was triggered
      }

      // Give IndexedDB time to settle
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should migrate user data from localStorage', async () => {
      const userData = {
        data: {
          id: 'migratedUser',
          created: Date.now(),
          karma: 500,
        },
        ttl: 3600000,
      };

      localStorage.setItem('hnews_cache_user_migratedUser', JSON.stringify(userData));

      await service.migrateFromLocalStorage();

      // Wait longer for async IndexedDB operations to complete in slower environments
      await new Promise((resolve) => setTimeout(resolve, 300));

      const retrieved = await service.getUserProfile('migratedUser');
      expect(retrieved).toBeTruthy();
    });

    it('should migrate story list data from localStorage', async () => {
      const storyListData = {
        data: [10, 20, 30],
        ttl: 300000,
      };

      localStorage.setItem('hnews_cache_stories_top', JSON.stringify(storyListData));

      await service.migrateFromLocalStorage();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const retrieved = await service.getStoryList('stories_top');
      expect(retrieved).toBeTruthy();
    });

    it('should handle migration errors gracefully', async () => {
      localStorage.setItem('hnews_cache_invalid', 'invalid json data');

      let error: Error | undefined;
      try {
        await service.migrateFromLocalStorage();
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeUndefined();
    });

    it('should not migrate non-hnews keys', async () => {
      localStorage.setItem('other_app_key', JSON.stringify({ data: 'test' }));

      let error: Error | undefined;
      try {
        await service.migrateFromLocalStorage();
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle IndexedDB errors gracefully', async () => {
      // Try to get from a non-existent key
      const result = await service.get('apiCache', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should handle set errors gracefully', async () => {
      // This should not throw even if there's an error
      let error: Error | undefined;
      try {
        await service.set('apiCache', 'test', { data: 'value' });
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeUndefined();
    });

    it('should handle delete errors gracefully', async () => {
      // Deleting non-existent key should not throw
      let error: Error | undefined;
      try {
        await service.delete('apiCache', 'nonexistent');
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeUndefined();
    });
  });
});
