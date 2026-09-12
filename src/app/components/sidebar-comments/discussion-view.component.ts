// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import {
  Component,
  inject,
  signal,
  effect,
  computed,
  ElementRef,
  viewChild,
  untracked,
  input,
  DestroyRef,
  afterRenderEffect,
} from '@angular/core';

import { DiscussionEntry, SidebarService } from '@services/sidebar.service';
import { HackernewsService } from '@services/hackernews.service';
import { HNItem } from '@models/hn';
import { CommentThread } from '../comment-thread/comment-thread';
import { SidebarCommentsHeaderComponent } from './sidebar-comments-header.component';
import { SidebarStorySummaryComponent } from './sidebar-story-summary.component';
import { AppButtonComponent } from '../shared/app-button/app-button.component';
import { VisitedService } from '@services/visited.service';
import { CommentSortService } from '@services/comment-sort.service';
import { CommentDisplayStrategyService } from '@services/comment-display-strategy.service';
import {
  CommentSortDropdownComponent,
  CommentSortOrder,
} from '../shared/comment-sort-dropdown/comment-sort-dropdown.component';
import { CommentThreadToolbarComponent } from '../comment-tools/comment-thread-toolbar.component';
import { CommentThreadIndexService } from '@services/comment-thread-index.service';
import { SidebarKeyboardNavigationService } from '@services/sidebar-keyboard-navigation.service';
import { CommentSkeletonComponent } from '../comment-skeleton/comment-skeleton.component';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommentStateService } from '@services/comment-state.service';
@Component({
  selector: 'app-discussion-view',
  providers: [CommentStateService],
  imports: [
    CommentThread,
    SidebarCommentsHeaderComponent,
    SidebarStorySummaryComponent,
    AppButtonComponent,
    CommentSortDropdownComponent,
    CommentThreadToolbarComponent,
    CommentSkeletonComponent,
  ],
  host: {
    '[attr.data-entry-key]': 'entry().key',
    '[attr.data-active]': 'active()',
    '[attr.inert]': 'active() ? null : ""',
    '[attr.aria-hidden]': '!active()',
  },
  template: `
    <div class="h-full flex flex-col">
      <!-- Header -->
      <app-sidebar-comments-header
        [canGoBack]="entry().index > 0"
        [itemId]="entry().itemId"
        (dismiss)="sidebarService.close()"
        (back)="sidebarService.back()"
      />

      <!-- Content -->
      <div
        #sidebarContent
        class="sidebar-comments-panel flex-1 overflow-y-auto overscroll-contain focus:outline-none"
        tabindex="-1"
        (scroll)="saveScroll()"
        (wheel)="stopScrollRestoration()"
        (touchstart)="stopScrollRestoration()"
        (pointerdown)="stopScrollRestoration()"
        (keydown)="onReadingKeydown($event)"
      >
        <div class="comments-body">
          @if (loading()) {
            <div class="skeleton comments-list">
              <div class="h-20 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
              <div class="h-20 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
              <div class="h-20 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
            </div>
          } @else if (item()) {
            <!-- Story Details -->
            <app-sidebar-story-summary [item]="item()!" [boxedText]="true" />

            <hr class="comments-divider" />

            <!-- Comments Header with Sort -->
            <div class="comments-heading">
              <div class="comments-title-row">
                <h4 class="comments-title">Comments ({{ item()!.kids?.length || 0 }})</h4>

                <app-comment-sort-dropdown
                  [sortOrder]="sortOrder()"
                  [loading]="commentsLoading()"
                  (sortChange)="onSortChange($event)"
                />
              </div>

              <div class="comments-controls">
                <app-comment-thread-toolbar
                  (nextUnread)="jumpToNextUnread()"
                  (nextOP)="jumpToNextOP()"
                  (expandAll)="expandAllComments()"
                  (collapseAll)="collapseAllComments()"
                />
              </div>
            </div>

            @if (item()!.kids && item()!.kids!.length > 0) {
              @if (commentsSortPending()) {
                <div
                  class="comments-list"
                  role="status"
                  aria-label="Sorting comments"
                  aria-live="polite"
                  aria-busy="true"
                >
                  @for (row of commentSortSkeletonRows; track row) {
                    <app-comment-skeleton [depth]="0" />
                  }
                </div>
              } @else {
                <div class="comments-list" role="tree" aria-label="Comments">
                  @for (commentId of visibleCommentIds(); track commentId) {
                    <app-comment-thread
                      [commentId]="commentId"
                      [depth]="0"
                      [autoExpandReplies]="smallThreadMode()"
                      [storyAuthor]="item()?.by"
                      [previousVisitedAt]="previousVisitedAt()"
                      [threadContext]="context()"
                    />
                  }
                </div>

                @if (hasMoreTopLevelComments()) {
                  <div class="comments-load-more">
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
  `,
  styles: [
    `
      @reference '../../../styles.css';
      :host {
        display: block;
        height: 100%;
        background: var(--app-surface);
      }
      .sidebar-comments-panel {
        container-type: inline-size;
      }
      .comments-body {
        --sidebar-comments-inline-padding: 18px;

        padding-block: var(--thread-gap);
        padding-inline: var(--sidebar-comments-inline-padding);
      }

      .comments-list {
        display: flex;
        flex-direction: column;
        gap: var(--thread-gap);
      }

      .comments-load-more {
        display: flex;
        justify-content: center;
        margin-top: var(--thread-gap);
      }

      .comments-divider {
        margin-block-start: var(--thread-gap);
        margin-block-end: 0;
        border-color: var(--app-border);
      }

      .comments-heading {
        @apply sticky top-0 z-20 isolate flex flex-col;
        @apply pointer-events-auto;
        gap: var(--thread-gap);
        margin-inline: calc(var(--sidebar-comments-inline-padding) * -1);
        margin-bottom: var(--thread-gap);
        padding-block: var(--thread-gap);
        padding-inline: var(--sidebar-comments-inline-padding);
        background-color: var(--app-surface);
        border-bottom: 1px solid var(--app-border);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
      }

      .comments-title {
        @apply whitespace-nowrap text-lg font-semibold text-gray-900 dark:text-gray-100;
      }

      .comments-title-row {
        @apply flex min-w-0 items-center justify-between;
        gap: var(--thread-gap);
      }

      .comments-controls {
        @apply min-w-0 max-w-full;
      }

      @container (min-width: 48rem) {
        .comments-heading {
          display: grid;
          grid-template-columns: max-content max-content minmax(0, 1fr);
          align-items: center;
          gap: var(--thread-gap);
        }

        .comments-title-row {
          display: contents;
        }
      }
    `,
  ],
})
export class DiscussionViewComponent {
  readonly entry = input.required<DiscussionEntry>();
  readonly active = input(false);
  readonly context = computed(() => `sidebar-${this.entry().key}` as const);
  private sidebarContentRef = viewChild<ElementRef<HTMLElement>>('sidebarContent');
  readonly sidebarService = inject(SidebarService);
  private hnService = inject(HackernewsService);
  private visitedService = inject(VisitedService);
  private commentSortService = inject(CommentSortService);
  private commentDisplayStrategy = inject(CommentDisplayStrategyService);
  private commentIndex = inject(CommentThreadIndexService);
  private sidebarKeyboardNav = inject(SidebarKeyboardNavigationService);
  private commentState = inject(CommentStateService);
  private destroyRef = inject(DestroyRef);
  item = signal<HNItem | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Sorting state - use global service
  sortOrder = this.commentSortService.sortOrder;
  allComments = signal<HNItem[]>([]);
  commentsLoading = signal(false);
  private sortFailed = signal(false);
  previousVisitedAt = signal<number | null>(null);
  readonly commentSortSkeletonRows = [0, 1, 2] as const;
  private topLevelCommentsLoadedForSort = signal(false);

