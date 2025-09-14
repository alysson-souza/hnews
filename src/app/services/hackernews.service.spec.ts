// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HackernewsService } from './hackernews.service';
import { CacheManagerService } from './cache-manager.service';

class MockCacheManagerService {
  get() {
    return Promise.resolve(undefined);
  }
  set() {
    return Promise.resolve();
  }
  getWithSWR() {
    return Promise.resolve(null);
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
