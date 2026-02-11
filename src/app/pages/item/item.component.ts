// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { HackernewsService } from '../../services/hackernews.service';
import { BulkLoadResult } from '../../services/algolia-comment-loader.service';
import { HNItem } from '../../models/hn';
import { CommentThread } from '../../components/comment-thread/comment-thread';
import { VisitedService } from '../../services/visited.service';
import { ScrollService } from '../../services/scroll.service';
import { CommentSortService } from '../../services/comment-sort.service';
import { CommentDisplayStrategyService } from '../../services/comment-display-strategy.service';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { SidebarStorySummaryComponent } from '../../components/sidebar-comments/sidebar-story-summary.component';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import {
  CommentSortDropdownComponent,
  CommentSortOrder,
} from '../../components/shared/comment-sort-dropdown/comment-sort-dropdown.component';
import { ItemKeyboardNavigationService } from '../../services/item-keyboard-navigation.service';

@Component({
  selector: 'app-item',
  imports: [
    CommentThread,
    PageContainerComponent,
    CardComponent,
    SidebarStorySummaryComponent,
    AppButtonComponent,
    CommentSortDropdownComponent,
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.css',
})
export class ItemComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private hnService = inject(HackernewsService);
  private visitedService = inject(VisitedService);
  private scrollService = inject(ScrollService);
  private commentSortService = inject(CommentSortService);
  private commentDisplayStrategy = inject(CommentDisplayStrategyService);
  private itemKeyboardNav = inject(ItemKeyboardNavigationService);

  item = signal<HNItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Sorting state - use global service
  sortOrder = this.commentSortService.sortOrder;
  allComments = signal<HNItem[]>([]);
  commentsLoading = signal(false);

  // Bulk loading state - stores the result from Algolia bulk load
  private bulkLoadResult = signal<BulkLoadResult | null>(null);
  bulkLoadingComments = signal(false);

  private readonly commentsPageSize = 10;
  private readonly smallThreadDescendantsThreshold = 40;
  private visibleTopLevelCount = signal(this.commentsPageSize);
  smallThreadMode = signal(false);

  sortedCommentIds = computed(() => {
    const order = this.sortOrder();
    const kids = this.item()?.kids ?? [];

    if (order === 'default') {
      return kids; // HN's native order
    }

    const comments = this.allComments();
    if (comments.length === 0) {
      return kids; // Fallback while loading
    }

    // Sort by timestamp or score
    const sorted = [...comments].sort((a, b) => {
      if (order === 'newest') return b.time - a.time;
      if (order === 'oldest') return a.time - b.time;
      if (order === 'best') {
        // Combine score + replies with 2x weight on replies for engagement
        const bestScore = (item: HNItem) => (item.score ?? 0) + (item.kids?.length ?? 0) * 2;
        return bestScore(b) - bestScore(a);
      }
      return 0;
    });

    return sorted.map((c) => c.id);
  });

  visibleCommentIds = computed(() => {
    const kids = this.sortedCommentIds();
    const count = Math.min(this.visibleTopLevelCount(), kids.length);
    return kids.slice(0, count);
  });

  hasMoreTopLevelComments = computed(() => {
    const total = this.item()?.kids?.length ?? 0;
    return total > this.visibleCommentIds().length;
  });

  remainingTopLevelCount = computed(() => {
    const total = this.item()?.kids?.length ?? 0;
    const loaded = this.visibleCommentIds().length;
    const remaining = Math.max(total - loaded, 0);
    return Math.min(this.commentsPageSize, remaining);
  });

  ngOnInit() {
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

    this.loading.set(true);
    this.error.set(null);
    this.visibleTopLevelCount.set(this.commentsPageSize);
    this.smallThreadMode.set(false);

    // Reset cached comments (but keep sort order global)
    this.allComments.set([]);
    this.commentsLoading.set(false);
    this.bulkLoadResult.set(null);
    this.bulkLoadingComments.set(false);
    this.itemKeyboardNav.clearSelection();

    // Use Algolia bulk loading for stories with comments
    // This fetches the story AND all comments in a single request
    this.loadWithAlgoliaBulk(itemId);
  }

  /**
   * Load item using Algolia bulk API - fetches story and ALL comments in ONE request.
   * This is a major performance optimization: instead of N+1 requests, we make 1.
   *
   * The bulk load pre-populates the cache, so subsequent getItem() calls
   * from CommentThread components are instant cache hits.
   */
  private loadWithAlgoliaBulk(itemId: number) {
    this.bulkLoadingComments.set(true);

    this.hnService.getStoryWithAllComments(itemId).subscribe({
      next: (result) => {
        if (result) {
          // Algolia bulk load succeeded
          this.bulkLoadResult.set(result);
          this.item.set(result.story);
          this.applyCommentDisplayStrategy(result.story);

          // Pre-populate allComments for sorting (top-level only)
          const topLevelComments = this.getTopLevelCommentsFromBulkResult(result);
          this.allComments.set(topLevelComments);

          // Mark as visited
          this.visitedService.markAsVisited(result.story.id, result.story.descendants);

          this.handleLoadSuccess();
        } else {
          // Algolia failed, fallback to Firebase API
          this.loadWithFirebaseApi(itemId);
        }
        this.bulkLoadingComments.set(false);
      },
      error: () => {
        // Algolia failed, fallback to Firebase API
        this.bulkLoadingComments.set(false);
        this.loadWithFirebaseApi(itemId);
      },
    });
  }

  /**
   * Fallback: Load item using Firebase API (original N+1 approach).
   * Used when Algolia bulk load fails.
   */
  private loadWithFirebaseApi(itemId: number) {
    this.hnService.getItem(itemId).subscribe({
      next: (item) => {
        if (item) {
          this.item.set(item);
          this.applyCommentDisplayStrategy(item);
          this.visitedService.markAsVisited(item.id, item.descendants);
          this.handleLoadSuccess();
        } else {
          this.error.set('Item not found');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load item. Please try again.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Common success handler for both bulk and fallback loading.
   */
  private handleLoadSuccess() {
    this.loading.set(false);

    // Scroll to first comment if available, otherwise submission title
    setTimeout(() => {
      if (document.getElementById('first-comment')) {
        this.scrollService.scrollToElement('first-comment');
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

  private loadAllComments(): void {
    // If we already have comments from bulk loading, no need to fetch again
    if (this.allComments().length > 0) {
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
}
