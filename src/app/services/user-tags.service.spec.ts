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
