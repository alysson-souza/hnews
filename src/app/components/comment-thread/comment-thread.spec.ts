// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManagerService } from '../../services/cache-manager.service';
import { HackernewsService } from '../../services/hackernews.service';
import { HNItem, HNItemType } from '../../models/hn';

import { CommentThread } from './comment-thread';

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

describe('CommentThread', () => {
  let component: CommentThread;
  let fixture: ComponentFixture<CommentThread>;
  let mockHnService: { getItem: ReturnType<typeof vi.fn>; getItemsPage: ReturnType<typeof vi.fn> };

  // Test data
  const mockComment: HNItem = {
    id: 123,
    by: 'testuser',
    time: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    text: 'This is a test comment',
    kids: [456, 789],
    deleted: false,
    type: 'comment',
  };

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

  beforeEach(async () => {
    // Create spy object for HackernewsService
    mockHnService = {
      getItem: vi.fn(),
      getItemsPage: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CommentThread],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]), // Provide an empty router configuration
        { provide: HackernewsService, useValue: mockHnService },
        { provide: CacheManagerService, useClass: MockCacheManagerService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentThread);
    component = fixture.componentInstance;

    // Provide required inputs
    component.commentId = 123;
    component.depth = 0;

    // Mock the service methods to prevent actual HTTP calls
    mockHnService.getItem.mockReturnValue(of(null));
    mockHnService.getItemsPage.mockReturnValue(of([]));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('Constructor', () => {
    it('should load voted comments from localStorage on init', () => {
      const votedIds = [123, 456, 789];
      // Spy on Storage.prototype so it captures calls from component constructor
      const getSpy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(JSON.stringify(votedIds));

      // Create a new instance through TestBed to maintain injection context
      const newFixture = TestBed.createComponent(CommentThread);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.votedComments()).toEqual(new Set(votedIds));
      expect(getSpy).toHaveBeenCalledWith('votedComments');
    });

    it('should handle missing localStorage data gracefully', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      // Create a new instance through TestBed to maintain injection context
      const newFixture = TestBed.createComponent(CommentThread);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.votedComments()).toEqual(new Set());
    });
  });

  describe('Computed Properties', () => {
    describe('hasVoted', () => {
      it('should return false when comment is not loaded', () => {
        expect(component.hasVoted()).toBe(false);
      });

      it('should return false when comment is not in votedComments', () => {
        component.comment.set(mockComment);
        expect(component.hasVoted()).toBe(false);
      });

      it('should return true when comment is in votedComments', () => {
        component.comment.set(mockComment);
        component.votedComments.set(new Set([123]));
        expect(component.hasVoted()).toBe(true);
      });
    });

    describe('shouldAutoCollapse', () => {
      it('should return falsy when comment is not loaded', () => {
        expect(component.shouldAutoCollapse()).toBeFalsy();
      });

      it('should return falsy when comment has fewer kids than threshold', () => {
        const commentWithFewKids = { ...mockComment, kids: [1, 2, 3, 4, 5] }; // 5 kids, threshold is 10
        component.comment.set(commentWithFewKids);
        expect(component.shouldAutoCollapse()).toBe(false);
      });

      it('should return truthy when comment has more kids than threshold', () => {
        const kidsArray = Array.from({ length: 15 }, (_, i) => i); // 15 kids
        const commentWithManyKids = { ...mockComment, kids: kidsArray };
        component.comment.set(commentWithManyKids);
        expect(component.shouldAutoCollapse()).toBe(true);
      });
    });

    describe('totalRepliesCount', () => {
      it('should return 0 when comment is not loaded', () => {
        expect(component.totalRepliesCount()).toBe(0);
      });

      it('should return the correct number of replies', () => {
        component.comment.set(mockComment);
        expect(component.totalRepliesCount()).toBe(2);
      });
    });

    describe('showExpandButton', () => {
      it('should return false when there are no replies', () => {
        const commentWithoutKids = { ...mockComment, kids: [] };
        component.comment.set(commentWithoutKids);
        component.repliesLoaded.set(false);
        expect(component.showExpandButton()).toBe(false);
      });

      it('should return true when there are replies and they are not loaded', () => {
        component.comment.set(mockComment);
        component.repliesLoaded.set(false);
        expect(component.showExpandButton()).toBe(true);
      });

      it('should return false when replies are already loaded', () => {
        component.comment.set(mockComment);
        component.repliesLoaded.set(true);
        expect(component.showExpandButton()).toBe(false);
      });
    });

    describe('showLoadButton', () => {
      it('should return false when not lazy loading', () => {
        component.lazyLoad = false;
        component.commentLoaded.set(false);
        expect(component.showLoadButton()).toBe(false);
      });

      it('should return true when lazy loading and comment is not loaded', () => {
        component.lazyLoad = true;
        component.commentLoaded.set(false);
        expect(component.showLoadButton()).toBe(true);
      });

      it('should return false when lazy loading but comment is already loaded', () => {
        component.lazyLoad = true;
        component.commentLoaded.set(true);
        expect(component.showLoadButton()).toBe(false);
      });
    });

    describe('currentPageValue', () => {
      it('should return the current page value', () => {
        expect(component.currentPageValue).toBe(0);
      });
    });

    describe('remainingRepliesCount', () => {
      it('should calculate the remaining replies count correctly', () => {
        component.allKidsIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        // With pageSize=10 and currentPage=0, should have 2 remaining
        expect(component.remainingRepliesCount).toBe(2);
      });

      it('should return 0 when no more replies', () => {
        component.allKidsIds = [1, 2, 3];
        // With pageSize=10 and only 3 items, all fit on first page
        expect(component.remainingRepliesCount).toBe(0);
      });
    });
  });

  describe('ngOnInit', () => {
    it('should hydrate from initial comment when provided', () => {
      component.initialComment = mockComment;

      component.ngOnInit();

      // Verify the effects of hydrateFromInitial
      expect(component.comment()).toEqual(mockComment);
      expect(component.commentLoaded()).toBe(true);
      expect(component.loading()).toBe(false);
    });

    it('should load comment when not lazy loading and no initial comment', () => {
      component.lazyLoad = false;
      component.initialComment = undefined;
      vi.spyOn(component, 'loadComment');

      component.ngOnInit();

      expect(component.loadComment).toHaveBeenCalled();
    });

    it('should not load comment when lazy loading', () => {
      component.lazyLoad = true;
      component.initialComment = undefined;

      component.ngOnInit();

      expect(component.loading()).toBe(false);
    });
  });

  describe('loadComment', () => {
    it('should load comment from service and set loading states', () => {
      mockHnService.getItem.mockReturnValue(of(mockComment));

      component.loadComment();

      expect(mockHnService.getItem).toHaveBeenCalledWith(123);
    });

    it('should handle successful comment load', () => {
      mockHnService.getItem.mockReturnValue(of(mockComment));

      component.loadComment();

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      expect(component.comment()).toEqual(mockComment);
      expect(component.commentLoaded()).toBe(true);
      expect(component.loading()).toBe(false);
      expect(component.allKidsIds).toEqual(mockComment.kids!);
    });

    it('should handle deleted comment', () => {
      const deletedComment = { ...mockComment, deleted: true };
      mockHnService.getItem.mockReturnValue(of(deletedComment));

      component.loadComment();

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
      expect(component.comment()).toBeNull();
    });

    it('should handle service error', () => {
      mockHnService.getItem.mockReturnValue(throwError(() => new Error('Failed to load')));

      component.loadComment();

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
    });
  });

  describe('loadRepliesPage', () => {
    beforeEach(() => {
      component.allKidsIds = [456, 789];
    });

    it('should load first page of replies and call service with correct args', () => {
      mockHnService.getItemsPage.mockReturnValue(of(mockReplies));

      component.loadRepliesPage(0);

      // With synchronous emissions, flags settle back to false immediately
      expect(component.loadingReplies()).toBe(false);
      expect(component.loadingMore()).toBe(false);
      expect(mockHnService.getItemsPage).toHaveBeenCalledWith([456, 789], 0, 10);
    });

    it('should load subsequent page of replies and call service with correct args', () => {
      mockHnService.getItemsPage.mockReturnValue(of([mockReplies[1]]));

      component.loadRepliesPage(1);

      // With synchronous emissions, flags settle back to false immediately
      expect(component.loadingMore()).toBe(false);
      expect(component.loadingReplies()).toBe(false);
      expect(mockHnService.getItemsPage).toHaveBeenCalledWith([456, 789], 1, 10);
    });

    it('should handle successful replies load for first page', () => {
      mockHnService.getItemsPage.mockReturnValue(of(mockReplies));

      component.loadRepliesPage(0);

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      expect(component.replies()).toEqual(mockReplies);
      expect(component.repliesLoaded()).toBe(true);
      expect(component.currentPageValue).toBe(0);
      expect(component.loadingReplies()).toBe(false);
    });

    it('should handle successful replies load for subsequent pages', () => {
      component.replies.set([mockReplies[0]]);
      mockHnService.getItemsPage.mockReturnValue(of([mockReplies[1]]));

      component.loadRepliesPage(1);

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      // Verify replies are appended
      expect(component.replies().length).toBe(2);
      expect(component.currentPageValue).toBe(1);
      expect(component.loadingMore()).toBe(false);
    });

    it('should handle service error when loading replies', () => {
      mockHnService.getItemsPage.mockReturnValue(throwError(() => new Error('Failed to load')));

      component.loadRepliesPage(0);

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      expect(component.loadingReplies()).toBe(false);
      expect(component.loadingMore()).toBe(false);
    });

    it('should update hasMoreReplies signal correctly', () => {
      // Set up more kids than one page
      component.allKidsIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const firstPage: HNItem[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => ({
        id,
        by: `user${id}`,
        time: Math.floor(Date.now() / 1000) - id * 100,
        text: `Reply ${id}`,
        type: 'comment' as HNItemType,
      }));

      mockHnService.getItemsPage.mockReturnValue(of(firstPage));

      component.loadRepliesPage(0);

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      expect(component.hasMoreReplies()).toBe(true);
    });
  });

  describe('loadMoreReplies', () => {
    it('should load next page when there are more replies', () => {
      vi.spyOn(component, 'loadRepliesPage');
      // Access the private currentPage signal directly
      component['currentPage'].set(0);
      component.hasMoreReplies.set(true);
      component.loadingMore.set(false);

      component.loadMoreReplies();

      expect(component.loadRepliesPage).toHaveBeenCalledWith(1);
    });

    it('should not load next page when already loading', () => {
      vi.spyOn(component, 'loadRepliesPage');
      component.hasMoreReplies.set(true);
      component.loadingMore.set(true);

      component.loadMoreReplies();

      expect(component.loadRepliesPage).not.toHaveBeenCalled();
    });

    it('should not load next page when no more replies', () => {
      vi.spyOn(component, 'loadRepliesPage');
      component.hasMoreReplies.set(false);

      component.loadMoreReplies();

      expect(component.loadRepliesPage).not.toHaveBeenCalled();
    });
  });

  describe('expandReplies', () => {
    it('should load first page of replies when not loaded and not loading', () => {
      vi.spyOn(component, 'loadRepliesPage');
      component.repliesLoaded.set(false);
      component.loadingReplies.set(false);

      component.expandReplies();

      expect(component.loadRepliesPage).toHaveBeenCalledWith(0);
    });

    it('should not load replies when already loaded', () => {
      vi.spyOn(component, 'loadRepliesPage');
      component.repliesLoaded.set(true);

      component.expandReplies();

      expect(component.loadRepliesPage).not.toHaveBeenCalled();
    });

    it('should not load replies when already loading', () => {
      vi.spyOn(component, 'loadRepliesPage');
      component.repliesLoaded.set(false);
      component.loadingReplies.set(true);

      component.expandReplies();

      expect(component.loadRepliesPage).not.toHaveBeenCalled();
    });
  });

  describe('toggleCollapse', () => {
    it('should toggle the collapse state', () => {
      // Initially false
      expect(component.isCollapsed()).toBe(false);

      component.toggleCollapse();
      expect(component.isCollapsed()).toBe(true);

      component.toggleCollapse();
      expect(component.isCollapsed()).toBe(false);
    });
  });

  describe('upvoteComment', () => {
    it('should add comment to votedComments and save to localStorage', () => {
      component.comment.set(mockComment);
      component.votedComments.set(new Set([456]));
      const setSpy = vi.spyOn(Storage.prototype, 'setItem');

      component.upvoteComment();

      expect(component.votedComments()).toEqual(new Set([456, 123]));
      expect(setSpy).toHaveBeenCalledWith('votedComments', '[456,123]');
    });

    it('should not upvote if comment is already voted', () => {
      component.comment.set(mockComment);
      component.votedComments.set(new Set([123]));
      const setSpy = vi.spyOn(Storage.prototype, 'setItem');

      component.upvoteComment();

      // Should not change the set
      expect(component.votedComments()).toEqual(new Set([123]));
      expect(setSpy).not.toHaveBeenCalled();
    });

    it('should not upvote if comment is not loaded', () => {
      component.comment.set(null);
      component.votedComments.set(new Set());
      const setSpy = vi.spyOn(Storage.prototype, 'setItem');

      component.upvoteComment();

      expect(component.votedComments()).toEqual(new Set());
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('hasVotedById', () => {
    it('should return false when id is not in votedComments', () => {
      component.votedComments.set(new Set([123, 456]));
      expect(component.hasVotedById(789)).toBe(false);
    });

    it('should return true when id is in votedComments', () => {
      component.votedComments.set(new Set([123, 456]));
      expect(component.hasVotedById(456)).toBe(true);
    });
  });

  describe('upvoteById', () => {
    it('should add id to votedComments and save to localStorage', () => {
      component.votedComments.set(new Set([123]));
      const setSpy = vi.spyOn(Storage.prototype, 'setItem');

      component.upvoteById(456);

      expect(component.votedComments()).toEqual(new Set([123, 456]));
      expect(setSpy).toHaveBeenCalledWith('votedComments', '[123,456]');
    });

    it('should not add id if already in votedComments', () => {
      component.votedComments.set(new Set([123, 456]));
      const setSpy = vi.spyOn(Storage.prototype, 'setItem');

      component.upvoteById(456);

      // Should not change the set
      expect(component.votedComments()).toEqual(new Set([123, 456]));
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('getTimeAgo', () => {
    it('should return "just now" for recent timestamps', () => {
      const recentTimestamp = Math.floor(Date.now() / 1000) - 10; // 10 seconds ago
      expect(component.getTimeAgo(recentTimestamp)).toBe('just now');
    });

    it('should return minutes ago for timestamps within an hour', () => {
      const minutesAgo = Math.floor(Date.now() / 1000) - 120; // 2 minutes ago
      expect(component.getTimeAgo(minutesAgo)).toBe('2 minutes ago');
    });

    it('should return hours ago for timestamps within a day', () => {
      const hoursAgo = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
      expect(component.getTimeAgo(hoursAgo)).toBe('2 hours ago');
    });

    it('should return days ago for timestamps beyond a day', () => {
      const daysAgo = Math.floor(Date.now() / 1000) - 172800; // 2 days ago
      expect(component.getTimeAgo(daysAgo)).toBe('2 days ago');
    });
  });

  describe('getIndentClass', () => {
    it('should return correct margin class for depth 0', () => {
      component.depth = 0;
      expect(component.getIndentClass()).toBe('ml-0');
    });

    it('should return correct margin class for depth 3', () => {
      component.depth = 3;
      expect(component.getIndentClass()).toBe('ml-12');
    });

    it('should cap indentation at depth 8', () => {
      component.depth = 10;
      expect(component.getIndentClass()).toBe('ml-32');
    });
  });
});
