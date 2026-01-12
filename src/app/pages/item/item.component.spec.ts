import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Params } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ItemComponent } from './item.component';
import { HackernewsService } from '../../services/hackernews.service';
import { BulkLoadResult } from '../../services/algolia-comment-loader.service';
import { VisitedService } from '../../services/visited.service';
import { ScrollService } from '../../services/scroll.service';
import { CommentSortService } from '../../services/comment-sort.service';
import { HNItem } from '../../models/hn';

describe('ItemComponent', () => {
  let component: ItemComponent;
  let fixture: ComponentFixture<ItemComponent>;
  let mockHnService: MockedObject<HackernewsService>;
  let mockVisitedService: MockedObject<VisitedService>;
  let mockScrollService: MockedObject<ScrollService>;
  let mockCommentSortService: MockedObject<CommentSortService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  const mockItem: HNItem = {
    id: 123,
    type: 'story',
    by: 'testuser',
    time: 1234567890,
    title: 'Test Story',
    descendants: 3,
    kids: [1, 2, 3],
  };

  const mockComments: HNItem[] = [
    {
      id: 1,
      type: 'comment',
      by: 'user1',
      time: 1000,
      text: 'Comment 1',
      score: 10,
      kids: [4, 5],
    },
    {
      id: 2,
      type: 'comment',
      by: 'user2',
      time: 2000,
      text: 'Comment 2',
      score: 5,
      kids: [],
    },
    {
      id: 3,
      type: 'comment',
      by: 'user3',
      time: 1500,
      text: 'Comment 3',
      score: 15,
      kids: [6],
    },
  ];

  // Create a bulk load result that mimics what Algolia returns
  const createBulkLoadResult = (story: HNItem, comments: HNItem[]): BulkLoadResult => {
    const commentsMap = new Map<number, HNItem>();
    comments.forEach((c) => commentsMap.set(c.id, c));
    return {
      story,
      commentsMap,
      commentCount: comments.length,
    };
  };

  beforeEach(async () => {
    mockHnService = {
      getItem: vi.fn(),
      getStoryTopLevelComments: vi.fn(),
      getStoryWithAllComments: vi.fn(),
    } as unknown as MockedObject<HackernewsService>;
    mockVisitedService = {
      markAsVisited: vi.fn(),
    } as unknown as MockedObject<VisitedService>;
    mockScrollService = {
      scrollToElement: vi.fn(),
    } as unknown as MockedObject<ScrollService>;
    mockCommentSortService = {
      setSortOrder: vi.fn(),
      sortOrder: signal('default'),
    } as unknown as MockedObject<CommentSortService>;

    mockActivatedRoute = {
      params: new BehaviorSubject<Params>({ id: '123' }),
      queryParams: new BehaviorSubject<Params>({}),
      snapshot: {
        params: { id: '123' },
      } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot,
    };

    await TestBed.configureTestingModule({
      imports: [ItemComponent],
      providers: [
        { provide: HackernewsService, useValue: mockHnService },
        { provide: VisitedService, useValue: mockVisitedService },
        { provide: ScrollService, useValue: mockScrollService },
        { provide: CommentSortService, useValue: mockCommentSortService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    // Default: Algolia bulk load returns success
    mockHnService.getStoryWithAllComments.mockReturnValue(
      of(createBulkLoadResult(mockItem, mockComments)),
    );
    mockHnService.getItem.mockReturnValue(of(mockItem));
    mockHnService.getStoryTopLevelComments.mockReturnValue(of(mockComments));

    fixture = TestBed.createComponent(ItemComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Sorting Logic', () => {
    beforeEach(() => {
      component.item.set(mockItem);
      component.allComments.set(mockComments);
    });

    it('should use default HN order when "default" is selected', () => {
      mockCommentSortService.sortOrder.set('default');
      const sortedIds = component.sortedCommentIds();
      expect(sortedIds).toEqual([1, 2, 3]);
    });

    it('should sort comments by newest when "newest" is selected', () => {
      mockCommentSortService.sortOrder.set('newest');
      const sortedIds = component.sortedCommentIds();
      expect(sortedIds).toEqual([2, 3, 1]);
    });

    it('should sort comments by oldest when "oldest" is selected', () => {
      mockCommentSortService.sortOrder.set('oldest');
      const sortedIds = component.sortedCommentIds();
      expect(sortedIds).toEqual([1, 3, 2]);
    });

    it('should sort comments by best (score + replies * 2) when "best" is selected', () => {
      mockCommentSortService.sortOrder.set('best');
      const sortedIds = component.sortedCommentIds();
      expect(sortedIds).toEqual([3, 1, 2]);
    });
  });

  describe('State Management', () => {
    it('should keep sort order when loading new item', () => {
      // Setup mock for the new item
      const newItem: HNItem = { ...mockItem, id: 456 };
      mockHnService.getStoryWithAllComments.mockReturnValue(
        of(createBulkLoadResult(newItem, mockComments)),
      );

      mockCommentSortService.sortOrder.set('best');
      component.allComments.set(mockComments);
      component.commentsLoading.set(true);

      component.loadItem(456);

      // Sort order persists globally
      expect(mockCommentSortService.sortOrder()).toBe('best');
      // allComments is now populated from bulk load
      expect(component.allComments().length).toBe(mockComments.length);
      expect(component.commentsLoading()).toBe(false);
    });

    it('should load comments only once for non-default sorts', () => {
      component.item.set(mockItem);
      // When bulk loading succeeds, allComments is already populated
      // So getStoryTopLevelComments should not be called
      component.allComments.set(mockComments);
      component.onSortChange('best');

      expect(mockHnService.getStoryTopLevelComments).not.toHaveBeenCalled();

      component.onSortChange('newest');
      expect(mockHnService.getStoryTopLevelComments).not.toHaveBeenCalled();
    });

    it('should fallback to getStoryTopLevelComments when allComments is empty', () => {
      component.item.set(mockItem);
      component.allComments.set([]); // Empty - would trigger fallback
      component.onSortChange('best');

      expect(mockHnService.getStoryTopLevelComments).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration', () => {
    it('should update visibleCommentIds when sort changes', () => {
      component.item.set(mockItem);
      component.allComments.set(mockComments);

      mockCommentSortService.sortOrder.set('newest');
      let visibleIds = component.visibleCommentIds();
      expect(visibleIds).toEqual([2, 3, 1]);

      mockCommentSortService.sortOrder.set('oldest');
      visibleIds = component.visibleCommentIds();
      expect(visibleIds).toEqual([1, 3, 2]);
    });

    it('should reset pagination when sort changes', () => {
      component.item.set(mockItem);
      component['visibleTopLevelCount'].set(20);

      component.onSortChange('best');

      expect(component['visibleTopLevelCount']()).toBe(10);
    });

    it('should fallback to default order on error', () => {
      mockHnService.getStoryTopLevelComments.mockReturnValue(
        throwError(() => new Error('Test error')),
      );

      component.item.set(mockItem);
      mockCommentSortService.sortOrder.set('best');
      component.onSortChange('best');

      expect(mockCommentSortService.setSortOrder).toHaveBeenCalledWith('default');
      expect(component.commentsLoading()).toBe(false);
    });
  });

  describe('Route Handling', () => {
    it('should handle route params correctly', () => {
      component.ngOnInit();
      // Now uses Algolia bulk loading first
      expect(mockHnService.getStoryWithAllComments).toHaveBeenCalledWith(123);
    });

    it('should handle query params correctly', () => {
      const newItem: HNItem = { ...mockItem, id: 456 };
      mockHnService.getStoryWithAllComments.mockReturnValue(
        of(createBulkLoadResult(newItem, mockComments)),
      );

      (mockActivatedRoute.params as BehaviorSubject<Params>).next({});
      (mockActivatedRoute.queryParams as BehaviorSubject<Params>).next({ id: '456' });

      component.ngOnInit();
      // Now uses Algolia bulk loading first
      expect(mockHnService.getStoryWithAllComments).toHaveBeenCalledWith(456);
    });

    it('should scroll to submission title after loading', async () => {
      component.ngOnInit();

      setTimeout(() => {
        expect(mockScrollService.scrollToElement).toHaveBeenCalledWith('submission-title');
      }, 150);
    });

    it('should fallback to Firebase API when Algolia fails', () => {
      mockHnService.getStoryWithAllComments.mockReturnValue(of(null));

      component.ngOnInit();

      // Should have called Algolia first
      expect(mockHnService.getStoryWithAllComments).toHaveBeenCalledWith(123);
      // Then fallback to Firebase API
      expect(mockHnService.getItem).toHaveBeenCalledWith(123);
    });

    it('should fallback to Firebase API on Algolia error', () => {
      mockHnService.getStoryWithAllComments.mockReturnValue(
        throwError(() => new Error('Algolia error')),
      );

      component.ngOnInit();

      // Should have called Algolia first
      expect(mockHnService.getStoryWithAllComments).toHaveBeenCalledWith(123);
      // Then fallback to Firebase API
      expect(mockHnService.getItem).toHaveBeenCalledWith(123);
    });
  });

  describe('Bulk Loading', () => {
    it('should populate allComments from bulk load result', () => {
      component.ngOnInit();

      // allComments should be populated from bulk load
      expect(component.allComments().length).toBe(mockComments.length);
    });

    it('should set item from bulk load result', () => {
      component.ngOnInit();

      expect(component.item()).toEqual(mockItem);
    });

    it('should mark item as visited after bulk load', () => {
      component.ngOnInit();

      expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(
        mockItem.id,
        mockItem.descendants,
      );
    });
  });
});
