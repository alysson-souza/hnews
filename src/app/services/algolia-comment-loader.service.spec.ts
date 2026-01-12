// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { of, throwError, firstValueFrom } from 'rxjs';
import { AlgoliaCommentLoaderService } from './algolia-comment-loader.service';
import { AlgoliaApiClient } from '../data/algolia-api.client';
import { CacheManagerService } from './cache-manager.service';
import { AlgoliaItemResponse } from '../models/algolia';

describe('AlgoliaCommentLoaderService', () => {
  let service: AlgoliaCommentLoaderService;
  let algoliaApiMock: { getItem: ReturnType<typeof vi.fn> };
  let cacheMock: { set: ReturnType<typeof vi.fn> };

  const mockAlgoliaResponse: AlgoliaItemResponse = {
    id: 123,
    created_at: '2025-01-01T00:00:00Z',
    created_at_i: 1735689600,
    type: 'story',
    author: 'testuser',
    title: 'Test Story',
    url: 'https://example.com',
    text: null,
    points: 100,
    parent_id: null,
    story_id: null,
    children: [
      {
        id: 1,
        created_at: '2025-01-01T01:00:00Z',
        created_at_i: 1735693200,
        type: 'comment',
        author: 'user1',
        title: null,
        url: null,
        text: 'Comment 1',
        points: null,
        parent_id: 123,
        story_id: 123,
        children: [
          {
            id: 4,
            created_at: '2025-01-01T02:00:00Z',
            created_at_i: 1735696800,
            type: 'comment',
            author: 'user4',
            title: null,
            url: null,
            text: 'Reply to comment 1',
            points: null,
            parent_id: 1,
            story_id: 123,
            children: [],
          },
        ],
      },
      {
        id: 2,
        created_at: '2025-01-01T01:30:00Z',
        created_at_i: 1735695000,
        type: 'comment',
        author: 'user2',
        title: null,
        url: null,
        text: 'Comment 2',
        points: null,
        parent_id: 123,
        story_id: 123,
        children: [],
      },
    ],
  };

  beforeEach(() => {
    algoliaApiMock = {
      getItem: vi.fn(),
    };

    cacheMock = {
      set: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        AlgoliaCommentLoaderService,
        { provide: AlgoliaApiClient, useValue: algoliaApiMock },
        { provide: CacheManagerService, useValue: cacheMock },
      ],
    });

    service = TestBed.inject(AlgoliaCommentLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadStoryWithComments', () => {
    it('should load story with all nested comments in one request', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      const result = await firstValueFrom(service.loadStoryWithComments(123));

      expect(result).not.toBeNull();
      expect(result!.story.id).toBe(123);
      expect(result!.commentCount).toBe(3); // 2 top-level + 1 nested
      expect(result!.commentsMap.has(1)).toBe(true);
      expect(result!.commentsMap.has(2)).toBe(true);
      expect(result!.commentsMap.has(4)).toBe(true);
    });

    it('should return null on API error', async () => {
      algoliaApiMock.getItem.mockReturnValue(throwError(() => new Error('API Error')));

      const result = await firstValueFrom(service.loadStoryWithComments(123));

      expect(result).toBeNull();
    });

    it('should cache all items after successful load', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      await firstValueFrom(service.loadStoryWithComments(123));

      // Should cache story + 3 comments = 4 items
      // Wait for async caching to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(cacheMock.set).toHaveBeenCalled();
    });

    it('should correctly map story fields', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      const result = await firstValueFrom(service.loadStoryWithComments(123));

      const story = result!.story;
      expect(story.id).toBe(123);
      expect(story.type).toBe('story');
      expect(story.by).toBe('testuser');
      expect(story.title).toBe('Test Story');
      expect(story.url).toBe('https://example.com');
      expect(story.time).toBe(1735689600);
      expect(story.score).toBe(100);
      expect(story.kids).toEqual([1, 2]);
    });

    it('should correctly map comment fields', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      const result = await firstValueFrom(service.loadStoryWithComments(123));

      const comment = result!.commentsMap.get(1)!;
      expect(comment.id).toBe(1);
      expect(comment.type).toBe('comment');
      expect(comment.by).toBe('user1');
      expect(comment.text).toBe('Comment 1');
      expect(comment.parent).toBe(123);
      expect(comment.kids).toEqual([4]);
    });
  });

  describe('getCommentFromResult', () => {
    it('should return comment from result map', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      const result = await firstValueFrom(service.loadStoryWithComments(123));
      const comment = service.getCommentFromResult(result!, 1);

      expect(comment).not.toBeNull();
      expect(comment!.id).toBe(1);
    });

    it('should return null for non-existent comment', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      const result = await firstValueFrom(service.loadStoryWithComments(123));
      const comment = service.getCommentFromResult(result!, 999);

      expect(comment).toBeNull();
    });
  });

  describe('getCommentsFromResult', () => {
    it('should return multiple comments from result map', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      const result = await firstValueFrom(service.loadStoryWithComments(123));
      const comments = service.getCommentsFromResult(result!, [1, 2]);

      expect(comments.length).toBe(2);
      expect(comments[0].id).toBe(1);
      expect(comments[1].id).toBe(2);
    });

    it('should filter out non-existent comments', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      const result = await firstValueFrom(service.loadStoryWithComments(123));
      const comments = service.getCommentsFromResult(result!, [1, 999, 2]);

      expect(comments.length).toBe(2);
    });
  });

  describe('shouldUseBulkLoading', () => {
    it('should return true for stories with more than 5 comments', () => {
      expect(service.shouldUseBulkLoading(10)).toBe(true);
      expect(service.shouldUseBulkLoading(6)).toBe(true);
    });

    it('should return false for stories with 5 or fewer comments', () => {
      expect(service.shouldUseBulkLoading(5)).toBe(false);
      expect(service.shouldUseBulkLoading(3)).toBe(false);
      expect(service.shouldUseBulkLoading(0)).toBe(false);
    });

    it('should return false for undefined descendants', () => {
      expect(service.shouldUseBulkLoading(undefined)).toBe(false);
    });
  });

  describe('loadStoryWithCommentsAsync', () => {
    it('should return promise that resolves with result', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      const result = await service.loadStoryWithCommentsAsync(123);

      expect(result).not.toBeNull();
      expect(result!.story.id).toBe(123);
    });

    it('should return promise that resolves with null on error', async () => {
      algoliaApiMock.getItem.mockReturnValue(throwError(() => new Error('API Error')));

      const result = await service.loadStoryWithCommentsAsync(123);

      expect(result).toBeNull();
    });
  });

  describe('descendants calculation', () => {
    it('should calculate descendants count for stories', async () => {
      algoliaApiMock.getItem.mockReturnValue(of(mockAlgoliaResponse));

      const result = await firstValueFrom(service.loadStoryWithComments(123));

      // Story should have descendants count = total nested comments
      expect(result!.story.descendants).toBe(3);
    });
  });
});
