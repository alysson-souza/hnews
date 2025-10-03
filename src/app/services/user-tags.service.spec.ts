// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { UserTagsService } from './user-tags.service';

function seedTags(service: UserTagsService, total: number) {
  for (let index = 1; index <= total; index++) {
    service.setTag(`user-${index}`, `Tag ${index}`);
  }
}

describe('UserTagsService', () => {
  let service: UserTagsService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserTagsService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('filters tags by username and label', () => {
    service.setTag('alice', 'Angular Fan');
    service.setTag('bob', 'RxJS Pro');
    service.setTag('charlie', 'Design Guru');
    service.setTag('bobby', 'Angular Enthusiast');

    const result = service.getPaginatedTags('bob', 1, 10);

    expect(result.totalCount).toBe(2);
    expect(result.tags.map((tag) => tag.username)).toEqual(['bob', 'bobby']);
  });

  it('filters tags and does NOT return all tags for nonsense query', () => {
    service.setTag('alice', 'Angular Fan');
    service.setTag('bob', 'RxJS Pro');
    service.setTag('charlie', 'Design Guru');
    service.setTag('dang', 'HN Moderator');

    const result = service.getPaginatedTags('adjnasd', 1, 10);

    expect(result.totalCount).toBe(0);
    expect(result.tags).toEqual([]);
  });

  it('filters tags correctly for "dang" query', () => {
    service.setTag('alice', 'Angular Fan');
    service.setTag('bob', 'RxJS Pro');
    service.setTag('charlie', 'Design Guru');
    service.setTag('dang', 'HN Moderator');

    const result = service.getPaginatedTags('dang', 1, 10);

    expect(result.totalCount).toBe(1);
    expect(result.tags.map((tag) => tag.username)).toEqual(['dang']);
  });

  it('filters correctly with 105 tags - should only match relevant ones', () => {
    // Seed 105 tags similar to real scenario
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }
    // Add specific user
    service.setTag('dang', 'HN Moderator');

    const resultDang = service.getPaginatedTags('dang', 1, 10);
    expect(resultDang.totalCount).toBe(1);
    expect(resultDang.tags[0].username).toBe('dang');

    const resultNonsense = service.getPaginatedTags('adjnasd', 1, 10);
    expect(resultNonsense.totalCount).toBe(0);
    expect(resultNonsense.tags).toEqual([]);
  });

  it('filters tags after loading from localStorage', () => {
    // Seed tags and persist
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }
    service.setTag('dang', 'HN Moderator');

    // Create a new service instance (simulates page reload)
    const service2 = TestBed.inject(UserTagsService);

    // Test filtering on the reloaded service
    const resultDang = service2.getPaginatedTags('dang', 1, 10);
    expect(resultDang.totalCount).toBe(1);
    expect(resultDang.tags[0].username).toBe('dang');

    const resultNonsense = service2.getPaginatedTags('adjnasd', 1, 10);
    expect(resultNonsense.totalCount).toBe(0);
    expect(resultNonsense.tags).toEqual([]);
  });

  it('getFilteredTags should NOT return all tags for nonsense query', () => {
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }

    const filtered = service.getFilteredTags('adjnasd');
    expect(filtered.length).toBe(0);
  });

  it('getFilteredTags should return only matching tags for "dang"', () => {
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }
    service.setTag('dang', 'HN Moderator');

    const filtered = service.getFilteredTags('dang');
    expect(filtered.length).toBe(1);
    expect(filtered[0].username).toBe('dang');
  });

  it('REGRESSION: should handle when searchQuery evaluates to falsy after trim', () => {
    service.setTag('alice', 'Tag 1');
    service.setTag('bob', 'Tag 2');
    service.setTag('charlie', 'Tag 3');

    // These should all return all tags (valid behavior for empty search)
    expect(service.getFilteredTags('').length).toBe(3);
    expect(service.getFilteredTags('   ').length).toBe(3); // spaces only
    expect(service.getFilteredTags('\t').length).toBe(3); // tab only
  });

  it('REGRESSION BUG: Empty search should return all tags, non-matching search should return zero', () => {
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }

    // Empty search should return all
    const emptyResult = service.getPaginatedTags('', 1, 10);
    expect(emptyResult.totalCount).toBe(105);

    // But a search with actual text that doesn't match should return ZERO
    const noMatchResult = service.getPaginatedTags('adjnasd', 1, 10);
    expect(noMatchResult.totalCount).withContext('adjnasd should match zero tags').toBe(0);
    expect(noMatchResult.tags.length).toBe(0);
  });

  it('clamps the current page within bounds when the requested page is too high', () => {
    seedTags(service, 15);

    const result = service.getPaginatedTags('', 5, 10);

    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(2);
    expect(result.tags.length).toBe(5);
  });

  it('guards against invalid pagination parameters', () => {
    seedTags(service, 3);

    const result = service.getPaginatedTags('', 0, 0);

    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.tags.length).toBe(1);
  });

  it('always returns at least one page even when there are no tags', () => {
    const result = service.getPaginatedTags('', 3, 10);

    expect(result.totalCount).toBe(0);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.tags).toEqual([]);
  });
});
