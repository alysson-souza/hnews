import type { Mock, MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Observable, firstValueFrom, of, Subject, throwError } from 'rxjs';
import { HackernewsService } from './hackernews.service';
import { CacheManagerService } from './cache-manager.service';
import { HnApiClient } from '../data/hn-api.client';
import { AlgoliaApiClient } from '../data/algolia-api.client';
import { HNItem, HNUser } from '../models/hn';
import { AlgoliaSearchResponse } from '../models/algolia';

class MockCacheManagerService {
  get() {
    return Promise.resolve(undefined);
  }
  set() {
    return Promise.resolve();
  }
  async getWithSWR<T>(_type: string, _key: string, fetcher: () => Promise<T>) {
    // Actually call the fetcher to trigger HTTP requests in tests
    return fetcher();
  }
  getUpdates() {
    return of(null);
  }
}

describe('HackernewsService searchStories', () => {
  let service: HackernewsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: CacheManagerService, useClass: MockCacheManagerService },
      ],
    });
    service = TestBed.inject(HackernewsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('builds default query with tags for all', () => {
    service.searchStories({ query: 'foo', tags: 'all' }).subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith('https://hn.algolia.com/api/v1/search'));
    const url = new URL(req.request.urlWithParams);
    expect(url.searchParams.get('query')).toBe('foo');
    expect(url.searchParams.get('advancedSyntax')).toBe('true');
    expect(url.searchParams.get('tags')).toBe('(story,comment)');
    req.flush({ hits: [], nbHits: 0 });
  });

  it('forces url restriction and story tag for site: queries', () => {
    service.searchStories({ query: 'site:theguardian.com' }).subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith('https://hn.algolia.com/api/v1/search'));
    const url = new URL(req.request.urlWithParams);
    expect(url.searchParams.get('query')).toBe('theguardian.com');
    expect(url.searchParams.get('restrictSearchableAttributes')).toBe('url');
    expect(url.searchParams.get('tags')).toBe('story');
    req.flush({ hits: [], nbHits: 0 });
  });

  it('uses search_by_date for date sort', () => {
    service.searchStories({ query: 'foo', sortBy: 'date' }).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url.startsWith('https://hn.algolia.com/api/v1/search_by_date'),
    );
    expect(req.request.url).toContain('search_by_date');
    req.flush({ hits: [], nbHits: 0 });
  });
});

