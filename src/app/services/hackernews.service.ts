// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, from } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { CacheManagerService } from './cache-manager.service';
import { HNItem, HNUser, mapToHNItem } from '../models/hn';
import { AlgoliaSearchResponse } from '../models/algolia';

export interface SearchOptions {
  query: string;
  tags?: string;
  sortBy?: 'relevance' | 'date' | 'points' | 'comments';
  dateRange?: 'all' | '24h' | 'week' | 'month' | 'year';
  page?: number;
}

@Injectable({
  providedIn: 'root',
})
export class HackernewsService {
  private readonly API_BASE = 'https://hacker-news.firebaseio.com/v0';
  private http = inject(HttpClient);
  private cache = inject(CacheManagerService);

  getTopStories(forceRefresh = false): Observable<number[]> {
    // For refresh: Skip cache for story lists (rankings change frequently)
    if (forceRefresh) {
      return this.http
        .get<number[]>(`${this.API_BASE}/topstories.json`)
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'top', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'top')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.http
          .get<number[]>(`${this.API_BASE}/topstories.json`)
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'top', data)));
      }),
    );
  }

  getBestStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.http
        .get<number[]>(`${this.API_BASE}/beststories.json`)
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'best', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'best')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.http
          .get<number[]>(`${this.API_BASE}/beststories.json`)
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'best', data)));
      }),
    );
  }

  getNewStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.http
        .get<number[]>(`${this.API_BASE}/newstories.json`)
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'new', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'new')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.http
          .get<number[]>(`${this.API_BASE}/newstories.json`)
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'new', data)));
      }),
    );
  }

  getAskStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.http
        .get<number[]>(`${this.API_BASE}/askstories.json`)
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'ask', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'ask')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.http
          .get<number[]>(`${this.API_BASE}/askstories.json`)
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'ask', data)));
      }),
    );
  }

  getShowStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.http
        .get<number[]>(`${this.API_BASE}/showstories.json`)
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'show', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'show')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.http
          .get<number[]>(`${this.API_BASE}/showstories.json`)
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'show', data)));
      }),
    );
  }

  getJobStories(forceRefresh = false): Observable<number[]> {
    if (forceRefresh) {
      return this.http
        .get<number[]>(`${this.API_BASE}/jobstories.json`)
        .pipe(tap(async (data) => await this.cache.set('storyLists', 'job', data)));
    }

    return from(this.cache.get<number[]>('storyLists', 'job')).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.http
          .get<number[]>(`${this.API_BASE}/jobstories.json`)
          .pipe(tap(async (data) => await this.cache.set('storyLists', 'job', data)));
      }),
    );
  }

  getItem(id: number, forceRefresh = false): Observable<HNItem | null> {
    // For refresh: Skip cache to get fresh vote counts
    if (forceRefresh) {
      return this.http.get<unknown>(`${this.API_BASE}/item/${id}.json`).pipe(
        switchMap(async (raw) => {
          const mapped = mapToHNItem(raw);
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

        return this.http.get<unknown>(`${this.API_BASE}/item/${id}.json`).pipe(
          switchMap(async (raw) => {
            const mapped = mapToHNItem(raw);
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

        return this.http.get<HNUser>(`${this.API_BASE}/user/${id}.json`).pipe(
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
    return this.http.get<number>(`${this.API_BASE}/maxitem.json`);
  }

  getUpdates(): Observable<{ items: number[]; profiles: string[] }> {
    return this.http.get<{ items: number[]; profiles: string[] }>(`${this.API_BASE}/updates.json`);
  }

  searchStories(options: SearchOptions): Observable<AlgoliaSearchResponse> {
    let baseUrl = 'https://hn.algolia.com/api/v1/search';
    if (options.sortBy === 'date') {
      baseUrl = 'https://hn.algolia.com/api/v1/search_by_date';
    }

    const params = new URLSearchParams();
    // Enable Algolia advanced syntax to support operators like quotes/parentheses
    params.append('advancedSyntax', 'true');

    // Normalize and enhance query handling for special operators
    const rawQuery = (options.query || '').trim();
    const siteMatch = rawQuery.match(/^site:(\S+)/i);
    const urlMatch = rawQuery.match(/^url:(\S+)/i);

    if (siteMatch) {
      // For site:domain searches, restrict to URL attribute and force story tag
      const domain = siteMatch[1]
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/.*$/, '');
      params.append('query', domain);
      params.append('restrictSearchableAttributes', 'url');
      // site: only makes sense for stories with URLs
      params.append('tags', 'story');
    } else if (urlMatch) {
      // For url: searches, behave similarly by restricting to URL
      const term = urlMatch[1];
      params.append('query', term);
      params.append('restrictSearchableAttributes', 'url');
      params.append('tags', 'story');
    } else {
      params.append('query', rawQuery);
    }

    // Add tags filter
    // Add tags filter (unless already set by site:/url: handling above)
    if (!params.has('tags')) {
      if (options.tags && options.tags !== 'all') {
        params.append('tags', options.tags);
      } else {
        // Default to stories and comments if no specific tag
        params.append('tags', '(story,comment)');
      }
    }

    // Add date range filter
    if (options.dateRange && options.dateRange !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      let timestamp = now;

      switch (options.dateRange) {
        case '24h':
          timestamp = now - 86400;
          break;
        case 'week':
          timestamp = now - 604800;
          break;
        case 'month':
          timestamp = now - 2592000;
          break;
        case 'year':
          timestamp = now - 31536000;
          break;
      }

      params.append('numericFilters', `created_at_i>${timestamp}`);
    }

    // Add pagination
    if (options.page !== undefined) {
      params.append('page', options.page.toString());
    }

    const searchUrl = `${baseUrl}?${params.toString()}`;
    return this.http.get<AlgoliaSearchResponse>(searchUrl);
  }

  searchByDate(query: string): Observable<AlgoliaSearchResponse> {
    return this.searchStories({
      query,
      tags: 'story',
      sortBy: 'date',
    });
  }
}