  private readonly commentsPageSize = 10;
  private readonly smallThreadDescendantsThreshold = 40;
  visibleTopLevelCount = signal(10);
  smallThreadMode = signal(false);
  private topLevelCommentsReadyForSort = computed(() => {
    return this.topLevelCommentsLoadedForSort() || this.allComments().length > 0;
  });

  commentsSortPending = computed(() => {
    return (
      this.sortOrder() !== 'default' &&
      !this.sortFailed() &&
      (this.item()?.kids?.length ?? 0) > 0 &&
      !this.topLevelCommentsReadyForSort()
    );
  });

  sortedCommentIds = computed(() => {
    if (this.commentsSortPending()) {
      return [];
    }

    const order = this.sortFailed() ? 'default' : this.sortOrder();
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

  private restoreScrollTop: number | null = null;

  constructor() {
    effect(() => {
      const entry = this.entry();
      untracked(() => {
        if (entry.state.commentStates) this.commentState.restore(entry.state.commentStates);
        if (entry.state.item) {
          this.item.set(entry.state.item);
          this.applyCommentDisplayStrategy(entry.state.item);
          this.visibleTopLevelCount.set(entry.state.visibleCount);
          this.allComments.set(entry.state.comments);
          this.previousVisitedAt.set(entry.state.previousVisitedAt);
          this.commentIndex.configureContext(this.context(), entry.state.item, {
            previousVisitedAt: entry.state.previousVisitedAt,
          });
        } else this.loadItem(entry.itemId);
      });
    });
    effect(() => {
      const order = this.sortOrder();
      const item = this.item();
      if (item && order !== 'default') untracked(() => this.loadAllComments());
    });
    effect(() => {
      const active = this.active();
      const item = this.item();
      if (active && item && !this.entry().state.visited) {
        untracked(() => {
          this.entry().state.visited = true;
          this.entry().state.previousVisitedAt = this.previousVisitedAt();
          this.visitedService.markCommentsVisited(item.id, item.descendants ?? item.kids?.length);
        });
      }
    });
    afterRenderEffect(() => {
      const active = this.active();
      this.loading();
      const container = this.sidebarContentRef()?.nativeElement;
      if (!container) return;
      untracked(() => {
        this.restoreScrollTop = this.entry().state.scrollTop;
        this.restoreScroll(container);
        if (active) {
          container.focus({ preventScroll: true });
          this.applyOpeningIntent(container);
        }
      });
    });
    afterRenderEffect((onCleanup) => {
      const container = this.sidebarContentRef()?.nativeElement;
      if (!container || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => {
        this.restoreScroll(container);
        this.applyOpeningIntent(container);
      });
      const mutations = new MutationObserver(() => {
        this.restoreScroll(container);
        this.applyOpeningIntent(container);
      });
      mutations.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-busy'],
      });
      observer.observe(container.firstElementChild!);
      onCleanup(() => {
        observer.disconnect();
        mutations.disconnect();
      });
    });
    this.destroyRef.onDestroy(() => {
      const state = this.entry().state;
      state.visibleCount = this.visibleTopLevelCount();
      state.comments = this.allComments();
      state.commentStates = this.commentState.snapshot();
      this.commentIndex.releaseContext(this.context());
    });
  }
  private applyOpeningIntent(container: HTMLElement): void {
    const state = this.entry().state;
    if (!this.active() || (!state.selectFirst && !state.scrollFirst)) return;
    const first = container.querySelector<HTMLElement>('[role="treeitem"]');
    if (!first) return;
    const toolbar = container.querySelector('.comments-heading');
    container.scrollTop +=
      first.getBoundingClientRect().top -
      container.getBoundingClientRect().top -
      (toolbar?.getBoundingClientRect().height ?? 0) -
      16;
    if (state.selectFirst)
      this.sidebarKeyboardNav.selectFirstVisibleComment({ scrollIntoView: false });
    state.selectFirst = false;
    state.scrollFirst = false;
  }
  private finishScrollRestoration(container: HTMLElement): void {
    this.restoreScrollTop = null;
    this.entry().state.scrollTop = container.scrollTop;
  }
  private restoreScroll(container: HTMLElement): void {
    if (this.restoreScrollTop === null) return;
    const maximum = Math.max(0, container.scrollHeight - container.clientHeight);
    container.scrollTop = Math.min(this.restoreScrollTop, maximum);
    const settled =
      !this.loading() && !this.commentsLoading() && !container.querySelector('[aria-busy="true"]');
    if (maximum >= this.restoreScrollTop || settled) this.finishScrollRestoration(container);
  }
  stopScrollRestoration(): void {
    const container = this.sidebarContentRef()?.nativeElement;
    if (this.restoreScrollTop !== null && container) this.finishScrollRestoration(container);
  }
  onReadingKeydown(event: KeyboardEvent): void {
    if (
      [
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End',
        ' ',
        'j',
        'k',
        'J',
        'K',
      ].includes(event.key)
    ) {
      this.stopScrollRestoration();
    }
  }
  saveScroll(): void {
    if (this.restoreScrollTop !== null) return;
    this.entry().state.scrollTop = this.sidebarContentRef()?.nativeElement.scrollTop ?? 0;
  }
  private loadItem(id: number): void {
    const inheritedPreviousVisitedAt = this.commentIndex.hasComment(this.context(), id)
      ? this.commentIndex.getPreviousVisitedAt(this.context())
      : null;

    this.loading.set(true);
    this.error.set(null);
    this.visibleTopLevelCount.set(this.commentsPageSize);
    this.smallThreadMode.set(false);

    // Reset cached comments (but keep sort order global)
    this.allComments.set([]);
    this.commentsLoading.set(false);
    this.topLevelCommentsLoadedForSort.set(false);
    this.previousVisitedAt.set(null);
    this.commentIndex.clearContext(this.context());

    this.hnService
      .getItem(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => {
          if (item) {
            const alreadyLoaded = this.item()?.id === item.id;
            this.item.set(item);
            if (alreadyLoaded) {
              this.entry().state.item = item;
              this.loading.set(false);
              return;
            }
            this.applyCommentDisplayStrategy(item);
            const previousVisitedAt =
              this.entry().state.previousVisitedAt ??
              this.visitedService.getCommentsVisitedData(item.id)?.visitedAt ??
              inheritedPreviousVisitedAt ??
              null;
            this.previousVisitedAt.set(previousVisitedAt);
            this.commentIndex.configureContext(this.context(), item, { previousVisitedAt });
            this.entry().state.item = item;
            this.loadCommentsForActiveSort();
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
    this.sortFailed.set(false);
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

  private loadAllComments(): void {
    if (this.commentsLoading() || this.sortFailed() || this.topLevelCommentsLoadedForSort()) return;
    if (this.allComments().length > 0) {
      this.topLevelCommentsLoadedForSort.set(true);
      return;
    }

    const storyId = this.item()?.id;
    if (!storyId) {
      return;
    }

    this.commentsLoading.set(true);

    this.hnService
      .getStoryTopLevelComments(storyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          this.allComments.set(comments);
          this.topLevelCommentsLoadedForSort.set(true);
          this.commentsLoading.set(false);
        },
        error: () => {
          this.commentsLoading.set(false);
          this.sortFailed.set(true);
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

  jumpToNextUnread(): void {
    this.sidebarKeyboardNav.selectNextUnreadComment();
  }

  jumpToNextOP(): void {
    this.sidebarKeyboardNav.selectNextOPComment();
  }

  expandAllComments(): void {
    this.sidebarKeyboardNav.expandAllComments();
  }

  collapseAllComments(): void {
    this.sidebarKeyboardNav.collapseAllComments();
  }
}
