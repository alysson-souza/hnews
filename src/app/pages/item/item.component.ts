// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, OnInit, inject, signal, computed, DestroyRef, effect } from '@angular/core';

import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter, finalize, switchMap, take, tap } from 'rxjs/operators';
import { EMPTY, firstValueFrom, of } from 'rxjs';
import { HackernewsService } from '@services/hackernews.service';
import { BulkLoadResult } from '@services/algolia-comment-loader.service';
import { HNItem } from '@models/hn';
import { CommentThread } from '@components/comment-thread/comment-thread';
import { VisitedService } from '@services/visited.service';
import { ScrollService } from '@services/scroll.service';
import { CommentSortService } from '@services/comment-sort.service';
import { CommentDisplayStrategyService } from '@services/comment-display-strategy.service';
import { PageContainerComponent } from '@components/shared/page-container/page-container.component';
import { CardComponent } from '@components/shared/card/card.component';
import { SidebarStorySummaryComponent } from '@components/sidebar-comments/sidebar-story-summary.component';
import { AppButtonComponent } from '@components/shared/app-button/app-button.component';
import {
  CommentSortDropdownComponent,
  CommentSortOrder,
} from '@components/shared/comment-sort-dropdown/comment-sort-dropdown.component';
import { ItemKeyboardNavigationService } from '@services/item-keyboard-navigation.service';
import { CommentThreadIndexService } from '@services/comment-thread-index.service';
import { CommentThreadToolbarComponent } from '@components/comment-tools/comment-thread-toolbar.component';
import { CommentSkeletonComponent } from '@components/comment-skeleton/comment-skeleton.component';
import { NetworkStateService } from '@services/network-state.service';
import { RefreshableRoute, RefreshStatus } from '@models/refresh';

