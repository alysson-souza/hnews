// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { CacheManagerService } from './cache-manager.service';
import { IndexedDBService } from './indexed-db.service';
import { CacheService } from './cache.service';

class IndexedDBServiceStub {
  get = async () => null;
  set = async () => {
    /* no-op */
  };
  clearAll = async () => {
    /* no-op */
  };
  getStoryList = async () => [] as number[];
  setStoryList = async () => {
    /* no-op */
  };
  getStory = async () => null as unknown;
  setStory = async () => {
    /* no-op */
  };
  getUserProfile = async () => null as unknown;
  setUserProfile = async () => {
    /* no-op */
  };
  delete = async () => {
    /* no-op */
  };
  count = async () => 0;
  getStories = async () => new Map<number, unknown>();
  migrateFromLocalStorage = async () => {
    /* no-op */
  };
}

class CacheServiceStub {
  get = () => null as unknown;
  set = () => {
    /* no-op */
  };
  clear = () => {
    /* no-op */
  };
}

describe('CacheManagerService (SWR)', () => {
  let service: CacheManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CacheManagerService,
        { provide: IndexedDBService, useClass: IndexedDBServiceStub },
        { provide: CacheService, useClass: CacheServiceStub },
      ],
    });
    service = TestBed.inject(CacheManagerService);
  });

  it('returns fresh cached value and triggers background refresh', async () => {
    // Arrange: first call returns cached value
    const key = 'foo';
    await service.set('storyList', key, [1, 2, 3]);

    // Act: call getWithSWR with a fetcher that would resolve to a different array
    const freshPromise = Promise.resolve([4, 5, 6]);
    const fetcher = () => freshPromise;
    const result = await service.getWithSWR<number[]>('storyList', key, fetcher);

    // Assert initial result is cached
    expect(result).toEqual([1, 2, 3]);

    // Wait for background refresh to complete
    await freshPromise;

    // Now the stored value should be the fresh one
    const updated = await service.get<number[]>('storyList', key);
    expect(updated).toEqual([4, 5, 6]);
  });

  it('emits updates for a key when set is called', async () => {
    const key = 'bar';
    const updates$ = service.getUpdates<number[]>('storyList', key);
    const values: number[][] = [];

    const sub = updates$.subscribe((v) => values.push(v));
    await service.set('storyList', key, [1]);
    await service.set('storyList', key, [1, 2]);
    // Allow observable microtasks to flush
    await Promise.resolve();
    expect(values[0]).toEqual([1]);
    expect(values[1]).toEqual([1, 2]);
    sub.unsubscribe();
  });
});
