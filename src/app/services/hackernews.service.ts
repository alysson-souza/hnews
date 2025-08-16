// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, from } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { CacheManagerService } from './cache-manager.service';

export interface HNItem {
  id: number;
  deleted?: boolean;
  type: 'job' | 'story' | 'comment' | 'poll' | 'pollopt';
  by?: string;
  time: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

export interface HNUser {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
}

interface AlgoliaSearchResponse {
  hits?: unknown[];
  nbHits?: number;
}

@Injectable({
  providedIn: 'root',
})
export class HackernewsService {
  private readonly API_BASE = 'https://hacker-news.firebaseio.com/v0';
  private http = inject(HttpClient);
  private cache = inject(CacheManagerService);

  getTopStories(): Observable<number[]> {
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

  getBestStories(): Observable<number[]> {
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

  getNewStories(): Observable<number[]> {
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

  getAskStories(): Observable<number[]> {
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

  getShowStories(): Observable<number[]> {
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

  getJobStories(): Observable<number[]> {
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

  getItem(id: number): Observable<HNItem | null> {
    return from(this.cache.get<HNItem>('stories', id.toString())).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return this.http.get<HNItem>(`${this.API_BASE}/item/${id}.json`).pipe(
          tap(async (data) => {
            if (data) {
              await this.cache.set('stories', id.toString(), data);
            }
          }),
          catchError(() => of(null)),
        );
      }),
    );
  }

  getItems(ids: number[]): Observable<(HNItem | null)[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    const requests = ids.map((id) => this.getItem(id));
    return forkJoin(requests);
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

  searchStories(query: string): Observable<AlgoliaSearchResponse> {
    // Note: HN doesn't have a native search API
    // You would typically use Algolia HN Search API for this
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story`;
    return this.http.get<AlgoliaSearchResponse>(searchUrl);
  }

  searchByDate(query: string): Observable<AlgoliaSearchResponse> {
    const searchUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story`;
    return this.http.get<AlgoliaSearchResponse>(searchUrl);
  }
}
