// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HackernewsService } from '../../services/hackernews.service';
import { HNItem } from '../../models/hn';
import { CommentThread } from '../../components/comment-thread/comment-thread';
import { VisitedService } from '../../services/visited.service';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { VisitedIndicatorComponent } from '../../components/shared/visited-indicator/visited-indicator.component';
import { SidebarStorySummaryComponent } from '../../components/sidebar-comments/sidebar-story-summary.component';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';

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
  ],
  template: `
    <app-page-container>
      @if (loading()) {
        <!-- Loading skeleton -->
        <div class="animate-pulse">
          <div class="skel-title mb-4"></div>
          <div class="skel-subtitle mb-8"></div>
          <div class="space-y-4">
            <div class="skel-block"></div>
            <div class="skel-block"></div>
          </div>
        </div>
      } @else if (item()) {
        <!-- Story Details -->
        <app-card class="block mb-6" id="submission-title">
          <!-- Visited indicator -->
          <app-visited-indicator [storyId]="item()!.id"></app-visited-indicator>
          <!-- Story summary -->
          <app-sidebar-story-summary [item]="item()!" [showActions]="false" />
        </app-card>

        <!-- Comments Section -->
        <app-card class="block">
          <h2 class="comments-title">Comments ({{ item()!.descendants || 0 }})</h2>

          @if (item()!.kids && item()!.kids!.length > 0) {
            <div class="space-y-4" role="tree" aria-label="Comments">
              @for (commentId of visibleCommentIds(); track commentId) {
                <app-comment-thread [commentId]="commentId" [depth]="0"></app-comment-thread>
              }
            </div>

            @if (hasMoreTopLevelComments()) {
              <div class="mt-6 flex justify-center">
                <app-button
                  variant="secondary"
                  size="sm"
                  [ariaLabel]="'Load more comments'"
                  (clicked)="loadMoreTopLevelComments()"
                >
                  Load {{ remainingTopLevelCount() }} more comments
                </app-button>
              </div>
            }
          } @else {
            <p class="empty">No comments yet</p>
          }
        </app-card>
      } @else if (error()) {
        <!-- Error State -->
        <div class="error-card">
          <p class="error-text">{{ error() }}</p>
          <button (click)="loadItem()" class="error-btn">Try Again</button>
        </div>
      }
    </app-page-container>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      /* Skeleton */
      .skel-title {
        @apply h-8 bg-gray-200 dark:bg-slate-800 rounded w-3/4;
      }
      .skel-subtitle {
        @apply h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2;
      }
      .skel-block {
        @apply h-20 bg-gray-200 dark:bg-slate-800 rounded;
      }

      /* Titles */
      .item-title {
        @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2;
      }
      .comments-title {
        @apply text-base font-semibold text-gray-900 dark:text-gray-100 mb-4;
      }
      .title-link {
        @apply hover:text-blue-600 dark:hover:text-blue-400;
      }
      .dead-item {
        @apply text-gray-500 dark:text-gray-600 italic;
      }

      /* Metadata */
      .item-meta {
        @apply flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400;
      }
      .meta-link {
        @apply text-blue-600 dark:text-blue-300 hover:underline;
      }

      /* Body */
      .item-prose {
        @apply prose prose-lg max-w-none text-gray-800 dark:text-gray-200 mb-4;
      }

      /* Empty */
      .empty {
        @apply text-gray-500 dark:text-gray-400 text-center py-8;
      }

      /* Error */
      .error-card {
        @apply bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center;
      }
      .error-text {
        @apply text-red-800 dark:text-red-300;
      }
      .error-btn {
        @apply mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500;
      }

      /* Make app-card relative for visited indicator positioning */
      app-card {
        @apply relative;
      }
    `,
  ],
})
export class ItemComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private hnService = inject(HackernewsService);
  private visitedService = inject(VisitedService);

  item = signal<HNItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private readonly commentsPageSize = 10;
  private visibleTopLevelCount = signal(this.commentsPageSize);

  visibleCommentIds = computed(() => {
    const kids = this.item()?.kids ?? [];
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

    this.hnService.getItem(itemId).subscribe({
      next: (item) => {
        if (item) {
          this.item.set(item);
          // Mark as visited with current comment count
          this.visitedService.markAsVisited(item.id, item.descendants);
          // Scroll to submission title after content loads
          setTimeout(() => {
            const element = document.getElementById('submission-title');
            const header = document.querySelector('.app-header');
            if (element && header) {
              const elementRect = element.getBoundingClientRect();
              const elementTop = elementRect.top + window.scrollY;
              const headerRect = header.getBoundingClientRect();
              const navbarHeight = headerRect.height;

              const targetPosition = elementTop - navbarHeight;

              window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'smooth',
              });
            }
          }, 100);
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
}
