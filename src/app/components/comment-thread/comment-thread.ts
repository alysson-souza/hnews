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
import { CommentVoteStoreService } from '../../services/comment-vote-store.service';
import { CommentRepliesLoaderService } from '../../services/comment-replies-loader.service';

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
  providers: [CommentRepliesLoaderService],
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
  isCollapsed = signal(false);
  loading = signal(true);

  // Lazy loading state
  commentLoaded = signal(false);

  private repliesLoader = inject(CommentRepliesLoaderService);
  private voteStore = inject(CommentVoteStoreService);

  readonly replies = this.repliesLoader.replies;
  readonly repliesLoaded = this.repliesLoader.repliesLoaded;
  readonly loadingReplies = this.repliesLoader.loadingReplies;
  readonly loadingMore = this.repliesLoader.loadingMore;
  readonly hasMoreReplies = this.repliesLoader.hasMore;
  private readonly currentPage = this.repliesLoader.currentPage;

  hasVoted = computed(() => {
    const current = this.comment();
    if (!current) {
      return false;
    }

    return this.voteStore.votedCommentIds().has(current.id);
  });

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

  showLoadButton(): boolean {
    return this.lazyLoad && !this.commentLoaded();
  }

  get currentPageValue() {
    return this.currentPage();
  }

  get remainingRepliesCount() {
    return this.repliesLoader.remainingCount();
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
      this.repliesLoader.configureKids(item.kids);
      this.comment.set(item);
      this.commentLoaded.set(true);
      this.loading.set(false);
    } else {
      this.repliesLoader.configureKids([]);
      this.loading.set(false);
    }
  }

  loadComment() {
    this.loading.set(true);

    this.hnService.getItem(this.commentId).subscribe({
      next: (item) => {
        if (item && !item.deleted) {
          this.repliesLoader.configureKids(item.kids);
          this.comment.set(item);
          this.commentLoaded.set(true);
          // Parent is ready; children loading deferred until expand
          this.loading.set(false);
        } else {
          this.repliesLoader.configureKids([]);
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadMoreReplies() {
    if (!this.loadingMore() && this.hasMoreReplies()) {
      this.repliesLoader.loadNextPage();
    }
  }

  expandReplies() {
    if (!this.repliesLoaded() && !this.loadingReplies()) {
      this.repliesLoader.loadFirstPage();
    }
  }

  toggleCollapse() {
    this.isCollapsed.update((v) => !v);
  }

  upvoteComment() {
    const current = this.comment();
    if (!current) {
      return;
    }

    this.voteStore.vote(current.id);
  }

  hasVotedById(id: number): boolean {
    return this.voteStore.votedCommentIds().has(id);
  }

  upvoteById(id: number) {
    this.voteStore.vote(id);
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
