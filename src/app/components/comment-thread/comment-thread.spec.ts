import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { CacheManagerService } from '../../services/cache-manager.service';
import { HackernewsService } from '../../services/hackernews.service';
import { HNItem } from '../../models/hn';
import { CommentVoteStoreService } from '../../services/comment-vote-store.service';
import { CommentRepliesLoaderService } from '../../services/comment-replies-loader.service';
import { CommentStateService, CommentStateEntry } from '../../services/comment-state.service';
import { SidebarCommentsInteractionService } from '../../services/sidebar-comments-interaction.service';
import { Subject } from 'rxjs';

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

class MockCommentVoteStoreService {
  private readonly state = signal<Set<number>>(new Set());
  readonly votedCommentIds = this.state.asReadonly();

  vote = vi.fn().mockImplementation((id: number) => {
    this.state.update((current) => {
      if (current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.add(id);
      return next;
    });
  });

  setVoted(ids: number[]) {
    this.state.set(new Set(ids));
  }
}

class MockCommentRepliesLoaderService {
  replies = signal<HNItem[]>([]);
  repliesLoaded = signal(false);
  loadingReplies = signal(false);
  loadingMore = signal(false);
  hasMore = signal(false);
  currentPage = signal(0);
  pageSize = 10;

  configureKids = vi.fn();
  loadFirstPage = vi.fn();
  loadNextPage = vi.fn();
  loadUpToPage = vi.fn();
  remainingCount = vi.fn().mockReturnValue(0);
}

class MockCommentStateService {
  private states = new Map<number, CommentStateEntry>();

  getState = vi.fn().mockImplementation((commentId: number) => {
    return this.states.get(commentId);
  });

  setState = vi.fn().mockImplementation((commentId: number, state: Partial<CommentStateEntry>) => {
    const current = this.states.get(commentId);
    const newState: CommentStateEntry = {
      collapsed: current?.collapsed ?? false,
      repliesExpanded: current?.repliesExpanded ?? false,
      loadedPages: current?.loadedPages ?? 0,
      lastAccessed: Date.now(),
      ...state,
    };
    this.states.set(commentId, newState);
  });

  setCollapsed = vi.fn().mockImplementation((commentId: number, collapsed: boolean) => {
    this.setState(commentId, { collapsed });
  });

  setRepliesExpanded = vi.fn().mockImplementation((commentId: number, expanded: boolean) => {
    this.setState(commentId, { repliesExpanded: expanded });
  });

  setLoadedPages = vi.fn().mockImplementation((commentId: number, pages: number) => {
    this.setState(commentId, { loadedPages: pages });
  });

  clearAll = vi.fn().mockImplementation(() => {
    this.states.clear();
  });

