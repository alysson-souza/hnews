// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, from, merge, firstValueFrom } from 'rxjs';
import { catchError, switchMap, shareReplay, map } from 'rxjs/operators';
import { CacheManagerService } from './cache-manager.service';
import { HNItem, HNUser } from '../models/hn';
import { AlgoliaSearchResponse } from '../models/algolia';
import { HnApiClient } from '../data/hn-api.client';
import { AlgoliaApiClient } from '../data/algolia-api.client';
import { SearchOptions } from '../models/search';

@Injectable({
  providedIn: 'root',
})
export class HackernewsService {
  private cache = inject(CacheManagerService);
  private hn = inject(HnApiClient);
  private algolia = inject(AlgoliaApiClient);

  private readonly storyListScope = 'storyList';
  private readonly storyScope = 'story';
  private readonly shareLatestConfig = { bufferSize: 1, refCount: true } as const;

  private getStoryIds(
    key: string,
    fetch: () => Observable<number[]>,
    forceRefresh: boolean,
  ): Observable<number[]> {
    const initial$ = forceRefresh
      ? fetch().pipe(
          switchMap((ids) =>
            from(this.cache.set(this.storyListScope, key, ids)).pipe(map(() => ids)),
          ),
        )
      : from(
          this.cache.getWithSWR<number[]>(
            this.storyListScope,
            key,
            async () => (await firstValueFrom(fetch())) ?? [],
          ),
        ).pipe(map((res) => res ?? []));

    const updates$ = this.cache.getUpdates<number[]>(this.storyListScope, key);
    return merge(initial$, updates$).pipe(shareReplay(this.shareLatestConfig));
  }

  private filterExisting<T>(items: (T | null | undefined)[]): T[] {
    return items.filter((item): item is T => item != null);
  }

  getTopStories(forceRefresh = false): Observable<number[]> {
    return this.getStoryIds('top', () => this.hn.topStories(), forceRefresh);
  }

  getBestStories(forceRefresh = false): Observable<number[]> {
    return this.getStoryIds('best', () => this.hn.bestStories(), forceRefresh);
  }

  getNewStories(forceRefresh = false): Observable<number[]> {
    return this.getStoryIds('new', () => this.hn.newStories(), forceRefresh);
  }

  getAskStories(forceRefresh = false): Observable<number[]> {
    return this.getStoryIds('ask', () => this.hn.askStories(), forceRefresh);
  }

  getShowStories(forceRefresh = false): Observable<number[]> {
    return this.getStoryIds('show', () => this.hn.showStories(), forceRefresh);
  }

  getJobStories(forceRefresh = false): Observable<number[]> {
    return this.getStoryIds('job', () => this.hn.jobStories(), forceRefresh);
  }

  getItem(id: number, forceRefresh = false): Observable<HNItem | null> {
    const key = id.toString();
    if (forceRefresh) {
      return this.hn.item(id).pipe(
        switchMap((item) =>
          item ? from(this.cache.set(this.storyScope, key, item)).pipe(map(() => item)) : of(item),
        ),
        catchError(() => of(null)),
      );
    }

    return from(
      this.cache.getWithSWR<HNItem | null>(
        this.storyScope,
        key,
        async () => (await firstValueFrom(this.hn.item(id))) ?? null,
      ),
    );
  }

  getItems(ids: number[], forceRefresh = false): Observable<(HNItem | null)[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    const requests = ids.map((id) => this.getItem(id, forceRefresh));
    return forkJoin(requests);
  }

  /**
   * Convenience: fetch a story and resolve its top-level comments (kids) as full items.
   * Returns only existing, non-null items (deleted are filtered by consumers if needed).
   */
  getStoryTopLevelComments(storyId: number, forceRefresh = false): Observable<HNItem[]> {
    return this.getItem(storyId, forceRefresh).pipe(
      switchMap((story) => {
        const kids = story?.kids || [];
        if (!kids.length) return of([]);
        return this.getItems(kids, forceRefresh).pipe(map((items) => this.filterExisting(items)));
      }),
    );
  }

  /**
   * Convenience: fetch a comment's direct children by comment id.
   * Useful for on-demand expansion of a node.
   */
  getCommentChildren(commentId: number, page?: number, pageSize?: number): Observable<HNItem[]> {
    return this.getItem(commentId).pipe(
      switchMap((item) => {
        const kids = item?.kids || [];
        if (!kids.length) return of([]);
        const ids =
          page !== undefined && pageSize !== undefined
            ? kids.slice(page * pageSize, page * pageSize + pageSize)
            : kids;
        return this.getItems(ids).pipe(map((items) => this.filterExisting(items)));
      }),
    );
  }

  getItemsPage(ids: number[], page = 0, pageSize = 10): Observable<(HNItem | null)[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    const start = page * pageSize;
    const end = start + pageSize;
    const pageIds = ids.slice(start, end);

    if (pageIds.length === 0) {
      return of([]);
    }

    const requests = pageIds.map((id) => this.getItem(id));
    return forkJoin(requests);
  }

  getUser(id: string): Observable<HNUser | null> {
    const key = id;
    const initial$ = from(
      this.cache.getWithSWR<HNUser | null>(
        'user',
        key,
        async () => (await firstValueFrom(this.hn.user(id))) ?? null,
      ),
    );
    return initial$;
  }

  getMaxItem(): Observable<number> {
    return this.hn.maxItem();
  }

  getUpdates(): Observable<{ items: number[]; profiles: string[] }> {
    return this.hn.updates();
  }

  searchStories(options: SearchOptions): Observable<AlgoliaSearchResponse> {
    return this.algolia.search(options);
  }

  searchByDate(query: string): Observable<AlgoliaSearchResponse> {
    return this.searchStories({
      query,
      tags: 'story',
      sortBy: 'date',
    });
  }
}
