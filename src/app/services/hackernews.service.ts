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
    // For refresh: Skip cache for story lists (rankings change frequently)
    if (forceRefresh) {
      return this.hn
        .topStories()
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'top', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'top')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.hn
          .topStories()
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'top', data)));
      }),
    );
  }

  getBestStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .bestStories()
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'best', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'best')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.hn
          .bestStories()
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'best', data)));
      }),
    );
  }

  getNewStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .newStories()
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'new', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'new')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.hn
          .newStories()
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'new', data)));
      }),
    );
  }

  getAskStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .askStories()
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'ask', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'ask')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.hn
          .askStories()
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'ask', data)));
      }),
    );
  }

  getShowStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .showStories()
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'show', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'show')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.hn
          .showStories()
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'show', data)));
      }),
    );
  }

  getJobStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.hn
        .jobStories()
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'job', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'job')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.hn
          .jobStories()
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'job', data)));
      }),
    );
  }

  getItem(id: number, forceRefresh = false): Observable<HNItem | null> {
    // For refresh: Skip cache to get fresh vote counts
    if (forceRefresh) {
      return this.hn.item(id).pipe(
        switchMap(async (mapped) => {
          if (mapped) {
            await this.cache.set('stories', id.toString(), mapped);
          }
          return mapped;
        }),
        catchError(() => of(null)),
      );
    }

    return from(this.cache.get<HNItem>('stories', id.toString())).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.hn.item(id).pipe(
          switchMap(async (mapped) => {
            if (mapped) {
              await this.cache.set('stories', id.toString(), mapped);
            }
            return mapped;
          }),
          catchError(() => of(null)),
        );
      }),
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
    return from(this.cache.get<HNUser>('users', id)).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }
        return this.hn.user(id).pipe(
          tap(async (data) => {
            if (data) {
              await this.cache.set('users', id, data);
            }
          }),
          catchError(() => of(null)),
        );
      }),
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
