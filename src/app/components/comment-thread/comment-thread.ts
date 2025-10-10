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
import { CommentStateService } from '../../services/comment-state.service';

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
            [commentId]="commentId"
            [hasChildren]="(comment()?.kids?.length ?? 0) > 0"
            (upvote)="upvoteComment()"
            (expand)="expandReplies()"
          />
        </div>
        <div body>
          @if (!isCollapsed()) {
            <app-comment-text [html]="comment()!.text || ''" />

            @if (replies().length > 0 || loadingReplies()) {
              <div class="mt-2">
                @for (reply of replies(); track reply.id) {
                  @if (reply.kids && reply.kids.length > 0) {
                    <app-comment-thread
                      [commentId]="reply.id"
                      [depth]="depth + 1"
                      [lazyLoad]="true"
                      [initialComment]="reply"
                    ></app-comment-thread>
                  } @else {
                    <app-thread-gutter [depth]="depth + 1" [clickable]="true" [collapsed]="false">
                      <div header>
                        <app-comment-header
                          [by]="reply.by || ''"
                          [timestamp]="reply.time"
                          [voted]="hasVotedById(reply.id)"
                          [repliesCount]="0"
                          [showExpand]="false"
                          [loadingReplies]="false"
                          [commentId]="reply.id"
                          [hasChildren]="false"
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

      /* Collapsed Summary */
      .collapsed-summary {
        @apply flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer;
        @apply bg-gray-50 dark:bg-slate-800/50;
        @apply hover:bg-gray-100 dark:hover:bg-slate-800;
        @apply transition-all duration-200;
        @apply border border-gray-200 dark:border-slate-700;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }

      .summary-participants {
        @apply inline-flex flex-wrap items-center gap-1;
      }

      .summary-counts {
        @apply flex-1 text-sm flex items-center flex-wrap gap-1;
      }

      .chevron-icon {
        @apply flex-shrink-0 text-gray-500 dark:text-gray-400;
        @apply transition-transform duration-200;
      }

      /* Misc */
      .collapsed-text {
        @apply text-sm text-gray-500 dark:text-gray-400 italic;
      }

      /* Animation for expand/collapse */
      @keyframes slide-fade-in {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      :host ::ng-deep .content > div {
        animation: slide-fade-in 200ms ease-out;
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
  private commentStateService = inject(CommentStateService);

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

  // Metadata-based reply count (works even without loading replies)
  metadataReplyCount = computed(() => {
    return this.comment()?.kids?.length || 0;
  });

  // Check if we have loaded reply data with participants
  hasLoadedParticipantData = computed(() => {
    return this.replies().length > 0 && this.participantUsernames().length > 0;
  });

  // Extract unique participant usernames from replies (for collapsed summary)
  participantUsernames = computed(() => {
    const replies = this.replies();
    const usernames = new Set<string>();
    replies.forEach((r) => {
      if (r.by) {
        usernames.add(r.by);
      }
    });
    return Array.from(usernames).slice(0, 3);
  });

  // Count all nested replies recursively
  totalNestedRepliesCount = computed(() => {
    const countReplies = (items: HNItem[]): number => {
      return items.reduce((sum, item) => {
        const directCount = item.kids?.length || 0;
        // If we have loaded replies, count them recursively
        const nestedItems = this.replies().filter((r) => item.kids?.includes(r.id));
        const nestedCount = nestedItems.length > 0 ? countReplies(nestedItems) : 0;
        return sum + directCount + nestedCount;
      }, 0);
    };
    return countReplies(this.replies());
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
      this.restoreCommentState();
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
          this.loading.set(false);
          this.restoreCommentState();
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
      // Save state after page loads
      const newPageCount = this.currentPageValue + 2; // Current is 0-based, we just loaded next
      this.commentStateService.setLoadedPages(this.commentId, newPageCount);
    }
  }

  expandReplies() {
    if (!this.repliesLoaded() && !this.loadingReplies()) {
      // Uncollapse the comment if it's currently collapsed
      if (this.isCollapsed()) {
        this.isCollapsed.set(false);
        this.commentStateService.setCollapsed(this.commentId, false);
      }

      this.repliesLoader.loadFirstPage();
      this.commentStateService.setRepliesExpanded(this.commentId, true);
      this.commentStateService.setLoadedPages(this.commentId, 1);
    }
  }

  toggleCollapse() {
    this.isCollapsed.update((v) => {
      const newValue = !v;
      this.commentStateService.setCollapsed(this.commentId, newValue);
      return newValue;
    });
  }

  private restoreCommentState() {
    const state = this.commentStateService.getState(this.commentId);

    if (state) {
      // Restore collapsed state
      this.isCollapsed.set(state.collapsed);

      // Restore reply expansion and pagination
      // But NOT for lazy-loaded comments that haven't been explicitly loaded yet
      if (state.repliesExpanded && state.loadedPages > 0 && this.commentLoaded()) {
        // Load all previously loaded pages
        const targetPage = state.loadedPages - 1; // Convert to 0-based page index
        this.repliesLoader.loadUpToPage(targetPage, () => {
          // Update state after restoration completes to refresh lastAccessed
          this.commentStateService.setState(this.commentId, state);
        });
      }
    } else if (this.shouldAutoCollapse()) {
      // No saved state - apply auto-collapse heuristic
      this.isCollapsed.set(true);
    }
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

  getIndentClass(): string {
    // Apply appropriate indentation based on depth
    const indentLevel = Math.min(this.depth, 8); // Cap at 8 levels
    return `ml-${indentLevel * 4}`;
  }
}
