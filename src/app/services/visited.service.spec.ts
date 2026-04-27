// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { VisitedService } from './visited.service';

describe('VisitedService', () => {
  const storageKey = 'hn_visited_stories';
  let service: VisitedService;
  let now = 1_700_000_000_000;

  beforeEach(() => {
    localStorage.clear();
    now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitedService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('tracks story visits separately from comment visits', () => {
    service.markCommentsVisited(123, 10);
    now += 60_000;

    service.markStoryVisited(123);

    expect(service.isVisited(123)).toBe(true);
    expect(service.getCommentsVisitedData(123)?.visitedAt).toBe(1_700_000_000_000);
    expect(service.getNewCommentCount(123, 12)).toBe(2);
  });

  it('uses comment visits for new comment badges', () => {
    service.markStoryVisited(123);

    expect(service.hasNewComments(123, 12)).toBe(false);
    expect(service.getNewCommentCount(123, 12)).toBe(0);

    service.markCommentsVisited(123, 10);

    expect(service.hasNewComments(123, 12)).toBe(true);
    expect(service.getNewCommentCount(123, 12)).toBe(2);
  });

  it('does not treat comment-only visits as story visits', () => {
    service.markCommentsVisited(123, 10);

    expect(service.isVisited(123)).toBe(false);
  });

  it('normalizes legacy visited records into a comments baseline', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([{ storyId: 123, visitedAt: 1_600_000_000_000, commentCount: 4 }]),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitedService);

    expect(service.getCommentsVisitedData(123)?.visitedAt).toBe(1_600_000_000_000);
    expect(service.getNewCommentCount(123, 9)).toBe(5);
  });

  it('keeps the legacy comments baseline when marking a story visit', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([{ storyId: 123, visitedAt: 1_600_000_000_000, commentCount: 4 }]),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitedService);

    now = 1_700_000_000_000;
    service.markStoryVisited(123);

    expect(service.getCommentsVisitedData(123)?.visitedAt).toBe(1_600_000_000_000);
    expect(service.getNewCommentCount(123, 9)).toBe(5);
  });
});
