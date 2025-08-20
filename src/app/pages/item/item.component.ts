// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HackernewsService, HNItem } from '../../services/hackernews.service';
import { CommentThread } from '../../components/comment-thread/comment-thread';
import { VisitedService } from '../../services/visited.service';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [CommonModule, CommentThread, RouterLink, PageContainerComponent, CardComponent],
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
          <!-- Title -->
          <h1 class="item-title">
            @if (item()!.dead) {
              <span class="dead-item">[flagged]</span>
            } @else if (item()!.url) {
              <a
                [href]="item()!.url"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="title-link"
              >
                {{ item()!.title || '[untitled]' }}
              </a>
            } @else {
              {{ item()!.title || '[untitled]' }}
            }
          </h1>

          <!-- Metadata -->
          <div class="item-meta mb-4">
            <span>{{ item()!.score || 0 }} points</span>
            <span>•</span>
            <span
              >by
              <a [routerLink]="['/user', item()!.by]" class="meta-link">
                {{ item()!.by }}
              </a>
            </span>
            <span>•</span>
            <span>{{ getTimeAgo(item()!.time) }}</span>
            <span>•</span>
            <span>{{ item()!.descendants || 0 }} comments</span>
          </div>

          <!-- Story Text (for Ask HN, etc.) -->
          @if (item()!.text) {
            <div class="item-prose" [innerHTML]="item()!.text"></div>
          }
        </app-card>

        <!-- Comments Section -->
        <app-card class="block">
          <h2 class="comments-title">Comments ({{ item()!.descendants || 0 }})</h2>

          @if (visibleComments().length > 0) {
            <div class="space-y-4">
              @for (commentId of visibleComments(); track commentId; let i = $index) {
                <app-comment-thread
                  [commentId]="commentId"
                  [depth]="0"
                  [lazyLoad]="shouldLazyLoad(i)"
                >
                </app-comment-thread>
              }
            </div>

            <!-- Load More Comments Button -->
            @if (hasMoreComments()) {
              <div class="mt-8 text-center">
                <button
                  (click)="loadMoreComments()"
                  [disabled]="loadingMoreComments()"
                  class="comments-load-btn"
                >
                  @if (loadingMoreComments()) {
                    <span class="flex items-center gap-2">
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </span>
                  } @else {
                    Load {{ nextBatchSize() }} more comments
                  }
                </button>
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
        @apply text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4;
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

      /* Buttons */
      .comments-load-btn {
        @apply px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
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

  readonly commentsPerPage = 10;
  readonly immediateLoadCount = 3;
  readonly maxInitialComments = 3;
  private currentCommentsPage = signal(0);
  loadingMoreComments = signal(false);

  visibleComments = computed(() => {
    const item = this.item();
    if (!item?.kids) return [];

    if (this.currentCommentsPage() === 0) {
      return item.kids.slice(0, this.maxInitialComments);
    }

    const totalToShow = this.maxInitialComments + this.currentCommentsPage() * this.commentsPerPage;
    return item.kids.slice(0, totalToShow);
  });

  hasMoreComments = computed(() => {
    const item = this.item();
    if (!item?.kids) return false;

    const totalComments = item.kids.length;
    const loadedComments =
      this.currentCommentsPage() === 0
        ? this.maxInitialComments
        : this.maxInitialComments + this.currentCommentsPage() * this.commentsPerPage;
    return loadedComments < totalComments;
  });

  remainingCommentsCount = computed(() => {
    const item = this.item();
    if (!item?.kids) return 0;

    const totalComments = item.kids.length;
    const loadedComments =
      this.currentCommentsPage() === 0
        ? this.maxInitialComments
        : this.maxInitialComments + this.currentCommentsPage() * this.commentsPerPage;
    return Math.max(0, totalComments - loadedComments);
  });

  nextBatchSize = computed(() => {
    return Math.min(this.commentsPerPage, this.remainingCommentsCount());
  });

  shouldLazyLoad(index: number): boolean {
    return index >= this.immediateLoadCount;
  }

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
    // Reset pagination when loading new item
    this.currentCommentsPage.set(0);

    this.hnService.getItem(itemId).subscribe({
      next: (item) => {
        if (item) {
          this.item.set(item);
          // Mark as visited with current comment count
          this.visitedService.markAsVisited(item.id, item.descendants);
          // Scroll to submission title after content loads
          setTimeout(() => {
            const element = document.getElementById('submission-title');
            if (element) {
              // Get the element's position
              const elementRect = element.getBoundingClientRect();
              const elementTop = elementRect.top + window.scrollY;

              // Account for sticky navbar (approximate height: 64px + some padding)
              const navbarHeight = 80;
              const targetPosition = elementTop - navbarHeight;

              // Scroll to position accounting for navbar
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

  loadMoreComments() {
    if (this.loadingMoreComments() || !this.hasMoreComments()) {
      return;
    }

    this.loadingMoreComments.set(true);

    setTimeout(() => {
      this.currentCommentsPage.update((page) => page + 1);
      this.loadingMoreComments.set(false);
    }, 300);
  }

  getTimeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}
