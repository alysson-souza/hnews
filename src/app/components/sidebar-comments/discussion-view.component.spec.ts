import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { DiscussionViewComponent } from './discussion-view.component';
import { SidebarService } from '@services/sidebar.service';
import { HackernewsService } from '@services/hackernews.service';
import { VisitedService } from '@services/visited.service';
import { CommentSortService } from '@services/comment-sort.service';
import { HNItem } from '@models/hn';
import { CommentSortOrder } from '../shared/comment-sort-dropdown/comment-sort-dropdown.component';

describe('DiscussionViewComponent', () => {
  let component: DiscussionViewComponent;
  let fixture: ComponentFixture<DiscussionViewComponent>;
  let mockHnService: MockedObject<HackernewsService>;
  let mockSidebarService: MockedObject<SidebarService>;
  let mockVisitedService: MockedObject<VisitedService>;
  let mockCommentSortService: MockedObject<CommentSortService>;

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
      descendants: 10,
    },
    {
      id: 2,
      type: 'comment',
      by: 'user2',
      time: 2000,
      text: 'Comment 2',
      score: 5,
      kids: [],
      descendants: 2,
    },
    {
      id: 3,
      type: 'comment',
      by: 'user3',
      time: 1500,
      text: 'Comment 3',
      score: 15,
      kids: [6],
      descendants: 20,
    },
  ];

  beforeEach(async () => {
    mockHnService = {
      getItem: vi.fn(),
      getStoryTopLevelComments: vi.fn(),
      getItemsPage: vi.fn(),
    } as unknown as MockedObject<HackernewsService>;
    mockSidebarService = {
      position: vi.fn().mockReturnValue(0),
      canGoBack: vi.fn().mockReturnValue(true),
      canGoForward: vi.fn().mockReturnValue(false),
      currentEntry: vi
        .fn()
        .mockReturnValue({ key: 1, state: { selectedCommentId: signal<number | null>(null) } }),
    } as unknown as MockedObject<SidebarService>;
    mockVisitedService = {
      markCommentsVisited: vi.fn(),
      getCommentsVisitedData: vi.fn().mockReturnValue(undefined),
    } as unknown as MockedObject<VisitedService>;
    const sortOrderSignal = signal<CommentSortOrder>('default');
    // Recorded outputs per non-default order — ordering semantics are
    // specified in comment-sort.service.spec.ts; this stub only checks the
    // component delegates to the sort service and uses its result. The
    // default order is the native HN order, mirrored here.
    const sortedIdsByOrder: Record<Exclude<CommentSortOrder, 'default'>, number[]> = {
      newest: [2, 3, 1],
      oldest: [1, 3, 2],
      popular: [3, 1, 2],
    };
    mockCommentSortService = {
      setSortOrder: vi.fn((order: CommentSortOrder) => sortOrderSignal.set(order)),
      sortOrder: sortOrderSignal,
      sortComments: vi.fn(
        (
          kids: readonly number[],
          _comments: readonly HNItem[],
          order: CommentSortOrder,
        ): number[] => (order === 'default' ? [...kids] : (sortedIdsByOrder[order] ?? [...kids])),
      ),
    } as unknown as MockedObject<CommentSortService>;

    await TestBed.configureTestingModule({
      imports: [DiscussionViewComponent],
      providers: [
        { provide: HackernewsService, useValue: mockHnService },
        { provide: SidebarService, useValue: mockSidebarService },
        { provide: VisitedService, useValue: mockVisitedService },
        { provide: CommentSortService, useValue: mockCommentSortService },
        provideRouter([]),
      ],
    }).compileComponents();

    mockHnService.getItem.mockReturnValue(of(mockItem));
    mockHnService.getStoryTopLevelComments.mockReturnValue(of(mockComments));
    mockHnService.getItemsPage.mockReturnValue(of([]));

    fixture = TestBed.createComponent(DiscussionViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entry', {
      key: 1,
      index: 0,
      itemId: 123,
      state: {
        scrollTop: 0,
        selectedCommentId: signal<number | null>(null),
        visibleCount: 10,
        item: null,
        comments: [],
        previousVisitedAt: null,
        visited: false,
        selectFirst: false,
      },
    });
    fixture.componentRef.setInput('active', true);
  });

  it('preloads inactive views without visiting or focusing them', () => {
    fixture.componentRef.setInput('active', false);
    const focused = document.activeElement;
    fixture.detectChanges();
    expect(component.item()?.id).toBe(123);
    expect(mockVisitedService.markCommentsVisited).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(focused);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    expect(mockVisitedService.markCommentsVisited).toHaveBeenCalledTimes(1);
  });

  it('ignores late responses after a view has been released', () => {
    const response = new Subject<HNItem>();
    mockHnService.getItem.mockReturnValue(response);
    fixture.detectChanges();
    const entry = component.entry();
    fixture.destroy();
    response.next(mockItem);
    expect(entry.state.item).toBeNull();
    expect(mockVisitedService.markCommentsVisited).not.toHaveBeenCalled();
  });

  it('loads sorting metadata when the shared preference changes on a retained view', () => {
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    mockCommentSortService.sortOrder.set('newest');
    fixture.detectChanges();
    expect(mockHnService.getStoryTopLevelComments).toHaveBeenCalledWith(123);
    expect(component.visibleCommentIds()).toEqual([2, 3, 1]);
    expect(mockVisitedService.markCommentsVisited).not.toHaveBeenCalled();
  });

  it('keeps loaded pages and the original visit baseline during background item updates', () => {
    const response = new Subject<HNItem>();
    mockHnService.getItem.mockReturnValue(response);
    const story = {
      ...mockItem,
      descendants: 80,
      kids: Array.from({ length: 30 }, (_, index) => index + 1),
    };
    fixture.detectChanges();
    response.next(story);
    fixture.detectChanges();
    component.loadMoreTopLevelComments();
    expect(component.visibleCommentIds()).toHaveLength(20);
    response.next({ ...story, score: 90 });
    fixture.detectChanges();
    expect(component.visibleCommentIds()).toHaveLength(20);
    expect(mockVisitedService.markCommentsVisited).toHaveBeenCalledTimes(1);
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
      expect(mockCommentSortService.sortComments).toHaveBeenCalledWith(
        mockItem.kids,
        mockComments,
        'default',
      );
    });

    it('should sort comments by newest when "newest" is selected', () => {
      mockCommentSortService.sortOrder.set('newest');
      const sortedIds = component.sortedCommentIds();
      // Sorted by time descending: comment2 (2000), comment3 (1500), comment1 (1000)
      expect(sortedIds).toEqual([2, 3, 1]);
    });

    it('should sort comments by oldest when "oldest" is selected', () => {
      mockCommentSortService.sortOrder.set('oldest');
      const sortedIds = component.sortedCommentIds();
      // Sorted by time ascending: comment1 (1000), comment3 (1500), comment2 (2000)
      expect(sortedIds).toEqual([1, 3, 2]);
    });

    it('should sort comments by descendants (most replies first) when "best" is selected', () => {
      mockCommentSortService.sortOrder.set('popular');
      const sortedIds = component.sortedCommentIds();
      // comment3: descendants 20, comment1: descendants 10, comment2: descendants 2
      expect(sortedIds).toEqual([3, 1, 2]);
    });

    it('should wait for sort metadata when comments are not loaded', () => {
      component.allComments.set([]);
      mockCommentSortService.sortOrder.set('newest');
      const sortedIds = component.sortedCommentIds();
      expect(sortedIds).toEqual([]);
    });
  });

  describe('State Management', () => {
    it('should keep sort order when loading new item', () => {
      mockCommentSortService.sortOrder.set('popular');
      component.allComments.set(mockComments);
      component.commentsLoading.set(true);

      component['loadItem'](456);

      // Sort order persists globally
      expect(mockCommentSortService.sortOrder()).toBe('popular');
      expect(component.allComments()).toEqual(mockComments);
      expect(component.commentsLoading()).toBe(false);
    });

    it('should load comments when opening an item with a persisted non-default sort', () => {
      mockCommentSortService.sortOrder.set('popular');

      component['loadItem'](mockItem.id);

      expect(mockHnService.getStoryTopLevelComments).toHaveBeenCalledWith(mockItem.id);
      expect(component.allComments()).toEqual(mockComments);
    });

    it('should wait for top-level comment metadata before displaying a non-default sort', () => {
      const comments$ = new Subject<HNItem[]>();
      mockHnService.getStoryTopLevelComments.mockReturnValue(comments$.asObservable());
      component.item.set(mockItem);
      mockCommentSortService.sortOrder.set('newest');

      component.onSortChange('newest');

      expect(component.commentsLoading()).toBe(true);
      expect(component.visibleCommentIds()).toEqual([]);

      comments$.next(mockComments);
      comments$.complete();

      expect(component.commentsLoading()).toBe(false);
      expect(component.visibleCommentIds()).toEqual([2, 3, 1]);
    });

    it('should capture previous comments visit before marking the thread visited', () => {
      mockVisitedService.getCommentsVisitedData.mockReturnValue({
        storyId: mockItem.id,
        visitedAt: 1_600_000_000_000,
        commentCount: 1,
      });

      component['loadItem'](mockItem.id);

      expect(component.previousVisitedAt()).toBe(1_600_000_000_000);
      expect(mockVisitedService.getCommentsVisitedData).toHaveBeenCalledWith(mockItem.id);
      fixture.detectChanges();
      expect(mockVisitedService.getCommentsVisitedData.mock.invocationCallOrder[0]).toBeLessThan(
        mockVisitedService.markCommentsVisited.mock.invocationCallOrder[0],
      );
    });

    it('should load comments only once for non-default sorts', () => {
      component.item.set(mockItem);
      component.onSortChange('popular');

      expect(mockHnService.getStoryTopLevelComments).toHaveBeenCalledTimes(1);

      // Change to another non-default sort
      component.onSortChange('newest');

      // Should not call again because comments are already loaded
      expect(mockHnService.getStoryTopLevelComments).toHaveBeenCalledTimes(1);
    });

    it('should not fetch comments for default sort', () => {
      component.item.set(mockItem);
      component.onSortChange('default');

      expect(mockHnService.getStoryTopLevelComments).not.toHaveBeenCalled();
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
      component.smallThreadMode.set(true);

      component.onSortChange('popular');

      expect(component['visibleTopLevelCount']()).toBe(3);
    });

    it('should show loading state while fetching comments', () => {
      component.item.set(mockItem);
      component.onSortChange('popular');

      expect(component.commentsLoading()).toBe(false); // Completed synchronously in test
    });

    it('should show available comments without changing the saved sort preference on error', () => {
      mockHnService.getStoryTopLevelComments.mockReturnValue(
        throwError(() => new Error('Test error')),
      );

      component.item.set(mockItem);
      mockCommentSortService.sortOrder.set('popular');
      component.onSortChange('popular');

      expect(mockCommentSortService.sortOrder()).toBe('popular');
      expect(component.visibleCommentIds()).toEqual([1, 2, 3]);
      expect(component.commentsLoading()).toBe(false);
    });
  });

  describe('Comments Counter Display', () => {
    it('should display correct comment count for a story with kids array', () => {
      const storyWithKids: HNItem = {
        id: 456,
        type: 'story',
        by: 'testuser',
        time: 1234567890,
        title: 'Test Story',
        descendants: 10, // Total nested comments
        kids: [1, 2, 3], // Only 3 direct replies
      };

      // Mock the service to return this item
      mockHnService.getItem.mockReturnValue(of(storyWithKids));
      fixture.componentRef.setInput('entry', { ...component.entry(), itemId: 456 });

      // Trigger the effect by setting the item
      component.item.set(storyWithKids);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const counterElement = compiled.querySelector('h4');
      expect(counterElement?.textContent).toContain('Comments (3)');
    });

    it('should display correct comment count for a comment thread with kids', () => {
      const commentWithKids: HNItem = {
        id: 789,
        type: 'comment',
        by: 'testuser',
        time: 1234567890,
        text: 'Parent comment',
        descendants: 0, // Comments may not have accurate descendants
        kids: [10, 11], // 2 direct replies
      };

      // Mock the service to return this item
      mockHnService.getItem.mockReturnValue(of(commentWithKids));
      fixture.componentRef.setInput('entry', { ...component.entry(), itemId: 789 });

      // Trigger the effect by setting the item
      component.item.set(commentWithKids);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const counterElement = compiled.querySelector('h4');
      expect(counterElement?.textContent).toContain('Comments (2)');
    });

    it('should display zero when item has no kids', () => {
      const itemWithoutKids: HNItem = {
        id: 999,
        type: 'comment',
        by: 'testuser',
        time: 1234567890,
        text: 'Comment with no replies',
        descendants: 0,
      };

      // Mock the service to return this item
      mockHnService.getItem.mockReturnValue(of(itemWithoutKids));
      fixture.componentRef.setInput('entry', { ...component.entry(), itemId: 999 });

      // Trigger the effect by setting the item
      component.item.set(itemWithoutKids);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const counterElement = compiled.querySelector('h4');
      expect(counterElement?.textContent).toContain('Comments (0)');
    });
  });

  describe('Small Thread Strategy', () => {
    it('should enable small thread mode and show all top-level comments', () => {
      component['loadItem'](123);

      expect(component.smallThreadMode()).toBe(true);
      expect(component.visibleCommentIds()).toEqual(mockItem.kids);
      expect(component.hasMoreTopLevelComments()).toBe(false);
    });

    it('should keep default pagination for larger threads', () => {
      const largeStory: HNItem = {
        ...mockItem,
        descendants: 120,
        kids: Array.from({ length: 25 }, (_, i) => i + 1),
      };

      mockHnService.getItem.mockReturnValue(of(largeStory));

      component['loadItem'](999);

      expect(component.smallThreadMode()).toBe(false);
      expect(component.visibleCommentIds().length).toBe(10);
      expect(component.hasMoreTopLevelComments()).toBe(true);
    });

    it('should use the shared comment spacing wrappers for comment lists', () => {
      const largeStory: HNItem = {
        ...mockItem,
        descendants: 120,
        kids: Array.from({ length: 25 }, (_, i) => i + 1),
      };

      mockHnService.getItem.mockReturnValue(of(largeStory));

      component['loadItem'](999);
      fixture.detectChanges();

      const commentsBody = fixture.nativeElement.querySelector('.comments-body');
      const commentsList = fixture.nativeElement.querySelector('.comments-list[role="tree"]');
      const loadMore = fixture.nativeElement.querySelector('.comments-load-more');

      expect(commentsBody).not.toBeNull();
      expect(commentsList).not.toBeNull();
      expect(commentsList.classList.contains('space-y-4')).toBe(false);
      expect(loadMore).not.toBeNull();
      expect(loadMore.classList.contains('mt-4')).toBe(false);
    });
  });
});
