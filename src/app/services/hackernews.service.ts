// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, from } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
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
    if (forceRefresh) {
      return this.hn
        .topStories()
        .pipe(tap(async (data) => await this.cache.set('storyList', 'top', data)));
    }
    return from(
      this.cache.getWithSWR<number[]>(
        'storyList',
        'top',
        async () => (await this.hn.topStories().toPromise()) ?? [],
      ),
    ).pipe(
      // Ensure always returns an array
      switchMap((result) => of(result ?? [])),
    );
  }

  getBestStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .bestStories()
        .pipe(tap(async (data) => await this.cache.set('storyList', 'best', data)));
    }
    return from(
      this.cache.getWithSWR<number[]>(
        'storyList',
        'best',
        async () => (await this.hn.bestStories().toPromise()) ?? [],
      ),
    ).pipe(switchMap((result) => of(result ?? [])));
  }

  getNewStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .newStories()
        .pipe(tap(async (data) => await this.cache.set('storyList', 'new', data)));
    }
    return from(
      this.cache.getWithSWR<number[]>(
        'storyList',
        'new',
        async () => (await this.hn.newStories().toPromise()) ?? [],
      ),
    ).pipe(switchMap((result) => of(result ?? [])));
  }

  getAskStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .askStories()
        .pipe(tap(async (data) => await this.cache.set('storyList', 'ask', data)));
    }
    return from(
      this.cache.getWithSWR<number[]>(
        'storyList',
        'ask',
        async () => (await this.hn.askStories().toPromise()) ?? [],
      ),
    ).pipe(switchMap((result) => of(result ?? [])));
  }

  getShowStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .showStories()
        .pipe(tap(async (data) => await this.cache.set('storyList', 'show', data)));
    }
    return from(
      this.cache.getWithSWR<number[]>(
        'storyList',
        'show',
        async () => (await this.hn.showStories().toPromise()) ?? [],
      ),
    ).pipe(switchMap((result) => of(result ?? [])));
  }

  getJobStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .jobStories()
        .pipe(tap(async (data) => await this.cache.set('storyList', 'job', data)));
    }
    return from(
      this.cache.getWithSWR<number[]>(
        'storyList',
        'job',
        async () => (await this.hn.jobStories().toPromise()) ?? [],
      ),
    ).pipe(switchMap((result) => of(result ?? [])));
  }

  getItem(id: number, forceRefresh = false): Observable<HNItem | null> {
    if (forceRefresh) {
      return this.hn.item(id).pipe(
        switchMap(async (mapped) => {
          if (mapped) {
            await this.cache.set('story', id.toString(), mapped);
          }
          return mapped;
        }),
        catchError(() => of(null)),
      );
    }
    return from(
      this.cache.getWithSWR<HNItem | null>(
        'story',
        id.toString(),
        async () => (await this.hn.item(id).toPromise()) ?? null,
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
    return from(
      this.cache.getWithSWR<HNUser | null>(
        'user',
        id,
        async () => (await this.hn.user(id).toPromise()) ?? null,
      ),
    );
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
