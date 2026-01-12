// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { Mock, MockedObject } from 'vitest';
import { BatchedItemLoaderService } from './batched-item-loader.service';
import { CacheManagerService } from './cache-manager.service';
import { HnApiClient } from '../data/hn-api.client';
import { HNItem } from '../models/hn';

describe('BatchedItemLoaderService', () => {
  let service: BatchedItemLoaderService;
  let cache: MockedObject<CacheManagerService>;
  let hnClient: MockedObject<HnApiClient>;
  let cacheStore: Map<string, HNItem | null>;
  let cacheGetSpy: Mock;
  let cacheSetSpy: Mock;

  const makeItem = (id: number, overrides: Partial<HNItem> = {}): HNItem => ({
    id,
    type: 'comment',
    time: Date.now() / 1000,
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();

    cacheStore = new Map();

    cacheGetSpy = vi.fn().mockImplementation(async (type: string, key: string) => {
      const storeKey = `${type}:${key}`;
      return cacheStore.get(storeKey) ?? null;
    });

    cacheSetSpy = vi.fn().mockImplementation(async (type: string, key: string, value: unknown) => {
      cacheStore.set(`${type}:${key}`, value as HNItem);
    });

    cache = {
      get: cacheGetSpy,
      set: cacheSetSpy,
    } as unknown as MockedObject<CacheManagerService>;

    hnClient = {
      item: vi.fn().mockReturnValue(of(null)),
    } as unknown as MockedObject<HnApiClient>;

    TestBed.configureTestingModule({
      providers: [
        BatchedItemLoaderService,
        { provide: CacheManagerService, useValue: cache },
        { provide: HnApiClient, useValue: hnClient },
      ],
    });

    service = TestBed.inject(BatchedItemLoaderService);
  });

  afterEach(async () => {
    // Flush any pending timers before cleanup to avoid unhandled rejections
    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  describe('getItem', () => {
    it('returns cached item without calling the API', async () => {
      const cachedItem = makeItem(42);
      cacheStore.set('story:42', cachedItem);

      const result = await service.getItem(42);

      expect(result).toEqual(cachedItem);
      expect(hnClient.item).not.toHaveBeenCalled();
    });

    it('fetches from API when cache misses', async () => {
      const freshItem = makeItem(100);
      hnClient.item.mockReturnValue(of(freshItem));

      const promise = service.getItem(100);

      // Advance timers to trigger batch flush
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toEqual(freshItem);
      expect(hnClient.item).toHaveBeenCalledWith(100);
    });

    it('caches fetched items', async () => {
      const freshItem = makeItem(200);
      hnClient.item.mockReturnValue(of(freshItem));

      const promise = service.getItem(200);
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();
      await promise;

      expect(cacheSetSpy).toHaveBeenCalledWith('story', '200', freshItem);
    });

    it('bypasses cache when forceRefresh is true', async () => {
      const cachedItem = makeItem(300, { title: 'Cached' });
      const freshItem = makeItem(300, { title: 'Fresh' });
      cacheStore.set('story:300', cachedItem);
      hnClient.item.mockReturnValue(of(freshItem));

      const promise = service.getItem(300, true);
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual(freshItem);
      expect(hnClient.item).toHaveBeenCalledWith(300);
    });

    it('returns null when API returns null', async () => {
      hnClient.item.mockReturnValue(of(null));

      const promise = service.getItem(404);
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBeNull();
    });

    it('returns null on API error', async () => {
      hnClient.item.mockReturnValue(throwError(() => new Error('Network error')));

      const promise = service.getItem(500);
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBeNull();
    });
  });

  describe('batching behavior', () => {
    it('batches multiple concurrent requests', async () => {
      const item1 = makeItem(1);
      const item2 = makeItem(2);
      const item3 = makeItem(3);

      hnClient.item.mockImplementation((id: number) => {
        const items: Record<number, HNItem> = { 1: item1, 2: item2, 3: item3 };
        return of(items[id] ?? null);
      });

      const promise1 = service.getItem(1);
      const promise2 = service.getItem(2);
      const promise3 = service.getItem(3);

      // Before timer fires, no API calls yet
      expect(hnClient.item).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();

      const results = await Promise.all([promise1, promise2, promise3]);

      // All three items fetched in one batch
      expect(hnClient.item).toHaveBeenCalledTimes(3);
      expect(results).toContain(item1);
      expect(results).toContain(item2);
      expect(results).toContain(item3);
    });

    it('flushes immediately when batch size is reached', async () => {
      // Create 20 items (batch size)
      const items: HNItem[] = [];
      for (let i = 1; i <= 20; i++) {
        items.push(makeItem(i));
      }

      hnClient.item.mockImplementation((id: number) => {
        return of(items.find((item) => item.id === id) ?? null);
      });

      const promises: Promise<HNItem | null>[] = [];
      for (let i = 1; i <= 20; i++) {
        promises.push(service.getItem(i));
      }

      // Should flush immediately without waiting for timeout
      // No need to advance timers - batch size triggers immediate flush
      await vi.runAllTimersAsync();
      await Promise.all(promises);

      expect(hnClient.item).toHaveBeenCalledTimes(20);
    });

    it('creates multiple batches for requests exceeding batch size', async () => {
      const items: HNItem[] = [];
      for (let i = 1; i <= 25; i++) {
        items.push(makeItem(i));
      }

      hnClient.item.mockImplementation((id: number) => {
        return of(items.find((item) => item.id === id) ?? null);
      });

      const promises: Promise<HNItem | null>[] = [];
      for (let i = 1; i <= 25; i++) {
        promises.push(service.getItem(i));
      }

      // First batch (20 items) flushes immediately, second batch (5 items) after timer
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();
      await Promise.all(promises);

      expect(hnClient.item).toHaveBeenCalledTimes(25);
    });

    it('deduplicates concurrent requests for the same ID', async () => {
      const item = makeItem(42);
      hnClient.item.mockReturnValue(of(item));

      // Request same ID multiple times concurrently
      const promise1 = service.getItem(42);
      const promise2 = service.getItem(42);
      const promise3 = service.getItem(42);

      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      // Should only make one API call
      expect(hnClient.item).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(item);
      expect(result2).toEqual(item);
      expect(result3).toEqual(item);
    });
  });

  describe('getItems', () => {
    it('returns empty array for empty input', async () => {
      const result = await service.getItems([]);
      expect(result).toEqual([]);
    });

    it('fetches multiple items in a batch', async () => {
      const item1 = makeItem(1);
      const item2 = makeItem(2);
      const item3 = makeItem(3);

      hnClient.item.mockImplementation((id: number) => {
        const items: Record<number, HNItem> = { 1: item1, 2: item2, 3: item3 };
        return of(items[id] ?? null);
      });

      const promise = service.getItems([1, 2, 3]);
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual([item1, item2, item3]);
    });

    it('preserves order of results', async () => {
      const item1 = makeItem(1);
      const item2 = makeItem(2);
      const item3 = makeItem(3);

      hnClient.item.mockImplementation((id: number) => {
        const items: Record<number, HNItem> = { 1: item1, 2: item2, 3: item3 };
        return of(items[id] ?? null);
      });

      const promise = service.getItems([3, 1, 2]);
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();
      const result = await promise;

      // Order should match input IDs
      expect(result.map((item) => item?.id)).toEqual([3, 1, 2]);
    });
  });

  describe('Observable wrappers', () => {
    it('getItem$ returns an Observable that resolves to the item', async () => {
      const item = makeItem(42);
      cacheStore.set('story:42', item);

      let result: HNItem | null = null;
      service.getItem$(42).subscribe((i) => (result = i));

      await vi.runAllTimersAsync();

      expect(result).toEqual(item);
    });

    it('getItems$ returns an Observable that resolves to the items', async () => {
      const item1 = makeItem(1);
      const item2 = makeItem(2);
      cacheStore.set('story:1', item1);
      cacheStore.set('story:2', item2);

      let result: (HNItem | null)[] = [];
      service.getItems$([1, 2]).subscribe((items) => (result = items));

      await vi.runAllTimersAsync();

      expect(result).toEqual([item1, item2]);
    });
  });

  describe('cleanup', () => {
    it('clears pending timeout on destroy', () => {
      // Start a request to create a pending timeout
      service.getItem(1);

      // Destroy the service
      service.ngOnDestroy();

      // Verify the timeout was cleared by advancing time and confirming no API calls
      vi.advanceTimersByTime(100);

      // The item call should not have been made since the timeout was cleared
      // Note: This test verifies cleanup behavior; the request was never fulfilled
      expect(hnClient.item).not.toHaveBeenCalled();
    });
  });
});