@Component({
  selector: 'app-item',
  imports: [
    CommentThread,
    PageContainerComponent,
    CardComponent,
    SidebarStorySummaryComponent,
    AppButtonComponent,
    CommentSortDropdownComponent,
    CommentThreadToolbarComponent,
    CommentSkeletonComponent,
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.css',
})
export class ItemComponent implements OnInit, RefreshableRoute {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private hnService = inject(HackernewsService);
  private visitedService = inject(VisitedService);
  private scrollService = inject(ScrollService);
  private commentSortService = inject(CommentSortService);
  private commentDisplayStrategy = inject(CommentDisplayStrategyService);
  private itemKeyboardNav = inject(ItemKeyboardNavigationService);
  private commentIndex = inject(CommentThreadIndexService);
  private networkState = inject(NetworkStateService);
  private lastNavigationWasPopstate = false;
  private previousOnline = this.networkState.isOnline();

  item = signal<HNItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  parentDiscussionId = signal<number | null>(null);

  /** True while a background refresh is in progress (keeps existing content visible). */
  refreshing = signal(false);
  /** Bumped after each successful refresh to force Angular to recreate comment threads. */
  refreshToken = signal(0);
  /** Tracks the item ID of the page currently displayed. */
  private currentItemId = signal<number | null>(null);

  // Sorting state - use global service
  sortOrder = this.commentSortService.sortOrder;
  allComments = signal<HNItem[]>([]);
  commentsLoading = signal(false);
  readonly refreshStatus = computed<RefreshStatus>(() => {
    if (this.refreshing()) {
      return 'refreshing';
    }
    return this.loading() || this.commentsLoading() ? 'loading' : 'idle';
  });
  previousVisitedAt = signal<number | null>(null);
  readonly commentSortSkeletonRows = [0, 1, 2] as const;
  private topLevelCommentsLoadedForSort = signal(false);

  // Bulk loading state - stores the result from Algolia bulk load
  private bulkLoadResult = signal<BulkLoadResult | null>(null);

  private readonly commentsPageSize = 10;
  private readonly smallThreadDescendantsThreshold = 40;
  private visibleTopLevelCount = signal(this.commentsPageSize);
  smallThreadMode = signal(false);

  private topLevelCommentsReadyForSort = computed(() => {
    return this.topLevelCommentsLoadedForSort() || this.allComments().length > 0;
  });

  commentsSortPending = computed(() => {
    return (
      this.sortOrder() !== 'default' &&
      (this.item()?.kids?.length ?? 0) > 0 &&
      !this.topLevelCommentsReadyForSort()
    );
  });

  sortedCommentIds = computed(() => {
    if (this.commentsSortPending()) {
      return [];
    }

    const order = this.sortOrder();
    const kids = this.item()?.kids ?? [];

    const comments = this.allComments();
    return this.commentSortService.sortComments(kids, comments, order);
  });

  visibleCommentIds = computed(() => {
    const kids = this.sortedCommentIds();
    const count = Math.min(this.visibleTopLevelCount(), kids.length);
    return kids.slice(0, count);
  });

  hasMoreTopLevelComments = computed(() => {
    if (this.commentsSortPending()) {
      return false;
    }

    const total = this.item()?.kids?.length ?? 0;
    return total > this.visibleCommentIds().length;
  });

  remainingTopLevelCount = computed(() => {
    if (this.commentsSortPending()) {
      return 0;
    }

    const total = this.item()?.kids?.length ?? 0;
    const loaded = this.visibleCommentIds().length;
    const remaining = Math.max(total - loaded, 0);
    return Math.min(this.commentsPageSize, remaining);
  });

  constructor() {
    // Auto-refresh when connectivity is restored, mirroring StoryListStore behaviour.
    effect(() => {
      const online = this.networkState.isOnline();
      if (online && !this.previousOnline) {
        this.refresh();
      }
      this.previousOnline = online;
    });
  }

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.lastNavigationWasPopstate = event.navigationTrigger === 'popstate';
      });

    // Check for both path params and query params (HN compatibility)
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadItem(+id);
      } else {
        // Check query params for HN-style URLs (?id=123)
        this.route.queryParams.subscribe((queryParams) => {
          const queryId = queryParams['id'];
          if (queryId) {
            this.loadItem(+queryId);
          }
        });
      }
    });
  }

  loadItem(id?: number) {
    const itemId = id || +this.route.snapshot.params['id'];
    if (!itemId) {
      this.error.set('Invalid item ID');
      this.loading.set(false);
      return;
    }

    this.currentItemId.set(itemId);
    const inheritedPreviousVisitedAt = this.getInheritedPreviousVisitedAt(itemId);

    this.loading.set(true);
    this.error.set(null);
    this.visibleTopLevelCount.set(this.commentsPageSize);
    this.smallThreadMode.set(false);

    // Reset cached comments (but keep sort order global)
    this.allComments.set([]);
    this.commentsLoading.set(false);
    this.topLevelCommentsLoadedForSort.set(false);
    this.bulkLoadResult.set(null);
    this.itemKeyboardNav.clearSelection();
    this.previousVisitedAt.set(null);
    this.parentDiscussionId.set(null);
    this.commentIndex.clearContext('item');

    // Use Algolia bulk loading for stories with comments
    // This fetches the story AND all comments in a single request
    this.loadWithAlgoliaBulk(itemId, inheritedPreviousVisitedAt);
  }

  /**
   * Load item using Algolia bulk API - fetches story and ALL comments in ONE request.
   * This is a major performance optimization: instead of N+1 requests, we make 1.
   *
   * The bulk load pre-populates the cache, so subsequent getItem() calls
   * from CommentThread components are instant cache hits.
   *
   * When `isRefresh` is true the existing content stays visible; only `refreshToken`
   * is bumped on success so Angular recreates the comment threads with fresh data.
   */
  private loadWithAlgoliaBulk(
    itemId: number,
    inheritedPreviousVisitedAt: number | null,
    isRefresh = false,
  ) {
    this.hnService
      .getStoryWithAllComments(itemId)
      .pipe(
        catchError(() => of(null)),
        switchMap((result) => {
          if (result) {
            // Algolia bulk load succeeded
            this.bulkLoadResult.set(result);
            this.item.set(result.story);
            this.resolveParentDiscussion(result.story, itemId);

            // Only recompute display strategy on a full load; a refresh preserves
            // the existing pagination / small-thread-mode the user may have changed.
            if (!isRefresh) {
              this.applyCommentDisplayStrategy(result.story);
            }

            // Pre-populate allComments for sorting (top-level only)
            const topLevelComments = this.getTopLevelCommentsFromBulkResult(result);
            this.allComments.set(topLevelComments);
            this.topLevelCommentsLoadedForSort.set(true);

            // On refresh keep the existing previousVisitedAt so unread badges remain
            // relative to the original page open time.
            const previousVisitedAt = isRefresh
              ? this.previousVisitedAt()
              : this.getPreviousCommentsVisitedAt(result.story.id, inheritedPreviousVisitedAt);
            if (!isRefresh) {
              this.previousVisitedAt.set(previousVisitedAt);
            }
            this.commentIndex.configureContext('item', result.story, {
              comments: Array.from(result.commentsMap.values()),
              previousVisitedAt,
            });

            this.visitedService.markCommentsVisited(
              result.story.id,
              this.getCommentCountForVisit(result.story),
            );

            if (isRefresh) {
              // Bump the token so the @for track expression rebuilds comment threads,
              // forcing them to re-read the fresh cache data.
              this.refreshToken.update((n) => n + 1);
            }

            this.handleLoadSuccess(isRefresh);
            return EMPTY;
          }

          // Algolia failed, fall back to Firebase API within the same lifecycle.
          const fallbackItem$ = isRefresh
            ? this.hnService.getItem(itemId, true)
            : this.hnService.getItem(itemId);
          return fallbackItem$.pipe(
            take(1),
            tap((item) => {
              if (!item) {
                this.error.set('Item not found');
                return;
              }

              this.item.set(item);
              this.resolveParentDiscussion(item, itemId);
              if (!isRefresh) {
                this.applyCommentDisplayStrategy(item);
              }
              const previousVisitedAt = isRefresh
                ? this.previousVisitedAt()
                : this.getPreviousCommentsVisitedAt(item.id, inheritedPreviousVisitedAt);
              if (!isRefresh) {
                this.previousVisitedAt.set(previousVisitedAt);
              }
              this.commentIndex.configureContext('item', item, { previousVisitedAt });
              this.visitedService.markCommentsVisited(item.id, this.getCommentCountForVisit(item));
              if (isRefresh) {
                this.refreshToken.update((n) => n + 1);
              }
              this.handleLoadSuccess(isRefresh);
            }),
            catchError(() => {
              this.error.set('Failed to load item. Please try again.');
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          if (isRefresh) {
            this.refreshing.set(false);
          }
        }),
      )
      .subscribe();
  }

  /**
   * Common success handler for both bulk and fallback loading.
   * When `isRefresh` is true only comment sorting is re-applied; scroll is preserved.
   */
  private handleLoadSuccess(isRefresh = false) {
    const loadedItem = this.item();
    this.loading.set(false);
    this.loadCommentsForActiveSort();

    if (isRefresh) {
      return;
    }

    const storedScrollY = this.getStoredThreadReturnScrollY();
    if (storedScrollY !== null && loadedItem?.type === 'story') {
      window.scrollTo({ top: storedScrollY, behavior: 'auto' });
      return;
    }

    // When navigating with browser back/forward, let router restoration handle scroll.
    if (this.lastNavigationWasPopstate) {
      return;
    }

    setTimeout(() => {
      const firstComment = document.getElementById('first-comment');
      if (firstComment) {
        const heading = document.querySelector(
          '.comments-card .comments-heading',
        ) as HTMLElement | null;
        const commentRect = firstComment.getBoundingClientRect();
        const commentAbsTop = commentRect.top + window.scrollY;
        const headerHeight = this.scrollService.getHeaderHeight();
        const toolbarHeight = heading?.getBoundingClientRect().height ?? 0;

        let target = commentAbsTop - headerHeight - toolbarHeight - 16;

        if (heading) {
          const headingRect = heading.getBoundingClientRect();
          const headingAbsTop = headingRect.top + window.scrollY;
          target = Math.max(target, headingAbsTop - headerHeight);
        }

        window.scrollTo({
          top: Math.max(0, target),
          behavior: 'smooth',
        });
      } else {
        this.scrollService.scrollToElement('submission-title');
      }
    }, 100);
  }

  /**
   * Extract top-level comments from bulk load result.
   * These are the direct children of the story.
   */
  private getTopLevelCommentsFromBulkResult(result: BulkLoadResult): HNItem[] {
    const kids = result.story.kids ?? [];
    return kids
      .map((id) => result.commentsMap.get(id))
      .filter((item): item is HNItem => item !== undefined && !item.deleted);
  }

  loadMoreTopLevelComments() {
    const total = this.item()?.kids?.length ?? 0;

    if (!this.hasMoreTopLevelComments() || total === 0) {
      return;
    }

    this.visibleTopLevelCount.update((current) => {
      const next = current + this.commentsPageSize;
      return Math.min(next, total);
    });
  }

  /**
   * Re-fetch the current item and all its comments in the background.
   * Existing content stays visible (no skeleton flash) while the request is in flight.
   * Called by the header refresh button via `CommandRegistryService`.
   */
  refresh(): void {
    if (this.networkState.isOffline()) return;
    const id = this.currentItemId();
    if (!id) return;

    // Nothing loaded yet (error state) — fall back to a full load.
    if (!this.item()) {
      this.loadItem(id);
      return;
    }

    this.refreshing.set(true);
    this.loadWithAlgoliaBulk(id, null, true);
  }

  onSortChange(newSort: CommentSortOrder): void {
    this.commentSortService.setSortOrder(newSort);

    // Reset pagination to first page
    this.visibleTopLevelCount.set(
      this.commentDisplayStrategy.getInitialVisibleTopLevelCount({
        totalTopLevel: this.item()?.kids?.length ?? 0,
        pageSize: this.commentsPageSize,
        smallThreadMode: this.smallThreadMode(),
      }),
    );

    // Fetch comments if not already loaded and sort requires them
    if (newSort !== 'default' && this.allComments().length === 0) {
      this.loadAllComments();
    }
  }

  private loadCommentsForActiveSort(): void {
    if (this.sortOrder() !== 'default') {
      this.loadAllComments();
    }
  }

  jumpToNextUnread(): void {
    this.itemKeyboardNav.selectNextUnreadComment();
  }

  jumpToNextOP(): void {
    this.itemKeyboardNav.selectNextOPComment();
  }

  expandAllComments(): void {
    this.itemKeyboardNav.expandAllComments();
  }

  collapseAllComments(): void {
    this.itemKeyboardNav.collapseAllComments();
  }

  private loadAllComments(): void {
    // If we already have comments from bulk loading, no need to fetch again
    if (this.allComments().length > 0) {
      this.topLevelCommentsLoadedForSort.set(true);
      return;
    }

    const storyId = this.item()?.id;
    if (!storyId) {
      return;
    }

    this.commentsLoading.set(true);

    this.hnService.getStoryTopLevelComments(storyId).subscribe({
      next: (comments) => {
        this.allComments.set(comments);
        this.topLevelCommentsLoadedForSort.set(true);
        this.commentsLoading.set(false);
      },
      error: () => {
        this.commentsLoading.set(false);
        // Fallback to default order on error
        this.commentSortService.setSortOrder('default');
      },
    });
  }

  private applyCommentDisplayStrategy(item: HNItem): void {
    const strategy = this.commentDisplayStrategy.resolveForItem(item, {
      pageSize: this.commentsPageSize,
      smallThreadDescendantsThreshold: this.smallThreadDescendantsThreshold,
    });
    this.smallThreadMode.set(strategy.smallThreadMode);
    this.visibleTopLevelCount.set(strategy.initialVisibleTopLevelCount);
  }

  private resolveParentDiscussion(item: HNItem, requestedItemId: number): void {
    if (item.type !== 'comment') {
      this.parentDiscussionId.set(null);
      return;
    }

    if (item.storyId) {
      this.parentDiscussionId.set(item.storyId);
      return;
    }

    void this.resolveParentDiscussionFromAncestors(item, requestedItemId);
  }

  private async resolveParentDiscussionFromAncestors(
    item: HNItem,
    requestedItemId: number,
  ): Promise<void> {
    const visited = new Set<number>([item.id]);
    let parentId = item.parent;

    while (parentId !== undefined && !visited.has(parentId)) {
      visited.add(parentId);
      let parent: HNItem | null;
      try {
        parent = await firstValueFrom(this.hnService.getItem(parentId));
      } catch {
        if (this.item()?.id === requestedItemId) {
          this.parentDiscussionId.set(null);
        }
        return;
      }

      if (this.item()?.id !== requestedItemId) {
        return;
      }

      if (!parent || parent.deleted) {
        this.parentDiscussionId.set(null);
        return;
      }

      if (parent.type !== 'comment') {
        this.parentDiscussionId.set(parent.id);
        return;
      }

      if (parent.storyId) {
        this.parentDiscussionId.set(parent.storyId);
        return;
      }

      parentId = parent.parent;
    }

    this.parentDiscussionId.set(null);
  }

  private getStoredThreadReturnScrollY(): number | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const value = window.history.state?.__hnewsThreadReturnScrollY;
    return typeof value === 'number' ? value : null;
  }

  private getInheritedPreviousVisitedAt(itemId: number): number | null {
    if (this.commentIndex.hasComment('item', itemId)) {
      return this.commentIndex.getPreviousVisitedAt('item');
    }

    if (typeof window === 'undefined') {
      return null;
    }

    const value = window.history.state?.__hnewsPreviousCommentsVisitedAt;
    return typeof value === 'number' ? value : null;
  }

  private getPreviousCommentsVisitedAt(
    itemId: number,
    inheritedPreviousVisitedAt: number | null,
  ): number | null {
    return (
      this.visitedService.getCommentsVisitedData(itemId)?.visitedAt ??
      inheritedPreviousVisitedAt ??
      null
    );
  }

  private getCommentCountForVisit(item: HNItem): number | undefined {
    return item.descendants ?? item.kids?.length;
  }
}
