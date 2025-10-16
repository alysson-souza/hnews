// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HackernewsService } from '../../services/hackernews.service';
import { HNItem } from '../../models/hn';
import { CommentThread } from '../../components/comment-thread/comment-thread';
import { VisitedService } from '../../services/visited.service';
import { ScrollService } from '../../services/scroll.service';
import { CommentSortService } from '../../services/comment-sort.service';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { VisitedIndicatorComponent } from '../../components/shared/visited-indicator/visited-indicator.component';
import { SidebarStorySummaryComponent } from '../../components/sidebar-comments/sidebar-story-summary.component';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import {
  CommentSortDropdownComponent,
  CommentSortOrder,
} from '../../components/shared/comment-sort-dropdown/comment-sort-dropdown.component';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [
    CommonModule,
    CommentThread,
    PageContainerComponent,
    CardComponent,
    VisitedIndicatorComponent,
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

  item = signal<HNItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Sorting state - use global service
  sortOrder = this.commentSortService.sortOrder;
  allComments = signal<HNItem[]>([]);
  commentsLoading = signal(false);

  private readonly commentsPageSize = 10;
  private visibleTopLevelCount = signal(this.commentsPageSize);

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

    // Reset cached comments (but keep sort order global)
    this.allComments.set([]);
    this.commentsLoading.set(false);

    this.hnService.getItem(itemId).subscribe({
      next: (item) => {
        if (item) {
          this.item.set(item);
          // Mark as visited with current comment count
          this.visitedService.markAsVisited(item.id, item.descendants);
          // Scroll to submission title after content loads
          this.scrollService.scrollToElement('submission-title', { delay: 100 });
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
    this.visibleTopLevelCount.set(this.commentsPageSize);

    // Fetch comments if not already loaded and sort requires them
    if (newSort !== 'default' && this.allComments().length === 0) {
      this.loadAllComments();
    }
  }

  private loadAllComments(): void {
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
}
