import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Params } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ItemComponent } from './item.component';
import { HackernewsService } from '../../services/hackernews.service';
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

  beforeEach(async () => {
    mockHnService = {
      getItem: vi.fn(),
      getStoryTopLevelComments: vi.fn(),
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
      mockCommentSortService.sortOrder.set('best');
      component.allComments.set(mockComments);
      component.commentsLoading.set(true);

      component.loadItem(456);

      // Sort order persists globally
      expect(mockCommentSortService.sortOrder()).toBe('best');
      expect(component.allComments()).toEqual([]);
      expect(component.commentsLoading()).toBe(false);
    });

    it('should load comments only once for non-default sorts', () => {
      component.item.set(mockItem);
      component.onSortChange('best');

      expect(mockHnService.getStoryTopLevelComments).toHaveBeenCalledTimes(1);

      component.onSortChange('newest');
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
      expect(mockHnService.getItem).toHaveBeenCalledWith(123);
    });

    it('should handle query params correctly', () => {
      (mockActivatedRoute.params as BehaviorSubject<Params>).next({});
      (mockActivatedRoute.queryParams as BehaviorSubject<Params>).next({ id: '456' });

      component.ngOnInit();
      expect(mockHnService.getItem).toHaveBeenCalledWith(456);
    });

    it('should scroll to submission title after loading', async () => {
      component.ngOnInit();

      setTimeout(() => {
        expect(mockScrollService.scrollToElement).toHaveBeenCalledWith('submission-title');
      }, 150);
    });
  });
});