describe('HackernewsService data orchestration', () => {
  let service: HackernewsService;
  let cache: CacheManagerService;
  let cacheSetSpy: Mock;
  let cacheGetWithSWRSpy: Mock;
  let cacheGetUpdatesSpy: Mock;
  let hnClient: MockedObject<HnApiClient>;
  let algoliaClient: MockedObject<AlgoliaApiClient>;
  let cacheStore: Map<string, unknown>;
  let cacheUpdateStreams: Map<string, Subject<unknown>>;

  const makeItem = (id: number, overrides: Partial<HNItem> = {}): HNItem => ({
    id,
    type: 'story',
    time: 1,
    ...overrides,
  });

  const makeComment = (id: number, overrides: Partial<HNItem> = {}): HNItem =>
    makeItem(id, { type: 'comment', ...overrides });

  const emitCacheUpdate = (type: string, key: string, value: unknown): void => {
    const subject = cacheUpdateStreams.get(`${type}:${key}`);
    if (!subject) {
      throw new Error(`No update stream for ${type}:${key}`);
    }
    subject.next(value);
  };

  beforeEach(() => {
    cacheStore = new Map();
    cacheUpdateStreams = new Map();

    cacheSetSpy = vi.fn().mockImplementation(async (type: string, key: string, value: unknown) => {
      cacheStore.set(`${type}:${key}`, value ?? null);
    });
    cacheGetWithSWRSpy = vi
      .fn()
      .mockImplementation(async <T>(type: string, key: string, fetcher: () => Promise<T>) => {
        const storeKey = `${type}:${key}`;
        if (cacheStore.has(storeKey)) {
          return cacheStore.get(storeKey) as T | null;
        }
        const fresh = await fetcher();
        cacheStore.set(storeKey, fresh ?? null);
        return (fresh ?? null) as T | null;
      });
    cacheGetUpdatesSpy = vi.fn().mockImplementation(<T>(type: string, key: string) => {
      const storeKey = `${type}:${key}`;
      if (!cacheUpdateStreams.has(storeKey)) {
        cacheUpdateStreams.set(storeKey, new Subject<unknown>());
      }
      return cacheUpdateStreams.get(storeKey)!.asObservable() as Observable<T>;
    });

    cache = {
      set: cacheSetSpy,
      getWithSWR: cacheGetWithSWRSpy,
      getUpdates: cacheGetUpdatesSpy,
    } as unknown as CacheManagerService;

    hnClient = {
      topStories: vi.fn().mockReturnValue(of([])),
      bestStories: vi.fn().mockReturnValue(of([])),
      newStories: vi.fn().mockReturnValue(of([])),
      askStories: vi.fn().mockReturnValue(of([])),
      showStories: vi.fn().mockReturnValue(of([])),
      jobStories: vi.fn().mockReturnValue(of([])),
      item: vi.fn().mockReturnValue(of(null)),
      user: vi.fn().mockReturnValue(of({ id: 'user', created: 0, karma: 0 } as HNUser)),
      maxItem: vi.fn().mockReturnValue(of(0)),
      updates: vi.fn().mockReturnValue(of({ items: [], profiles: [] })),
    } as unknown as MockedObject<HnApiClient>;

    algoliaClient = {
      search: vi.fn().mockReturnValue(of({ hits: [] } as AlgoliaSearchResponse)),
    } as unknown as MockedObject<AlgoliaApiClient>;

    TestBed.configureTestingModule({
      providers: [
        { provide: CacheManagerService, useValue: cache },
        { provide: HnApiClient, useValue: hnClient },
        { provide: AlgoliaApiClient, useValue: algoliaClient },
      ],
    });

    service = TestBed.inject(HackernewsService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('emits cached top stories first and then pushes cache updates', async () => {
    cacheStore.set('storyList:top', [1, 2]);

    const values: number[][] = [];
    const subscription = service.getTopStories().subscribe((ids) => values.push(ids));

    // Allow microtasks to flush
    await Promise.resolve();
    expect(values).toEqual([[1, 2]]);

    emitCacheUpdate('storyList', 'top', [3, 4]);
    // Wait a tick for the update to propagate
    await Promise.resolve();
    expect(values).toEqual([
      [1, 2],
      [3, 4],
    ]);

    subscription.unsubscribe();
  });

  it('forces refresh for top stories and caches the result', async () => {
    const payload = [1, 2];
    hnClient.topStories.mockReturnValue(of(payload));
    cacheSetSpy.mockClear();
    cacheGetWithSWRSpy.mockClear();
    const result = await firstValueFrom(service.getTopStories(true));
    expect(hnClient.topStories).toHaveBeenCalled();
    expect(result).toEqual(payload);
    expect(cache.set).toHaveBeenCalledWith('storyList', 'top', payload);
    expect(cache.getWithSWR).not.toHaveBeenCalled();
  });

  it('forces refresh for best stories and caches the result', async () => {
    const payload = [2, 3];
    hnClient.bestStories.mockReturnValue(of(payload));
    cacheSetSpy.mockClear();
    cacheGetWithSWRSpy.mockClear();
    const result = await firstValueFrom(service.getBestStories(true));
    expect(hnClient.bestStories).toHaveBeenCalled();
    expect(result).toEqual(payload);
    expect(cache.set).toHaveBeenCalledWith('storyList', 'best', payload);
    expect(cache.getWithSWR).not.toHaveBeenCalled();
  });

  it('forces refresh for new stories and caches the result', async () => {
    const payload = [3, 4];
    hnClient.newStories.mockReturnValue(of(payload));
    cacheSetSpy.mockClear();
    cacheGetWithSWRSpy.mockClear();
    const result = await firstValueFrom(service.getNewStories(true));
    expect(hnClient.newStories).toHaveBeenCalled();
    expect(result).toEqual(payload);
    expect(cache.set).toHaveBeenCalledWith('storyList', 'new', payload);
    expect(cache.getWithSWR).not.toHaveBeenCalled();
  });

  it('forces refresh for ask stories and caches the result', async () => {
    const payload = [4, 5];
    hnClient.askStories.mockReturnValue(of(payload));
    cacheSetSpy.mockClear();
    cacheGetWithSWRSpy.mockClear();
    const result = await firstValueFrom(service.getAskStories(true));
    expect(hnClient.askStories).toHaveBeenCalled();
    expect(result).toEqual(payload);
    expect(cache.set).toHaveBeenCalledWith('storyList', 'ask', payload);
    expect(cache.getWithSWR).not.toHaveBeenCalled();
  });

  it('forces refresh for show stories and caches the result', async () => {
    const payload = [5, 6];
    hnClient.showStories.mockReturnValue(of(payload));
    cacheSetSpy.mockClear();
    cacheGetWithSWRSpy.mockClear();
    const result = await firstValueFrom(service.getShowStories(true));
    expect(hnClient.showStories).toHaveBeenCalled();
    expect(result).toEqual(payload);
    expect(cache.set).toHaveBeenCalledWith('storyList', 'show', payload);
    expect(cache.getWithSWR).not.toHaveBeenCalled();
  });

  it('forces refresh for job stories and caches the result', async () => {
    const payload = [6, 7];
    hnClient.jobStories.mockReturnValue(of(payload));
    cacheSetSpy.mockClear();
    cacheGetWithSWRSpy.mockClear();
    const result = await firstValueFrom(service.getJobStories(true));
    expect(hnClient.jobStories).toHaveBeenCalled();
    expect(result).toEqual(payload);
    expect(cache.set).toHaveBeenCalledWith('storyList', 'job', payload);
    expect(cache.getWithSWR).not.toHaveBeenCalled();
  });

  it('returns cached item without hitting the API', async () => {
    const cachedItem = makeItem(42);
    cacheStore.set('story:42', cachedItem);

    let value: HNItem | null | undefined;
    service.getItem(42).subscribe((item) => (value = item));
    // Let subscription deliver cached value
    await Promise.resolve();
    expect(value).toEqual(cachedItem);
    expect(hnClient.item).not.toHaveBeenCalled();
  });

  it('fetches and caches an item on force refresh', async () => {
    const freshItem = makeComment(7);
    hnClient.item.mockReturnValue(of(freshItem));

    const result = await firstValueFrom(service.getItem(7, true));

    expect(hnClient.item).toHaveBeenCalledWith(7);
    expect(result).toEqual(freshItem);
    expect(cache.set).toHaveBeenCalledWith('story', '7', freshItem);
  });

  it('maps API failures to null items', async () => {
    hnClient.item.mockReturnValue(throwError(() => new Error('fail')));

    const result = await firstValueFrom(service.getItem(99, true));

    expect(result).toBeNull();
  });

  it('returns an empty array when getItems receives no ids', async () => {
    const result = await firstValueFrom(service.getItems([]));

    expect(result).toEqual([]);
  });

  it('collects individual items with getItems', async () => {
    const itemA = makeItem(1);
    const itemB = makeItem(2);
    cacheStore.set('story:1', itemA);
    cacheStore.set('story:2', itemB);

    const result = await firstValueFrom(service.getItems([1, 2]));

    expect(result).toEqual([itemA, itemB]);
  });

  it('returns only existing comments for story top-level children', async () => {
    const story = makeItem(10, { kids: [11, 12] });
    const comment = makeComment(11);
    cacheStore.set('story:10', story);
    cacheStore.set('story:11', comment);
    cacheStore.set('story:12', null);

    const result = await firstValueFrom(service.getStoryTopLevelComments(10));

    expect(result).toEqual([comment]);
  });

  it('returns an empty list when a story has no kids', async () => {
    const story = makeItem(20, { kids: [] });
    cacheStore.set('story:20', story);

    const result = await firstValueFrom(service.getStoryTopLevelComments(20));

    expect(result).toEqual([]);
  });

  it('resolves all existing comment children by default', async () => {
    const parent = makeComment(30, { kids: [31, 32, 33] });
    const childA = makeComment(31);
    const childC = makeComment(33);
    cacheStore.set('story:30', parent);
    cacheStore.set('story:31', childA);
    cacheStore.set('story:32', null);
    cacheStore.set('story:33', childC);

    const result = await firstValueFrom(service.getCommentChildren(30));

    expect(result).toEqual([childA, childC]);
  });

  it('paginates comment children when requested', async () => {
    const parent = makeComment(40, { kids: [41, 42, 43, 44] });
    cacheStore.set('story:40', parent);
    cacheStore.set('story:41', makeComment(41));
    cacheStore.set('story:42', makeComment(42));
    cacheStore.set('story:43', makeComment(43));
    cacheStore.set('story:44', makeComment(44));

    const page = await firstValueFrom(service.getCommentChildren(40, 1, 2));

    expect(page.map((item) => item.id)).toEqual([43, 44]);
  });

  it('returns an empty list when comment has no children', async () => {
    const parent = makeComment(50, { kids: [] });
    cacheStore.set('story:50', parent);

    const result = await firstValueFrom(service.getCommentChildren(50));

    expect(result).toEqual([]);
  });

  it('pages items and skips out-of-range pages', async () => {
    cacheStore.set('story:60', makeItem(60));
    cacheStore.set('story:61', makeItem(61));
    cacheStore.set('story:62', makeItem(62));

    const firstPage = await firstValueFrom(service.getItemsPage([60, 61, 62], 0, 2));
    const secondPage = await firstValueFrom(service.getItemsPage([60, 61, 62], 1, 2));
    const farPage = await firstValueFrom(service.getItemsPage([60, 61, 62], 5, 2));
    const emptyIds = await firstValueFrom(service.getItemsPage([], 0, 2));

    expect(firstPage.map((item) => item?.id)).toEqual([60, 61]);
    expect(secondPage.map((item) => item?.id)).toEqual([62]);
    expect(farPage).toEqual([]);
    expect(emptyIds).toEqual([]);
  });

  it('reads cached users without network calls', async () => {
    const user: HNUser = { id: 'alice', created: 1, karma: 100 };
    cacheStore.set('user:alice', user);

    const result = await firstValueFrom(service.getUser('alice'));

    expect(result).toEqual(user);
    expect(hnClient.user).not.toHaveBeenCalled();
  });

  it('fetches and caches users when missing', async () => {
    const user: HNUser = { id: 'bob', created: 2, karma: 200 };
    hnClient.user.mockReturnValue(of(user));

    const result = await firstValueFrom(service.getUser('bob'));

    expect(hnClient.user).toHaveBeenCalledWith('bob');
    expect(result).toEqual(user);
    expect(cacheStore.get('user:bob')).toEqual(user);
  });

  it('exposes max item from the API client', async () => {
    hnClient.maxItem.mockReturnValue(of(9001));

    const result = await firstValueFrom(service.getMaxItem());

    expect(result).toBe(9001);
  });

  it('exposes updates from the API client', async () => {
    const payload = { items: [1, 2], profiles: ['foo'] };
    hnClient.updates.mockReturnValue(of(payload));

    const result = await firstValueFrom(service.getUpdates());

    expect(result).toEqual(payload);
  });

  it('delegates searchByDate to Algolia with the expected options', async () => {
    const response: AlgoliaSearchResponse = { hits: [] };
    algoliaClient.search.mockReturnValue(of(response));

    const result = await firstValueFrom(service.searchByDate('angular'));

    expect(algoliaClient.search).toHaveBeenCalledWith({
      query: 'angular',
      tags: 'story',
      sortBy: 'date',
    });
    expect(result).toEqual(response);
  });

  it('caches search results with getWithSWR', async () => {
    const response: AlgoliaSearchResponse = {
      hits: [{ objectID: '1', title: 'Test' }],
      nbHits: 1,
      page: 0,
      nbPages: 1,
      hitsPerPage: 20,
    };
    algoliaClient.search.mockReturnValue(of(response));

    const result = await firstValueFrom(service.searchStories({ query: 'react' }));

    expect(cacheGetWithSWRSpy).toHaveBeenCalledWith(
      'search',
      expect.stringContaining('q:react'),
      expect.any(Function),
    );
    expect(result).toEqual(response);
  });

  it('creates unique cache keys for different search options', async () => {
    const response: AlgoliaSearchResponse = {
      hits: [],
      nbHits: 0,
      page: 0,
      nbPages: 0,
      hitsPerPage: 20,
    };
    algoliaClient.search.mockReturnValue(of(response));

    await firstValueFrom(service.searchStories({ query: 'react', tags: 'story' }));
    await firstValueFrom(service.searchStories({ query: 'vue', tags: 'story' }));
    await firstValueFrom(service.searchStories({ query: 'react', tags: 'comment' }));

    const calls = cacheGetWithSWRSpy.mock.calls;
    const keys = calls.filter((c: unknown[]) => c[0] === 'search').map((c: unknown[]) => c[1]);

    // All cache keys should be different
    expect(new Set(keys).size).toBe(3);
  });

  it('forces refresh for search and bypasses cache', async () => {
    const response: AlgoliaSearchResponse = {
      hits: [{ objectID: '1', title: 'Fresh' }],
      nbHits: 1,
      page: 0,
      nbPages: 1,
      hitsPerPage: 20,
    };
    algoliaClient.search.mockReturnValue(of(response));
    cacheSetSpy.mockClear();
    cacheGetWithSWRSpy.mockClear();

    const result = await firstValueFrom(service.searchStories({ query: 'angular' }, true));

    expect(algoliaClient.search).toHaveBeenCalled();
    expect(cacheSetSpy).toHaveBeenCalledWith(
      'search',
      expect.stringContaining('q:angular'),
      response,
    );
    expect(cacheGetWithSWRSpy).not.toHaveBeenCalled();
    expect(result).toEqual(response);
  });

  it('handles search errors gracefully with forceRefresh', async () => {
    algoliaClient.search.mockReturnValue(throwError(() => new Error('Network error')));

    const result = await firstValueFrom(service.searchStories({ query: 'fail' }, true));

    expect(result).toEqual({ hits: [], nbHits: 0, page: 0, nbPages: 0, hitsPerPage: 0 });
  });

  it('returns cached observable on repeated getItem calls', async () => {
    const item = makeItem(100);
    cacheStore.set('story:100', item);

    const firstCall = service.getItem(100);
    const secondCall = service.getItem(100);

    // Both calls should return the same observable instance
    expect(firstCall).toBe(secondCall);

    const result1 = await firstValueFrom(firstCall);
    const result2 = await firstValueFrom(secondCall);

    expect(result1).toEqual(item);
    expect(result2).toEqual(item);
  });

  it('propagates cache updates to getItem subscribers', async () => {
    const initialItem = makeItem(200, { title: 'Initial Title' });
    const updatedItem = makeItem(200, { title: 'Updated Title' });
    cacheStore.set('story:200', initialItem);

    const values: (HNItem | null)[] = [];
    const subscription = service.getItem(200).subscribe((item) => values.push(item));

    await Promise.resolve();
    expect(values).toHaveLength(1);
    expect(values[0]?.title).toBe('Initial Title');

    // Simulate cache update
    emitCacheUpdate('story', '200', updatedItem);
    await Promise.resolve();

    expect(values).toHaveLength(2);
    expect(values[1]?.title).toBe('Updated Title');

    subscription.unsubscribe();
  });

  it('getItemUpdates returns only cache updates without initial fetch', async () => {
    const cachedItem = makeItem(300, { title: 'Cached' });
    cacheStore.set('story:300', cachedItem);

    const values: (HNItem | null)[] = [];
    const subscription = service.getItemUpdates(300).subscribe((item) => values.push(item));

    // Should not emit initial value
    await Promise.resolve();
    expect(values).toHaveLength(0);

    // Should emit when cache updates
    const updatedItem = makeItem(300, { title: 'Updated' });
    emitCacheUpdate('story', '300', updatedItem);
    await Promise.resolve();

    expect(values).toHaveLength(1);
    expect(values[0]?.title).toBe('Updated');

    subscription.unsubscribe();
  });

  it('deletes itemStreams Map entries when refCount drops to zero', async () => {
    const item = makeItem(400);
    cacheStore.set('story:400', item);

    const sub1 = service.getItem(400).subscribe();
    await Promise.resolve();

    // Access private property for testing
    const getItemStreams = () =>
      (service as unknown as Record<string, Map<number, Observable<unknown>>>)['itemStreams'];

    // Map should have the entry
    expect(getItemStreams().has(400)).toBe(true);

    const observable1 = getItemStreams().get(400);
    const sub2 = service.getItem(400).subscribe();

    // Should return the same observable instance
    const observable2 = getItemStreams().get(400);
    expect(observable1).toBe(observable2);

    sub1.unsubscribe();
    // Map entry should still exist (refCount = 1)
    expect(getItemStreams().has(400)).toBe(true);

    sub2.unsubscribe();
    // finalize runs synchronously when shareReplay's refCount drops to zero
    // Map entry should be deleted, preventing unbounded growth
    expect(getItemStreams().has(400)).toBe(false);
  });
});
