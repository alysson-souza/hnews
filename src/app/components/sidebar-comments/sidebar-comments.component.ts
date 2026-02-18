// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, inject, signal, effect, computed, ElementRef, viewChild } from '@angular/core';

import { SidebarService } from '../../services/sidebar.service';
import { SidebarThreadNavigationService } from '../../services/sidebar-thread-navigation.service';
import { HackernewsService } from '../../services/hackernews.service';
import { HNItem } from '../../models/hn';
import { CommentThread } from '../comment-thread/comment-thread';
import { SidebarCommentsHeaderComponent } from './sidebar-comments-header.component';
import { SidebarStorySummaryComponent } from './sidebar-story-summary.component';
import { AppButtonComponent } from '../shared/app-button/app-button.component';
import { VisitedService } from '../../services/visited.service';
import { CommentSortService } from '../../services/comment-sort.service';
import { CommentDisplayStrategyService } from '../../services/comment-display-strategy.service';
import {
  CommentSortDropdownComponent,
  CommentSortOrder,
} from '../shared/comment-sort-dropdown/comment-sort-dropdown.component';

@Component({
  selector: 'app-sidebar-comments',
  imports: [
    CommentThread,
    SidebarCommentsHeaderComponent,
    SidebarStorySummaryComponent,
    AppButtonComponent,
    CommentSortDropdownComponent,
  ],
  template: `
    <!-- Sidebar Comments -->
    <!-- Overlay: always in DOM, visibility driven by CSS -->
    <div
      class="sidebar-overlay lg:hidden fixed inset-0 sm:top-16 bg-slate-950/40 backdrop-blur-[2px] z-40 transition-opacity duration-300"
      [class.opacity-0]="!sidebarService.isOpen()"
      [class.opacity-100]="sidebarService.isOpen()"
      [class.pointer-events-none]="!sidebarService.isOpen()"
      [class.pointer-events-auto]="sidebarService.isOpen()"
      [attr.aria-hidden]="!sidebarService.isOpen()"
      role="button"
      tabindex="0"
      aria-label="Close sidebar"
      title="Close sidebar"
      (click)="onDismiss()"
      (keydown.enter)="onDismiss()"
      (keydown.space)="onDismiss()"
    ></div>

    <!-- Sidebar Panel: always in DOM, slide driven by CSS -->
    <div
      class="sidebar-panel fixed right-0 top-0 sm:top-16 bottom-0 w-full sm:w-[80vw] md:w-[60vw] lg:w-[40vw] bg-white/95 dark:bg-slate-950/92 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800/70 shadow-2xl dark:shadow-black/50 transition-transform duration-300 overflow-hidden z-50 sm:z-30 will-change-transform translate-x-full"
      [class.translate-x-full]="!sidebarService.isOpen()"
      [class.translate-x-0]="sidebarService.isOpen()"
      [attr.inert]="sidebarService.isOpen() ? null : true"
      [attr.aria-hidden]="!sidebarService.isOpen()"
    >
      @if (sidebarService.currentItemId()) {
        <div class="h-full flex flex-col">
          <!-- Header -->
          <app-sidebar-comments-header
            [canGoBack]="sidebarService.canGoBack()"
            [itemId]="sidebarService.currentItemId()!"
            (dismiss)="onDismiss()"
            (back)="onBack()"
          />

          <!-- Content -->
          <div
            #sidebarContent
            class="sidebar-comments-panel flex-1 overflow-y-auto overscroll-contain focus:outline-none"
            tabindex="-1"
            [class.slide-out-left]="
              sidebarService.isTransitioning() &&
              sidebarService.animatingOut() &&
              sidebarService.animationDirection() === 'left'
            "
            [class.slide-out-right]="
              sidebarService.isTransitioning() &&
              sidebarService.animatingOut() &&
              sidebarService.animationDirection() === 'right'
            "
            [class.slide-in-left]="
              sidebarService.isTransitioning() &&
              !sidebarService.animatingOut() &&
              sidebarService.animationDirection() === 'left'
            "
            [class.slide-in-right]="
              sidebarService.isTransitioning() &&
              !sidebarService.animatingOut() &&
              sidebarService.animationDirection() === 'right'
            "
          >
            <div class="p-4 sm:p-6">
              @if (loading()) {
                <div class="skeleton space-y-4">
                  <div class="h-20 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
                  <div class="h-20 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
                  <div class="h-20 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
                </div>
              } @else if (item()) {
                <!-- Story Details -->
                <app-sidebar-story-summary [item]="item()!" />

                <hr class="my-6 border-gray-200 dark:border-slate-700/60" />

                <!-- Comments Header with Sort -->
                <div class="flex items-center justify-between mb-6">
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Comments ({{ item()!.kids?.length || 0 }})
                  </h4>

                  <app-comment-sort-dropdown
                    [sortOrder]="sortOrder()"
                    [loading]="commentsLoading()"
                    (sortChange)="onSortChange($event)"
                  />
                </div>

                @if (item()!.kids && item()!.kids!.length > 0) {
                  <div class="space-y-4" role="tree" aria-label="Comments">
                    @for (commentId of visibleCommentIds(); track commentId) {
                      <app-comment-thread
                        [commentId]="commentId"
                        [depth]="0"
                        [autoExpandReplies]="smallThreadMode()"
                        [storyAuthor]="item()?.by"
                      />
                    }
                  </div>

                  @if (hasMoreTopLevelComments()) {
                    <div class="mt-4 flex justify-center">
                      <app-button
                        variant="secondary"
                        size="sm"
                        class="load-more-btn"
                        [ariaLabel]="'Load more comments'"
                        (clicked)="loadMoreTopLevelComments()"
                      >
                        Load {{ remainingTopLevelCount() }} more comments
                      </app-button>
                    </div>
                  }
                } @else {
                  <p class="text-gray-500 text-center py-8">No comments yet</p>
                }
              } @else if (error()) {
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p class="text-red-800">{{ error() }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      :host {
        display: contents;
      }

      /* Prevent default browser focus outline on programmatic focus */
      .sidebar-comments-panel:focus {
        outline: none;
      }

      /* PWA standalone mode: adjust for safe area insets */
      @media (display-mode: standalone) {
        .sidebar-overlay {
          /* Position overlay below header which includes safe area */
          top: calc(4rem + env(safe-area-inset-top, 0px)) !important;
        }

        .sidebar-panel {
          /* Position panel below header which includes safe area */
          top: calc(4rem + env(safe-area-inset-top, 0px)) !important;
        }

        /* On mobile (no sm: prefix), reset to full screen in PWA mode */
        @media (max-width: 639.98px) {
          .sidebar-overlay {
            top: 0 !important;
          }

          .sidebar-panel {
            top: 0 !important;
          }
        }
      }

      .slide-out-left {
        animation: slide-out-left 150ms ease-in-out forwards;
      }

      .slide-out-right {
        animation: slide-out-right 150ms ease-in-out forwards;
      }

      .slide-in-left {
        animation: slide-in-left 150ms ease-in-out forwards;
      }

      .slide-in-right {
        animation: slide-in-right 150ms ease-in-out forwards;
      }

      @keyframes slide-out-left {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(-100%);
          opacity: 0;
        }
      }

      @keyframes slide-out-right {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @keyframes slide-in-left {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slide-in-right {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class SidebarCommentsComponent {
  private sidebarContentRef = viewChild<ElementRef<HTMLElement>>('sidebarContent');
  sidebarService = inject(SidebarService);
  private sidebarThreadNavigation = inject(SidebarThreadNavigationService);
  // Intentionally no device-specific behavior here
  private hnService = inject(HackernewsService);
  private visitedService = inject(VisitedService);
  private commentSortService = inject(CommentSortService);
  private commentDisplayStrategy = inject(CommentDisplayStrategyService);

  item = signal<HNItem | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Sorting state - use global service
  sortOrder = this.commentSortService.sortOrder;
  allComments = signal<HNItem[]>([]);
  commentsLoading = signal(false);

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
      if (order === 'popular') {
        return (b.descendants ?? 0) - (a.descendants ?? 0);
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

  constructor() {
    // React to currentItemId changes using signals
    effect(() => {
      const id = this.sidebarService.currentItemId();
      const current = this.item();
      if (id && (!current || current.id !== id)) {
        this.loadItem(id);
      }
    });

    // Reset nested panel scroll position on thread change.
    effect(() => {
      const id = this.sidebarService.currentItemId();
      if (!id) {
        return;
      }

      setTimeout(() => {
        const container = this.sidebarContentRef()?.nativeElement;
        if (container) {
          container.scrollTop = 0;
        }
      });
    });

    // Apply one-shot keyboard selection for "view thread" after content has loaded.
    effect(() => {
      const id = this.sidebarService.currentItemId();
      const item = this.item();
      const isLoading = this.loading();

      if (!id || isLoading || !item || item.id !== id) {
        return;
      }

      setTimeout(() => {
        this.sidebarThreadNavigation.applyPendingFirstVisibleSelection();
      });
    });

    // Focus the scroll container so browser arrow keys scroll the sidebar instead of the page
    effect(() => {
      if (this.sidebarService.isOpen() && this.sidebarService.currentItemId()) {
        setTimeout(() => {
          this.sidebarContentRef()?.nativeElement?.focus({ preventScroll: true });
        });
      }
    });
  }

  private loadItem(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.visibleTopLevelCount.set(this.commentsPageSize);
    this.smallThreadMode.set(false);

    // Reset cached comments (but keep sort order global)
    this.allComments.set([]);
    this.commentsLoading.set(false);

    this.hnService.getItem(id).subscribe({
      next: (item) => {
        if (item) {
          this.item.set(item);
          this.applyCommentDisplayStrategy(item);
          // Mark as visited
          this.visitedService.markAsVisited(item.id, item.descendants);
        } else {
          this.error.set('Item not found');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load comments');
        this.loading.set(false);
      },
    });
  }

  loadMoreTopLevelComments(): void {
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

  onBack(): void {
    void this.sidebarThreadNavigation.goBack();
  }

  onDismiss(): void {
    this.sidebarThreadNavigation.closeSidebar();
  }
}
