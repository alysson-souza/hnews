// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HNItem } from '../models/hn';
import { HackernewsService } from './hackernews.service';
import { CommentRepliesLoaderService } from './comment-replies-loader.service';

describe('CommentRepliesLoaderService', () => {
  let service: CommentRepliesLoaderService;
  let mockHnService: { getItemsPage: ReturnType<typeof vi.fn> };

  const mockReplies: HNItem[] = [
    {
      id: 456,
      by: 'replyuser1',
      time: Math.floor(Date.now() / 1000) - 1800,
      text: 'Reply 1',
      type: 'comment',
    },
    {
      id: 789,
      by: 'replyuser2',
      time: Math.floor(Date.now() / 1000) - 900,
      text: 'Reply 2',
      type: 'comment',
    },
  ];

  beforeEach(() => {
    mockHnService = {
      getItemsPage: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CommentRepliesLoaderService,
        { provide: HackernewsService, useValue: mockHnService },
      ],
    });

    service = TestBed.inject(CommentRepliesLoaderService);
  });

  it('should initialise with empty state', () => {
    expect(service.replies()).toEqual([]);
    expect(service.repliesLoaded()).toBe(false);
    expect(service.loadingReplies()).toBe(false);
    expect(service.loadingMore()).toBe(false);
    expect(service.hasMore()).toBe(false);
    expect(service.remainingCount()).toBe(0);
  });

  it('should configure kids and reset pagination state', () => {
    service.configureKids([1, 2, 3]);

    expect(service.replies()).toEqual([]);
    expect(service.repliesLoaded()).toBe(false);
    expect(service.loadingReplies()).toBe(false);
    expect(service.loadingMore()).toBe(false);
    expect(service.hasMore()).toBe(false);
    expect(service.remainingCount()).toBe(0);
  });

  it('should mark when there are more replies than a page', () => {
    const kids = Array.from({ length: 12 }, (_, index) => index + 1);
    service.configureKids(kids);

    expect(service.hasMore()).toBe(true);
  });

  it('should load the first page of replies and update state', () => {
    mockHnService.getItemsPage.mockReturnValue(of(mockReplies));
    service.configureKids([456, 789]);

    service.loadFirstPage();

    expect(mockHnService.getItemsPage).toHaveBeenCalledWith([456, 789], 0, 10);
    expect(service.replies()).toEqual(mockReplies);
    expect(service.repliesLoaded()).toBe(true);
    expect(service.loadingReplies()).toBe(false);
    expect(service.loadingMore()).toBe(false);
    expect(service.hasMore()).toBe(false);
    expect(service.remainingCount()).toBe(0);
  });

  it('should not reload the first page once replies are loaded', () => {
    mockHnService.getItemsPage.mockReturnValue(of(mockReplies));
    service.configureKids([456, 789]);

    service.loadFirstPage();
    service.loadFirstPage();

    expect(mockHnService.getItemsPage).toHaveBeenCalledTimes(1);
  });

  it('should filter out null and deleted replies', () => {
    const deletedReply: HNItem = { id: 999, by: 'ghost', time: 0, type: 'comment', deleted: true };
    mockHnService.getItemsPage.mockReturnValue(of([mockReplies[0], null, deletedReply]));
    service.configureKids([456, 789, 999]);

    service.loadFirstPage();

    expect(service.replies()).toEqual([mockReplies[0]]);
  });

  it('should append additional pages when loading more replies', () => {
    const kids = Array.from({ length: 12 }, (_, index) => index + 1);
    service.configureKids(kids);
    mockHnService.getItemsPage
      .mockReturnValueOnce(of(mockReplies))
      .mockReturnValueOnce(of([{ ...mockReplies[0], id: 1010 }]));

    service.loadFirstPage();
    service.loadNextPage();

    expect(mockHnService.getItemsPage).toHaveBeenCalledWith(kids, 1, 10);
    expect(service.replies().length).toBe(3);
    expect(service.hasMore()).toBe(false);
    expect(service.remainingCount()).toBe(0);
  });

  it('should not attempt to load more when already loading or no more replies', () => {
    service.configureKids([1, 2, 3]);
    service.loadNextPage();

    expect(mockHnService.getItemsPage).not.toHaveBeenCalled();

    mockHnService.getItemsPage.mockReturnValue(of(mockReplies));
    service.loadFirstPage();
    service.loadNextPage();

    expect(mockHnService.getItemsPage).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when loading replies', () => {
    mockHnService.getItemsPage.mockReturnValue(throwError(() => new Error('fail')));
    service.configureKids([456]);

    service.loadFirstPage();

    expect(service.loadingReplies()).toBe(false);
    expect(service.loadingMore()).toBe(false);
    expect(service.replies()).toEqual([]);
  });

  it('should mark replies as loaded when there are no kids', () => {
    service.configureKids([]);

    service.loadFirstPage();

    expect(service.repliesLoaded()).toBe(true);
    expect(mockHnService.getItemsPage).not.toHaveBeenCalled();
  });
});