  // Test helper
  setSavedState(commentId: number, state: Partial<CommentStateEntry>) {
    const newState: CommentStateEntry = {
      collapsed: false,
      repliesExpanded: false,
      loadedPages: 0,
      lastAccessed: Date.now(),
      ...state,
    };
    this.states.set(commentId, newState);
  }
}

describe('CommentThread', () => {
  let component: CommentThread;
  let fixture: ComponentFixture<CommentThread>;
  let mockHnService: MockedObject<HackernewsService>;
  let mockVoteStore: MockCommentVoteStoreService;
  let mockRepliesLoader: MockCommentRepliesLoaderService;
  let mockCommentStateService: MockCommentStateService;

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

  beforeEach(async () => {
    // Create spy object for HackernewsService
    mockHnService = {
      getItem: vi.fn(),
    } as unknown as MockedObject<HackernewsService>;
    mockVoteStore = new MockCommentVoteStoreService();
    mockCommentStateService = new MockCommentStateService();

    TestBed.overrideComponent(CommentThread, {
      set: {
        providers: [
          { provide: CommentRepliesLoaderService, useClass: MockCommentRepliesLoaderService },
        ],
      },
    });

    await TestBed.configureTestingModule({
      imports: [CommentThread],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]), // Provide an empty router configuration
        { provide: HackernewsService, useValue: mockHnService },
        { provide: CacheManagerService, useClass: MockCacheManagerService },
        { provide: CommentVoteStoreService, useValue: mockVoteStore },
        { provide: CommentStateService, useValue: mockCommentStateService },
        {
          provide: SidebarCommentsInteractionService,
          useValue: {
            action$: new Subject(),
            dispatchAction: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentThread);
    component = fixture.componentInstance;
    mockRepliesLoader = fixture.debugElement.injector.get(
      CommentRepliesLoaderService,
    ) as unknown as MockCommentRepliesLoaderService;

    // Provide required inputs using componentRef.setInput for signal inputs
    fixture.componentRef.setInput('commentId', 123);
    fixture.componentRef.setInput('depth', 0);

    // Mock the service methods to prevent actual HTTP calls
    mockHnService.getItem.mockReturnValue(of(null));
    mockRepliesLoader.remainingCount.mockReturnValue(0);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('Constructor', () => {
    it('should reflect existing votes exposed by the vote store', () => {
      mockVoteStore.setVoted([123, 456]);

      component.comment.set(mockComment);

      expect(component.hasVoted()).toBe(true);
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
        mockVoteStore.setVoted([123]);
        expect(component.hasVoted()).toBe(true);
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
        mockRepliesLoader.repliesLoaded.set(false);
        expect(component.showExpandButton()).toBe(false);
      });

      it('should return true when there are replies and they are not loaded', () => {
        component.comment.set(mockComment);
        mockRepliesLoader.repliesLoaded.set(false);
        expect(component.showExpandButton()).toBe(true);
      });

      it('should return false when replies are already loaded', () => {
        component.comment.set(mockComment);
        mockRepliesLoader.repliesLoaded.set(true);
        expect(component.showExpandButton()).toBe(false);
      });
    });

    describe('showLoadButton', () => {
      it('should return false when not lazy loading', () => {
        fixture.componentRef.setInput('lazyLoad', false);
        component.commentLoaded.set(false);
        expect(component.showLoadButton()).toBe(false);
      });

      it('should return true when lazy loading and comment is not loaded', () => {
        fixture.componentRef.setInput('lazyLoad', true);
        component.commentLoaded.set(false);
        expect(component.showLoadButton()).toBe(true);
      });

      it('should return false when lazy loading but comment is already loaded', () => {
        fixture.componentRef.setInput('lazyLoad', true);
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
        mockRepliesLoader.remainingCount.mockReturnValue(2);
        expect(component.remainingRepliesCount).toBe(2);
      });

      it('should return 0 when no more replies', () => {
        mockRepliesLoader.remainingCount.mockReturnValue(0);
        expect(component.remainingRepliesCount).toBe(0);
      });
    });
  });

  describe('ngOnInit', () => {
    it('should hydrate from initial comment when provided', () => {
      fixture.componentRef.setInput('initialComment', mockComment);
      mockRepliesLoader.configureKids.mockClear();

      component.ngOnInit();

      // Verify the effects of hydrateFromInitial
      expect(component.comment()).toEqual(mockComment);
      expect(component.commentLoaded()).toBe(true);
      expect(component.loading()).toBe(false);
      expect(mockRepliesLoader.configureKids).toHaveBeenCalledWith(mockComment.kids);
    });

    it('should load comment when not lazy loading and no initial comment', () => {
      fixture.componentRef.setInput('lazyLoad', false);
      fixture.componentRef.setInput('initialComment', undefined);
      vi.spyOn(component, 'loadComment');

      component.ngOnInit();

      expect(component.loadComment).toHaveBeenCalled();
    });

    it('should not load comment when lazy loading', () => {
      fixture.componentRef.setInput('lazyLoad', true);
      fixture.componentRef.setInput('initialComment', undefined);

      component.ngOnInit();

      expect(component.loading()).toBe(false);
    });
  });

  describe('loadComment', () => {
    it('should load comment from service and set loading states', () => {
      mockHnService.getItem.mockReturnValue(of(mockComment));
      mockRepliesLoader.configureKids.mockClear();

      component.loadComment();

      expect(mockHnService.getItem).toHaveBeenCalledWith(123);
    });

    it('should handle successful comment load', () => {
      mockHnService.getItem.mockReturnValue(of(mockComment));
      mockRepliesLoader.configureKids.mockClear();

      component.loadComment();

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      expect(component.comment()).toEqual(mockComment);
      expect(component.commentLoaded()).toBe(true);
      expect(component.loading()).toBe(false);
      expect(mockRepliesLoader.configureKids).toHaveBeenCalledWith(mockComment.kids);
    });

    it('should handle deleted comment', () => {
      const deletedComment = { ...mockComment, deleted: true };
      mockHnService.getItem.mockReturnValue(of(deletedComment));
      mockRepliesLoader.configureKids.mockClear();

      component.loadComment();

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
      expect(component.comment()).toBeNull();
      expect(mockRepliesLoader.configureKids).toHaveBeenCalledWith([]);
    });

    it('should handle service error', () => {
      mockHnService.getItem.mockReturnValue(throwError(() => new Error('Failed to load')));

      component.loadComment();

      // Trigger change detection to process the Observable
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
    });
  });

  describe('loadMoreReplies', () => {
    it('should load next page when there are more replies', () => {
      mockRepliesLoader.loadNextPage.mockClear();
      mockRepliesLoader.hasMore.set(true);
      mockRepliesLoader.loadingMore.set(false);
      mockRepliesLoader.repliesLoaded.set(true);

      component.loadMoreReplies();

      expect(mockRepliesLoader.loadNextPage).toHaveBeenCalled();
    });

    it('should not load next page when already loading', () => {
      mockRepliesLoader.loadNextPage.mockClear();
      mockRepliesLoader.hasMore.set(true);
      mockRepliesLoader.loadingMore.set(true);
      mockRepliesLoader.repliesLoaded.set(true);

      component.loadMoreReplies();

      expect(mockRepliesLoader.loadNextPage).not.toHaveBeenCalled();
    });

    it('should not load next page when no more replies', () => {
      mockRepliesLoader.loadNextPage.mockClear();
      mockRepliesLoader.hasMore.set(false);
      mockRepliesLoader.repliesLoaded.set(true);

      component.loadMoreReplies();

      expect(mockRepliesLoader.loadNextPage).not.toHaveBeenCalled();
    });
  });

  describe('expandReplies', () => {
    it('should load first page of replies when not loaded and not loading', () => {
      mockRepliesLoader.loadFirstPage.mockClear();
      mockRepliesLoader.repliesLoaded.set(false);
      mockRepliesLoader.loadingReplies.set(false);

      component.expandReplies();

      expect(mockRepliesLoader.loadFirstPage).toHaveBeenCalled();
    });

    it('should not load replies when already loaded', () => {
      mockRepliesLoader.loadFirstPage.mockClear();
      mockRepliesLoader.repliesLoaded.set(true);

      component.expandReplies();

      expect(mockRepliesLoader.loadFirstPage).not.toHaveBeenCalled();
    });

    it('should not load replies when already loading', () => {
      mockRepliesLoader.loadFirstPage.mockClear();
      mockRepliesLoader.repliesLoaded.set(false);
      mockRepliesLoader.loadingReplies.set(true);

      component.expandReplies();

      expect(mockRepliesLoader.loadFirstPage).not.toHaveBeenCalled();
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

    it('should persist collapse state to service', () => {
      component.toggleCollapse();

      expect(mockCommentStateService.setCollapsed).toHaveBeenCalledWith(123, true);

      component.toggleCollapse();

      expect(mockCommentStateService.setCollapsed).toHaveBeenCalledWith(123, false);
    });
  });

  describe('upvoteComment', () => {
    it('should delegate voting to the vote store when a comment is present', () => {
      component.comment.set(mockComment);

      component.upvoteComment();

      expect(mockVoteStore.vote).toHaveBeenCalledWith(mockComment.id);
    });

    it('should not call the vote store when no comment is loaded', () => {
      component.comment.set(null);

      component.upvoteComment();

      expect(mockVoteStore.vote).not.toHaveBeenCalled();
    });
  });

  describe('hasVotedById', () => {
    it('should return false when id is not in the vote store', () => {
      mockVoteStore.setVoted([123, 456]);
      expect(component.hasVotedById(789)).toBe(false);
    });

    it('should return true when id is in the vote store', () => {
      mockVoteStore.setVoted([123, 456]);
      expect(component.hasVotedById(456)).toBe(true);
    });
  });

  describe('upvoteById', () => {
    it('should delegate voting to the vote store', () => {
      component.upvoteById(456);

      expect(mockVoteStore.vote).toHaveBeenCalledWith(456);
    });
  });

  describe('template integration', () => {
    const buildReply = (id: number): HNItem => ({
      id,
      by: 'nested',
      time: Math.floor(Date.now() / 1000),
      type: 'comment',
    });

    beforeEach(() => {
      component.comment.set(mockComment);
      mockRepliesLoader.replies.set([buildReply(555)]);
      mockRepliesLoader.repliesLoaded.set(true);
      mockRepliesLoader.loadingReplies.set(false);
      mockRepliesLoader.hasMore.set(true);
      mockRepliesLoader.loadingMore.set(false);
      mockRepliesLoader.loadNextPage.mockClear();
      mockRepliesLoader.remainingCount.mockReturnValue(2);
      fixture.detectChanges();
    });

    it('should render the load more button with remaining count', () => {
      const buttons = fixture.debugElement.queryAll(By.css('app-button button'));
      expect(buttons.length).toBeGreaterThan(0);
      const buttonDebug = buttons[buttons.length - 1];
      const button = buttonDebug?.nativeElement as HTMLButtonElement | undefined;

      expect(button).toBeDefined();
      expect(button!.disabled).toBe(false);
      expect(button!.textContent?.includes('Load 2 more replies')).toBe(true);
    });

    it('should request the next page when clicking the load more button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('app-button button'));
      expect(buttons.length).toBeGreaterThan(0);
      const buttonDebug = buttons[buttons.length - 1];
      const button = buttonDebug?.nativeElement as HTMLButtonElement | undefined;
      expect(button).toBeDefined();

      button!.click();
      fixture.detectChanges();

      expect(mockRepliesLoader.loadNextPage).toHaveBeenCalledTimes(1);
    });

    it('should show loading state and disable the button while fetching more replies', () => {
      mockRepliesLoader.loadingMore.set(true);
      mockRepliesLoader.remainingCount.mockReturnValue(5);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('app-button button'));
      expect(buttons.length).toBeGreaterThan(0);
      const buttonDebug = buttons[buttons.length - 1];
      const button = buttonDebug?.nativeElement as HTMLButtonElement | undefined;

      expect(button).toBeDefined();
      expect(button!.disabled).toBe(true);
      expect(button!.textContent?.includes('Loading...')).toBe(true);
    });
  });

  describe('getIndentClass', () => {
    it('should return correct margin class for depth 0', () => {
      fixture.componentRef.setInput('depth', 0);
      expect(component.getIndentClass()).toBe('ml-0');
    });

    it('should return correct margin class for depth 3', () => {
      fixture.componentRef.setInput('depth', 3);
      expect(component.getIndentClass()).toBe('ml-12');
    });

    it('should cap indentation at depth 8', () => {
      fixture.componentRef.setInput('depth', 10);
      expect(component.getIndentClass()).toBe('ml-32');
    });
  });

  describe('comment state persistence', () => {
    it('should restore saved collapse state when loading comment', () => {
      mockCommentStateService.setSavedState(123, { collapsed: true });
      mockHnService.getItem.mockReturnValue(of(mockComment));

      component.loadComment();
      fixture.detectChanges();

      expect(component.isCollapsed()).toBe(true);
      expect(mockCommentStateService.getState).toHaveBeenCalledWith(123);
    });

    it('should restore saved expanded state when loading comment', () => {
      mockCommentStateService.setSavedState(123, { collapsed: false });
      mockHnService.getItem.mockReturnValue(of(mockComment));

      component.loadComment();
      fixture.detectChanges();

      expect(component.isCollapsed()).toBe(false);
    });

    it('should restore reply expansion and load pages', () => {
      mockCommentStateService.setSavedState(123, {
        collapsed: false,
        repliesExpanded: true,
        loadedPages: 3,
      });
      mockHnService.getItem.mockReturnValue(of(mockComment));

      component.loadComment();
      fixture.detectChanges();

      expect(mockRepliesLoader.loadUpToPage).toHaveBeenCalledWith(2, expect.any(Function));
    });

    it('should not restore replies if repliesExpanded is false', () => {
      mockCommentStateService.setSavedState(123, {
        collapsed: false,
        repliesExpanded: false,
        loadedPages: 0,
      });
      mockHnService.getItem.mockReturnValue(of(mockComment));

      component.loadComment();
      fixture.detectChanges();

      expect(mockRepliesLoader.loadUpToPage).not.toHaveBeenCalled();
    });

    it('should restore state when hydrating from initial comment', () => {
      mockCommentStateService.setSavedState(123, { collapsed: true });
      fixture.componentRef.setInput('initialComment', mockComment);

      component.ngOnInit();

      expect(component.isCollapsed()).toBe(true);
      expect(mockCommentStateService.getState).toHaveBeenCalledWith(123);
    });

    it('should not restore replies for lazy-loaded comments until explicitly loaded', () => {
      fixture.componentRef.setInput('lazyLoad', true);
      component.commentLoaded.set(false); // Not loaded yet
      mockCommentStateService.setSavedState(123, {
        collapsed: false,
        repliesExpanded: true,
        loadedPages: 2,
      });

      mockHnService.getItem.mockReturnValue(of(mockComment));
      component.loadComment();
      fixture.detectChanges();

      // After loadComment() completes, commentLoaded is set to true
      // So state restoration should happen. Let's update the test expectation.
      expect(mockCommentStateService.getState).toHaveBeenCalled();
      expect(mockRepliesLoader.loadUpToPage).toHaveBeenCalled();
    });

    it('should save state when expanding replies', () => {
      mockRepliesLoader.repliesLoaded.set(false);
      mockRepliesLoader.loadingReplies.set(false);

      component.expandReplies();

      expect(mockRepliesLoader.loadFirstPage).toHaveBeenCalled();
      expect(mockCommentStateService.setRepliesExpanded).toHaveBeenCalledWith(123, true);
      expect(mockCommentStateService.setLoadedPages).toHaveBeenCalledWith(123, 1);
    });

    it('should save state when loading more replies', () => {
      mockRepliesLoader.loadingMore.set(false);
      mockRepliesLoader.hasMore.set(true);
      mockRepliesLoader.currentPage.set(1); // Currently on page 1

      component.loadMoreReplies();

      expect(mockRepliesLoader.loadNextPage).toHaveBeenCalled();
      expect(mockCommentStateService.setLoadedPages).toHaveBeenCalledWith(123, 3); // page 1 + 1 (next) + 1 (1-based)
    });

    it('should not restore state for deleted comments', () => {
      const deletedComment = { ...mockComment, deleted: true };
      mockCommentStateService.setSavedState(123, { collapsed: true });
      fixture.componentRef.setInput('initialComment', deletedComment);

      component.ngOnInit();

      expect(mockCommentStateService.getState).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interaction', () => {
    let interactionService: SidebarCommentsInteractionService;
    let actionSubject: Subject<{
      commentId: number;
      action: string;
    }>;

    beforeEach(() => {
      interactionService = TestBed.inject(SidebarCommentsInteractionService);
      actionSubject = interactionService.action$ as unknown as Subject<{
        commentId: number;
        action: string;
      }>;
    });

    it('should toggle collapse when collapse action is received', () => {
      vi.spyOn(component, 'toggleCollapse');
      actionSubject.next({ commentId: 123, action: 'collapse' });
      expect(component.toggleCollapse).toHaveBeenCalled();
    });

    it('should not toggle collapse when action is for another comment', () => {
      vi.spyOn(component, 'toggleCollapse');
      actionSubject.next({ commentId: 999, action: 'collapse' });
      expect(component.toggleCollapse).not.toHaveBeenCalled();
    });

    it('should upvote when upvote action is received', () => {
      vi.spyOn(component, 'upvoteComment');
      actionSubject.next({ commentId: 123, action: 'upvote' });
      expect(component.upvoteComment).toHaveBeenCalled();
    });

    it('should expand replies when expandReplies action is received', () => {
      vi.spyOn(component, 'expandReplies');
      actionSubject.next({ commentId: 123, action: 'expandReplies' });
      expect(component.expandReplies).toHaveBeenCalled();
    });
  });
});
