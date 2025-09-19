// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AlgoliaSearchResponse } from '../models/algolia';
import { SearchOptions } from '../models/search';

/**
 * Thin client for Algolia HN Search API.
 * - Builds query parameters consistently
 * - Keeps raw response shape; mapping to domain happens in consumers when needed
 */
@Injectable({ providedIn: 'root' })
export class AlgoliaApiClient {
  private http = inject(HttpClient);

  search(options: SearchOptions): Observable<AlgoliaSearchResponse> {
    let baseUrl = 'https://hn.algolia.com/api/v1/search';
    if (options.sortBy === 'date') {
      baseUrl = 'https://hn.algolia.com/api/v1/search_by_date';
    }

    const params = new URLSearchParams();
    params.append('advancedSyntax', 'true');

    const rawQuery = (options.query || '').trim();
    const siteMatch = rawQuery.match(/^site:(\S+)/i);
    const urlMatch = rawQuery.match(/^url:(\S+)/i);

    if (siteMatch) {
      const domain = siteMatch[1]
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/.*$/, '');
      params.append('query', domain);
      params.append('restrictSearchableAttributes', 'url');
      params.append('tags', 'story');
    } else if (urlMatch) {
      const term = urlMatch[1];
      params.append('query', term);
      params.append('restrictSearchableAttributes', 'url');
      params.append('tags', 'story');
    } else {
      params.append('query', rawQuery);
    }

    if (!params.has('tags')) {
      if (options.tags && options.tags !== 'all') {
        params.append('tags', options.tags);
      } else {
        params.append('tags', '(story,comment)');
      }
    }

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

    if (options.page !== undefined) {
      params.append('page', options.page.toString());
    }

    const url = `${baseUrl}?${params.toString()}`;
    return this.http.get<AlgoliaSearchResponse>(url);
  }
}
