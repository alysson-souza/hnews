import type { Mock, MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SidebarCommentsComponent } from './sidebar-comments.component';
import { SidebarService } from '@services/sidebar.service';
import { HackernewsService } from '@services/hackernews.service';
import { VisitedService } from '@services/visited.service';
import { CommentSortService } from '@services/comment-sort.service';
import { HNItem } from '@models/hn';

describe('SidebarCommentsComponent', () => {
  let component: SidebarCommentsComponent;
  let fixture: ComponentFixture<SidebarCommentsComponent>;
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
      closeSidebar: vi.fn(),
      goBack: vi.fn(),
      canGoBack: vi.fn(),
      isTransitioning: vi.fn(),
      animatingOut: vi.fn(),
      animationDirection: vi.fn(),
      isOpen: vi.fn().mockReturnValue(true),
      currentItemId: vi.fn().mockReturnValue(123),
    } as unknown as MockedObject<SidebarService>;
    // Set default return values for methods used in template
    (mockSidebarService.canGoBack as Mock).mockReturnValue(false);
    (mockSidebarService.isTransitioning as Mock).mockReturnValue(false);
    (mockSidebarService.animatingOut as Mock).mockReturnValue(false);
    (mockSidebarService.animationDirection as Mock).mockReturnValue('right');

    mockVisitedService = {
      markCommentsVisited: vi.fn(),
      getCommentsVisitedData: vi.fn().mockReturnValue(undefined),
    } as unknown as MockedObject<VisitedService>;
    mockCommentSortService = {
      setSortOrder: vi.fn(),
      sortOrder: signal('default'),
    } as unknown as MockedObject<CommentSortService>;

    await TestBed.configureTestingModule({
      imports: [SidebarCommentsComponent],
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

    fixture = TestBed.createComponent(SidebarCommentsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should avoid transform classes on the open panel', () => {
    fixture.detectChanges();

    const panel: HTMLElement | null = fixture.nativeElement.querySelector('.sidebar-panel');
    expect(panel).not.toBeNull();
    expect(panel?.classList.contains('translate-x-full')).toBe(false);
  });

  it('should keep the panel translated offscreen while closed', () => {
    (mockSidebarService.isOpen as Mock).mockReturnValue(false);

    fixture.detectChanges();

    const panel: HTMLElement | null = fixture.nativeElement.querySelector('.sidebar-panel');
    expect(panel).not.toBeNull();
    expect(panel?.classList.contains('translate-x-full')).toBe(true);
  });

  describe('Swipe Dismissal', () => {
    function getPanel(): HTMLElement {
      fixture.detectChanges();
      const panel: HTMLElement | null = fixture.nativeElement.querySelector('.sidebar-panel');
      expect(panel).not.toBeNull();

      panel!.setPointerCapture = vi.fn();
      panel!.releasePointerCapture = vi.fn();
      panel!.getBoundingClientRect = vi.fn(
        () =>
          ({
            left: 0,
            right: 390,
            top: 0,
            bottom: 844,
            width: 390,
            height: 844,
            x: 0,
            y: 0,
            toJSON: () => {},
          }) as DOMRect,
      );
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390);

      return panel!;
    }

    function pointerEvent(init: {
      clientX: number;
      clientY?: number;
      pointerId?: number;
      timeStamp?: number;
      target?: EventTarget;
    }): PointerEvent {
      return {
        button: 0,
        clientX: init.clientX,
        clientY: init.clientY ?? 0,
        pointerId: init.pointerId ?? 1,
        timeStamp: init.timeStamp ?? 0,
        target: init.target ?? getPanel(),
        preventDefault: vi.fn(),
      } as unknown as PointerEvent;
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should close after a full-width left-edge right swipe crosses the distance threshold', () => {
      const panel = getPanel();

      component.onSidebarPointerDown(pointerEvent({ clientX: 8, target: panel }));
      component.onSidebarPointerMove(pointerEvent({ clientX: 150, target: panel, timeStamp: 80 }));
      component.onSidebarPointerUp(pointerEvent({ clientX: 150, target: panel, timeStamp: 120 }));

      expect(mockSidebarService.closeSidebar).toHaveBeenCalled();
    });

    it('should snap back and keep the sidebar open after a short drag', () => {
      const panel = getPanel();

      component.onSidebarPointerDown(pointerEvent({ clientX: 8, target: panel }));
      component.onSidebarPointerMove(pointerEvent({ clientX: 24, target: panel, timeStamp: 80 }));
      component.onSidebarPointerUp(pointerEvent({ clientX: 24, target: panel, timeStamp: 140 }));

      expect(mockSidebarService.closeSidebar).not.toHaveBeenCalled();
      expect(component.swipeTransform()).toBeNull();
      expect(component.isSwipeDragging()).toBe(false);
    });

    it('should ignore vertical drags', () => {
      const panel = getPanel();

      component.onSidebarPointerDown(pointerEvent({ clientX: 8, clientY: 0, target: panel }));
      component.onSidebarPointerMove(
        pointerEvent({ clientX: 14, clientY: 80, target: panel, timeStamp: 80 }),
      );
      component.onSidebarPointerUp(
        pointerEvent({ clientX: 14, clientY: 80, target: panel, timeStamp: 120 }),
      );

      expect(mockSidebarService.closeSidebar).not.toHaveBeenCalled();
    });

    it('should ignore gestures when the sidebar is not full viewport width', () => {
      const panel = getPanel();
      panel.getBoundingClientRect = vi.fn(
        () =>
          ({
            left: 0,
            right: 320,
            top: 0,
            bottom: 844,
            width: 320,
            height: 844,
            x: 0,
            y: 0,
            toJSON: () => {},
          }) as DOMRect,
      );
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390);

      component.onSidebarPointerDown(pointerEvent({ clientX: 8, target: panel }));
      component.onSidebarPointerMove(pointerEvent({ clientX: 180, target: panel, timeStamp: 80 }));
      component.onSidebarPointerUp(pointerEvent({ clientX: 180, target: panel, timeStamp: 120 }));

      expect(mockSidebarService.closeSidebar).not.toHaveBeenCalled();
    });

    it('should ignore gestures that start outside the left edge zone', () => {
      const panel = getPanel();

      component.onSidebarPointerDown(pointerEvent({ clientX: 40, target: panel }));
      component.onSidebarPointerMove(pointerEvent({ clientX: 180, target: panel, timeStamp: 80 }));
      component.onSidebarPointerUp(pointerEvent({ clientX: 180, target: panel, timeStamp: 120 }));

      expect(mockSidebarService.closeSidebar).not.toHaveBeenCalled();
    });

    it('should ignore gestures that start on interactive controls', () => {
      const panel = getPanel();
      const button = document.createElement('button');
      panel.appendChild(button);

      component.onSidebarPointerDown(pointerEvent({ clientX: 8, target: button }));
      component.onSidebarPointerMove(pointerEvent({ clientX: 180, target: button, timeStamp: 80 }));
      component.onSidebarPointerUp(pointerEvent({ clientX: 180, target: button, timeStamp: 120 }));

      expect(mockSidebarService.closeSidebar).not.toHaveBeenCalled();
    });
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

    it('should fallback to default order when no comments loaded', () => {
      component.allComments.set([]);
      mockCommentSortService.sortOrder.set('newest');
      const sortedIds = component.sortedCommentIds();
      expect(sortedIds).toEqual([1, 2, 3]); // Falls back to item kids
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
      expect(component.allComments()).toEqual([]);
      expect(component.commentsLoading()).toBe(false);
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

    it('should fallback to default order on error', () => {
      mockHnService.getStoryTopLevelComments.mockReturnValue(
        throwError(() => new Error('Test error')),
      );

      component.item.set(mockItem);
      mockCommentSortService.sortOrder.set('popular');
      component.onSortChange('popular');

      expect(mockCommentSortService.setSortOrder).toHaveBeenCalledWith('default');
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
      (mockSidebarService.currentItemId as Mock).mockReturnValue(456);

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
      (mockSidebarService.currentItemId as Mock).mockReturnValue(789);

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
      (mockSidebarService.currentItemId as Mock).mockReturnValue(999);

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
  });
});
