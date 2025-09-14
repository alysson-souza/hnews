// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HackernewsService } from '../../services/hackernews.service';
import { HNItem } from '../../models/hn';
import { ThreadGutterComponent } from '../thread-gutter/thread-gutter.component';
import { CommentHeaderComponent } from '../comment-header/comment-header.component';
import { CommentTextComponent } from '../comment-text/comment-text.component';
import { LazyLoadCardComponent } from '../lazy-load-card/lazy-load-card.component';
import { AppButtonComponent } from '../shared/app-button/app-button.component';
import { CommentSkeletonComponent } from '../comment-skeleton/comment-skeleton.component';

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [
    CommonModule,
    CommentThread,
    ThreadGutterComponent,
    CommentHeaderComponent,
    CommentTextComponent,
    LazyLoadCardComponent,
    AppButtonComponent,
    CommentSkeletonComponent,
  ],
  template: `
    @if (showLoadButton()) {
      <app-lazy-load-card [depth]="depth" [loading]="loading()" (loadMore)="loadComment()" />
    } @else if (loading()) {
      <app-comment-skeleton [depth]="depth" />
    } @else if (comment()) {
      <app-thread-gutter
        [depth]="depth"
        [clickable]="true"
        [collapsed]="isCollapsed()"
        (toggleThread)="toggleCollapse()"
      >
        <div header>
          <app-comment-header
            [by]="comment()!.by || ''"
            [timestamp]="comment()!.time"
            [voted]="hasVoted()"
            [repliesCount]="totalRepliesCount()"
            [showExpand]="showExpandButton()"
            [loadingReplies]="loadingReplies()"
            (upvote)="upvoteComment()"
            (expand)="expandReplies()"
          />
        </div>
        <div body>
          @if (!isCollapsed()) {
            <app-comment-text [html]="comment()!.text || ''" />

            @if (replies().length > 0 || loadingReplies()) {
              <div class="mt-2">
                @if (loadingReplies() && replies().length === 0) {
                  <div class="replies-loading">
                    <div class="loading-inline">
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
                      Loading replies...
                    </div>
                  </div>
                }

                @for (reply of replies(); track reply.id) {
                  @if (reply.kids && reply.kids.length > 0) {
                    <app-comment-thread
                      [commentId]="reply.id"
                      [depth]="depth + 1"
                      [lazyLoad]="true"
                      [initialComment]="reply"
                    ></app-comment-thread>
                  } @else {
                    <app-thread-gutter [depth]="depth + 1" [clickable]="false" [collapsed]="false">
                      <div header>
                        <app-comment-header
                          [by]="reply.by || ''"
                          [timestamp]="reply.time"
                          [voted]="hasVotedById(reply.id)"
                          [repliesCount]="0"
                          [showExpand]="false"
                          [loadingReplies]="false"
                          (upvote)="upvoteById(reply.id)"
                        />
                      </div>
                      <div body>
                        <app-comment-text [html]="reply.text || ''" />
                      </div>
                    </app-thread-gutter>
                  }
                }

                @if (hasMoreReplies()) {
                  <div class="mt-3 ml-2 sm:ml-4">
                    <app-button
                      variant="secondary"
                      size="sm"
                      [disabled]="loadingMore()"
                      [ariaLabel]="loadingMore() ? 'Loading more replies' : 'Load more replies'"
                      (clicked)="loadMoreReplies()"
                    >
                      @if (loadingMore()) {
                        <span class="flex items-center gap-1">
                          <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
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
                        Load {{ remainingRepliesCount }} more replies
                      }
                    </app-button>
                  </div>
                }
              </div>
            }
          } @else {
            <span class="collapsed-text">[collapsed]</span>
          }
        </div>
      </app-thread-gutter>
    }
  `,
  styles: [
    `
      @reference '../../../styles.css';

      /* Loading states */
      .loading-inline {
        @apply flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500;
      }
      .replies-loading {
        @apply ml-2 sm:ml-4 py-2;
      }
      /* Buttons: now use shared app-button */
      /* Misc */
      .collapsed-text {
        @apply text-sm text-gray-500 dark:text-gray-400 italic;
      }
    `,
  ],
})
export class CommentThread implements OnInit {
  @Input({ required: true }) commentId!: number;
  @Input() depth = 0;
  @Input() lazyLoad = false;
  // Optional: when a parent already fetched this comment, pass it to avoid refetching
  @Input() initialComment?: HNItem;

  // Auto-collapse threshold
  private readonly autoCollapseThreshold = 10;

  private hnService = inject(HackernewsService);

  comment = signal<HNItem | null>(null);
  replies = signal<HNItem[]>([]);
  isCollapsed = signal(false);
  loading = signal(true);
  votedComments = signal<Set<number>>(new Set());

  // Reply loading state
  repliesLoaded = signal(false);
  loadingReplies = signal(false);

