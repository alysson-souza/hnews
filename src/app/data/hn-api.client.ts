// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HNItem, HNUser, mapToHNItem } from '../models/hn';

/**
 * Thin client for Hacker News Firebase API.
 * Responsibility: HTTP calls + mapping to domain models.
 * Caching and orchestration should live in higher-level services/stores.
 */
@Injectable({ providedIn: 'root' })
export class HnApiClient {
  private readonly API_BASE = 'https://hacker-news.firebaseio.com/v0';
  private http = inject(HttpClient);

  topStories(): Observable<number[]> {
    return this.http.get<number[]>(`${this.API_BASE}/topstories.json`);
  }

  bestStories(): Observable<number[]> {
    return this.http.get<number[]>(`${this.API_BASE}/beststories.json`);
  }

  newStories(): Observable<number[]> {
    return this.http.get<number[]>(`${this.API_BASE}/newstories.json`);
  }

  askStories(): Observable<number[]> {
    return this.http.get<number[]>(`${this.API_BASE}/askstories.json`);
  }

  showStories(): Observable<number[]> {
    return this.http.get<number[]>(`${this.API_BASE}/showstories.json`);
  }

  jobStories(): Observable<number[]> {
    return this.http.get<number[]>(`${this.API_BASE}/jobstories.json`);
  }

  item(id: number): Observable<HNItem | null> {
    return this.http.get<unknown>(`${this.API_BASE}/item/${id}.json`).pipe(
      map((raw) => mapToHNItem(raw)),
      catchError(() => of(null)),
    );
  }

  user(id: string): Observable<HNUser> {
    return this.http.get<HNUser>(`${this.API_BASE}/user/${id}.json`);
  }

  maxItem(): Observable<number> {
    return this.http.get<number>(`${this.API_BASE}/maxitem.json`);
  }

  updates(): Observable<{ items: number[]; profiles: string[] }> {
    return this.http.get<{ items: number[]; profiles: string[] }>(`${this.API_BASE}/updates.json`);
  }
}
