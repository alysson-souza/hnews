// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, from, merge, firstValueFrom } from 'rxjs';
import { catchError, tap, switchMap, shareReplay, map } from 'rxjs/operators';
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

  getTopStories(forceRefresh = false): Observable<number[]> {
    const key = 'top';
    const initial$ = forceRefresh
      ? this.hn.topStories().pipe(tap(async (data) => await this.cache.set('storyList', key, data)))
      : from(
          this.cache.getWithSWR<number[]>(
            'storyList',
            key,
            async () => (await firstValueFrom(this.hn.topStories())) ?? [],
          ),
        ).pipe(map((res) => res ?? []));
    const updates$ = this.cache.getUpdates<number[]>('storyList', key);
    return merge(initial$, updates$).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  getBestStories(forceRefresh = false): Observable<number[]> {
    const key = 'best';
    const initial$ = forceRefresh
      ? this.hn
          .bestStories()
          .pipe(tap(async (data) => await this.cache.set('storyList', key, data)))
      : from(
          this.cache.getWithSWR<number[]>(
            'storyList',
            key,
            async () => (await firstValueFrom(this.hn.bestStories())) ?? [],
          ),
        ).pipe(map((res) => res ?? []));
    const updates$ = this.cache.getUpdates<number[]>('storyList', key);
    return merge(initial$, updates$).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  getNewStories(forceRefresh = false): Observable<number[]> {
    const key = 'new';
    const initial$ = forceRefresh
      ? this.hn.newStories().pipe(tap(async (data) => await this.cache.set('storyList', key, data)))
      : from(
          this.cache.getWithSWR<number[]>(
            'storyList',
            key,
            async () => (await firstValueFrom(this.hn.newStories())) ?? [],
          ),
        ).pipe(map((res) => res ?? []));
    const updates$ = this.cache.getUpdates<number[]>('storyList', key);
    return merge(initial$, updates$).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  getAskStories(forceRefresh = false): Observable<number[]> {
    const key = 'ask';
    const initial$ = forceRefresh
      ? this.hn.askStories().pipe(tap(async (data) => await this.cache.set('storyList', key, data)))
      : from(
          this.cache.getWithSWR<number[]>(
            'storyList',
            key,
            async () => (await firstValueFrom(this.hn.askStories())) ?? [],
          ),
        ).pipe(map((res) => res ?? []));
    const updates$ = this.cache.getUpdates<number[]>('storyList', key);
    return merge(initial$, updates$).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  getShowStories(forceRefresh = false): Observable<number[]> {
    const key = 'show';
    const initial$ = forceRefresh
      ? this.hn
          .showStories()
          .pipe(tap(async (data) => await this.cache.set('storyList', key, data)))
      : from(
          this.cache.getWithSWR<number[]>(
            'storyList',
            key,
            async () => (await firstValueFrom(this.hn.showStories())) ?? [],
          ),
        ).pipe(map((res) => res ?? []));
    const updates$ = this.cache.getUpdates<number[]>('storyList', key);
    return merge(initial$, updates$).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  getJobStories(forceRefresh = false): Observable<number[]> {
    const key = 'job';
    const initial$ = forceRefresh
      ? this.hn.jobStories().pipe(tap(async (data) => await this.cache.set('storyList', key, data)))
      : from(
          this.cache.getWithSWR<number[]>(
            'storyList',
            key,
            async () => (await firstValueFrom(this.hn.jobStories())) ?? [],
          ),
        ).pipe(map((res) => res ?? []));
    const updates$ = this.cache.getUpdates<number[]>('storyList', key);
    return merge(initial$, updates$).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  getItem(id: number, forceRefresh = false): Observable<HNItem | null> {
    const key = id.toString();
    const initial$ = forceRefresh
      ? this.hn.item(id).pipe(
          switchMap(async (mapped) => {
            if (mapped) {
              await this.cache.set('story', key, mapped);
            }
            return mapped;
          }),
          catchError(() => of(null)),
        )
      : from(
          this.cache.getWithSWR<HNItem | null>(
            'story',
            key,
            async () => (await firstValueFrom(this.hn.item(id))) ?? null,
          ),
        );
    return initial$;
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
        return this.getItems(kids, forceRefresh).pipe(
          switchMap((items) => of(items.filter((i): i is HNItem => !!i))),
        );
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
        return this.getItems(ids).pipe(
          switchMap((items) => of(items.filter((i): i is HNItem => !!i))),
        );
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