  // Lazy loading state
  commentLoaded = signal(false);

  private currentPage = signal(0);
  readonly pageSize = 10;
  hasMoreReplies = signal(false);
  loadingMore = signal(false);
  allKidsIds: number[] = [];

  constructor() {
    // Load voted comments from localStorage
    const stored = localStorage.getItem('votedComments');
    if (stored) {
      this.votedComments.set(new Set(JSON.parse(stored)));
    }
  }

  hasVoted = computed(() => this.votedComments().has(this.comment()?.id || 0));

  // Auto-collapse logic
  shouldAutoCollapse = computed(() => {
    const comment = this.comment();
    return comment?.kids && comment.kids.length >= this.autoCollapseThreshold;
  });

  totalRepliesCount = computed(() => {
    return this.comment()?.kids?.length || 0;
  });

  showExpandButton = computed(() => {
    return this.totalRepliesCount() > 0 && !this.repliesLoaded();
  });

  showLoadButton = computed(() => {
    return this.lazyLoad && !this.commentLoaded();
  });

  get currentPageValue() {
    return this.currentPage();
  }

  get remainingRepliesCount() {
    const remaining = this.allKidsIds.length - (this.currentPage() + 1) * this.pageSize;
    return Math.min(this.pageSize, remaining);
  }

  ngOnInit() {
    // If parent provided the comment, hydrate without fetching
    if (this.initialComment) {
      this.hydrateFromInitial(this.initialComment);
      return;
    }

    if (!this.lazyLoad) {
      this.loadComment();
    } else {
      // Lazy instances render a small loader card until user opts-in
      this.loading.set(false);
    }
  }

  private hydrateFromInitial(item: HNItem) {
    if (item && !item.deleted) {
      this.comment.set(item);
      this.commentLoaded.set(true);
      // Prepare kids but DO NOT auto-load replies; load only on expand
      if (item.kids && item.kids.length > 0) {
        this.allKidsIds = item.kids;
        this.hasMoreReplies.set(item.kids.length > this.pageSize);
      }
      this.loading.set(false);
    } else {
      this.loading.set(false);
    }
  }

  loadComment() {
    this.loading.set(true);

    this.hnService.getItem(this.commentId).subscribe({
      next: (item) => {
        if (item && !item.deleted) {
          this.comment.set(item);
          this.commentLoaded.set(true);

          // Prepare kids but DO NOT auto-load replies; load only on expand
          if (item.kids && item.kids.length > 0) {
            this.allKidsIds = item.kids;
            this.hasMoreReplies.set(item.kids.length > this.pageSize);
          }
          // Parent is ready; children loading deferred until expand
          this.loading.set(false);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadRepliesPage(page: number) {
    if (page === 0) {
      this.loadingReplies.set(true);
    } else {
      this.loadingMore.set(true);
    }

    this.hnService.getItemsPage(this.allKidsIds, page, this.pageSize).subscribe({
      next: (items) => {
        const validReplies = items.filter((item) => item !== null && !item.deleted) as HNItem[];

        if (page === 0) {
          this.replies.set(validReplies);
          this.repliesLoaded.set(true);
        } else {
          this.replies.update((current) => [...current, ...validReplies]);
        }

        this.currentPage.set(page);

        const totalLoaded = (page + 1) * this.pageSize;
        this.hasMoreReplies.set(totalLoaded < this.allKidsIds.length);

        this.loadingReplies.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingReplies.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  loadMoreReplies() {
    if (!this.loadingMore() && this.hasMoreReplies()) {
      const nextPage = this.currentPage() + 1;
      this.loadRepliesPage(nextPage);
    }
  }

  expandReplies() {
    if (!this.repliesLoaded() && !this.loadingReplies()) {
      this.loadRepliesPage(0);
    }
  }

  toggleCollapse() {
    this.isCollapsed.update((v) => !v);
  }

  upvoteComment() {
    if (this.hasVoted() || !this.comment()) return;

    const newVoted = new Set(this.votedComments());
    newVoted.add(this.comment()!.id);
    this.votedComments.set(newVoted);

    // Save to localStorage
    localStorage.setItem('votedComments', JSON.stringify(Array.from(newVoted)));
  }

  hasVotedById(id: number): boolean {
    return this.votedComments().has(id);
  }

  upvoteById(id: number) {
    if (this.votedComments().has(id)) return;
    const newVoted = new Set(this.votedComments());
    newVoted.add(id);
    this.votedComments.set(newVoted);
    localStorage.setItem('votedComments', JSON.stringify(Array.from(newVoted)));
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

  getIndentClass(): string {
    // Apply appropriate indentation based on depth
    const indentLevel = Math.min(this.depth, 8); // Cap at 8 levels
    return `ml-${indentLevel * 4}`;
  }
}
