// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';
import { HackernewsService } from '../../services/hackernews.service';
import { HNItem } from '../../models/hn';
import { CommentThread } from '../comment-thread/comment-thread';
import { SidebarCommentsHeaderComponent } from './sidebar-comments-header.component';
import { SidebarStorySummaryComponent } from './sidebar-story-summary.component';
import { AppButtonComponent } from '../shared/app-button/app-button.component';
import { VisitedService } from '../../services/visited.service';
import {
  CommentSortDropdownComponent,
  CommentSortOrder,
} from '../shared/comment-sort-dropdown/comment-sort-dropdown.component';

@Component({
  selector: 'app-sidebar-comments',
  standalone: true,
  imports: [
    CommonModule,
    CommentThread,
    SidebarCommentsHeaderComponent,
    SidebarStorySummaryComponent,
    AppButtonComponent,
    CommentSortDropdownComponent,
  ],
  template: `
    <!-- Sidebar Comments -->
    @if (sidebarService.isOpen()) {
      <!-- Mobile: Full screen overlay -->
      <div
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        role="button"
        tabindex="0"
        (click)="sidebarService.closeSidebar()"
        (keydown.enter)="sidebarService.closeSidebar()"
        (keydown.space)="sidebarService.closeSidebar()"
      ></div>

      <!-- Sidebar Panel -->
      <div
        class="fixed right-0 top-0 lg:top-16 bottom-0 w-full sm:w-[80vw] md:w-[60vw] lg:w-[40vw] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 shadow-2xl dark:shadow-2xl transition-transform duration-300 overflow-hidden z-50 lg:z-30"
        [class.translate-x-full]="!sidebarService.isOpen()"
        [class.translate-x-0]="sidebarService.isOpen()"
      >
        @if (sidebarService.currentItemId()) {
          <div class="h-full flex flex-col">
            <!-- Header -->
            <app-sidebar-comments-header (dismiss)="sidebarService.closeSidebar()" />

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-3 sm:p-4">
              @if (loading()) {
                <div class="animate-pulse space-y-4">
                  <div class="h-20 bg-gray-200 rounded"></div>
                  <div class="h-20 bg-gray-200 rounded"></div>
                  <div class="h-20 bg-gray-200 rounded"></div>
                </div>
              } @else if (item()) {
                <!-- Story Details -->
                <app-sidebar-story-summary [item]="item()!" />

                <hr class="my-4 border-gray-200 dark:border-slate-700" />

                <!-- Comments Header with Sort -->
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Comments ({{ item()!.descendants || 0 }})
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
                      <app-comment-thread [commentId]="commentId" [depth]="0"></app-comment-thread>
                    }
                  </div>

                  @if (hasMoreTopLevelComments()) {
                    <div class="mt-4 flex justify-center">
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
                  <p class="text-gray-500 text-center py-8">No comments yet</p>
                }
              } @else if (error()) {
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p class="text-red-800">{{ error() }}</p>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class SidebarCommentsComponent {
  sidebarService = inject(SidebarService);
  // Intentionally no device-specific behavior here
  private hnService = inject(HackernewsService);
  private visitedService = inject(VisitedService);

  item = signal<HNItem | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Sorting state
  sortOrder = signal<CommentSortOrder>('default');
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

  constructor() {
    // React to currentItemId changes using signals
    effect(() => {
      const id = this.sidebarService.currentItemId();
      const current = this.item();
      if (id && (!current || current.id !== id)) {
        this.loadItem(id);
      }
    });
  }

  private loadItem(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.visibleTopLevelCount.set(this.commentsPageSize);

    // Reset sorting state when loading a new item
    this.sortOrder.set('default');
    this.allComments.set([]);
    this.commentsLoading.set(false);

    this.hnService.getItem(id).subscribe({
      next: (item) => {
        if (item) {
          this.item.set(item);
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
    this.sortOrder.set(newSort);

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
        this.sortOrder.set('default');
      },
    });
  }
}
