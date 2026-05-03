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
} from '@angular/core';

import { SidebarService } from '@services/sidebar.service';
import { SidebarThreadNavigationService } from '@services/sidebar-thread-navigation.service';
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
import { DeviceService } from '@services/device.service';

@Component({
  selector: 'app-sidebar-comments',
  imports: [
    CommentThread,
    SidebarCommentsHeaderComponent,
    SidebarStorySummaryComponent,
    AppButtonComponent,
    CommentSortDropdownComponent,
    CommentThreadToolbarComponent,
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
      [class.sidebar-overlay-dragging]="isSwipeDragging()"
      [class.sidebar-overlay-settling]="isSwipeSettling()"
      [style.opacity]="sidebarOverlayOpacity()"
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
      #sidebarPanel
      class="sidebar-panel fixed right-0 top-0 sm:top-16 bottom-0 w-full sm:w-[80vw] md:w-[60vw] lg:w-[40vw] bg-white/95 dark:bg-slate-950/92 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800/70 shadow-2xl dark:shadow-black/50 transition-transform duration-300 overflow-hidden z-50 lg:z-30"
      [class.translate-x-full]="!sidebarService.isOpen()"
      [class.sidebar-panel-dragging]="isSwipeDragging()"
      [class.sidebar-panel-settling]="isSwipeSettling()"
      [style.transform]="swipeTransform()"
      [attr.inert]="sidebarService.isOpen() ? null : true"
      [attr.aria-hidden]="!sidebarService.isOpen()"
      (pointerdown)="onSidebarPointerDown($event)"
      (pointermove)="onSidebarPointerMove($event)"
      (pointerup)="onSidebarPointerUp($event)"
      (pointercancel)="onSidebarPointerCancel($event)"
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
                <app-sidebar-story-summary [item]="item()!" [boxedText]="true" />

                <hr class="mt-4 border-gray-200 dark:border-slate-700/60" />

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
                  <div class="space-y-4" role="tree" aria-label="Comments">
                    @for (commentId of visibleCommentIds(); track commentId) {
                      <app-comment-thread
                        [commentId]="commentId"
                        [depth]="0"
                        [autoExpandReplies]="smallThreadMode()"
                        [storyAuthor]="item()?.by"
                        [previousVisitedAt]="previousVisitedAt()"
                        [threadContext]="'sidebar'"
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

      .sidebar-comments-panel {
        container-type: inline-size;
        touch-action: pan-y;
      }

      :host ::ng-deep .sidebar-comments-panel .comment-body pre {
        touch-action: pan-x pan-y;
      }

      .sidebar-panel-dragging {
        transition-duration: 0ms;
      }

      .sidebar-panel {
        touch-action: pan-y;
      }

      .sidebar-panel-settling {
        transition-duration: 0ms;
      }

      .sidebar-overlay-dragging {
        transition-duration: 0ms;
      }

      .sidebar-overlay-settling {
        transition-duration: 0ms;
      }

      .comments-heading {
        @apply sticky top-0 z-20 isolate -mx-4 mb-6 flex flex-col gap-2 px-4 py-2 sm:-mx-6 sm:px-6 sm:py-3;
        @apply pointer-events-auto;
        background-color: var(--app-surface);
        border-bottom: 1px solid var(--app-border);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
      }

      .comments-title {
        @apply whitespace-nowrap text-lg font-semibold text-gray-900 dark:text-gray-100;
      }

      .comments-title-row {
        @apply flex min-w-0 items-center justify-between gap-2;
      }

      .comments-controls {
        @apply min-w-0 max-w-full;
      }

      @container (min-width: 48rem) {
        .comments-heading {
          display: grid;
          grid-template-columns: max-content max-content minmax(0, 1fr);
          align-items: center;
          gap: 0.25rem;
        }

        .comments-title-row {
          display: contents;
        }
      }

      @media (orientation: landscape) and (pointer: coarse) and (max-height: 639.98px) {
        .sidebar-overlay,
        .sidebar-panel {
          top: 0 !important;
        }

        .sidebar-panel {
          width: 100vw !important;
          z-index: 50;
        }
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
  private sidebarPanelRef = viewChild<ElementRef<HTMLElement>>('sidebarPanel');
  sidebarService = inject(SidebarService);
  private sidebarThreadNavigation = inject(SidebarThreadNavigationService);
  deviceService = inject(DeviceService);
  private hnService = inject(HackernewsService);
  private visitedService = inject(VisitedService);
  private commentSortService = inject(CommentSortService);
  private commentDisplayStrategy = inject(CommentDisplayStrategyService);
  private commentIndex = inject(CommentThreadIndexService);
  private sidebarKeyboardNav = inject(SidebarKeyboardNavigationService);

  item = signal<HNItem | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Sorting state - use global service
  sortOrder = this.commentSortService.sortOrder;
  allComments = signal<HNItem[]>([]);
  commentsLoading = signal(false);
  previousVisitedAt = signal<number | null>(null);

  private readonly commentsPageSize = 10;
  private readonly smallThreadDescendantsThreshold = 40;
  private readonly swipeEdgeWidth = 24;
  private readonly swipeStartThreshold = 12;
  private readonly swipeHorizontalEarlyIntentThreshold = 24;
  private readonly swipeHorizontalOverrideThreshold = 36;
  private readonly swipeHorizontalIntentRatio = 1.15;
  private readonly swipeHorizontalEarlyIntentRatio = 1.5;
  private readonly swipeHorizontalOverrideRatio = 0.8;
  private readonly swipeVerticalCancelThreshold = 32;
  private readonly swipeMinVelocityDistance = 64;
  private readonly swipeMinVelocityDistanceRatio = 0.18;
  private readonly swipeProjectionMs = 220;
  private readonly swipeReleaseVelocityMaxAgeMs = 80;
  private readonly swipeCloseThresholdRatio = 0.45;
  private readonly swipeMinCloseDurationMs = 180;
  private readonly swipeMaxCloseDurationMs = 320;
  private readonly swipeMinSnapBackDurationMs = 120;
  private readonly swipeMaxSnapBackDurationMs = 360;
  private visibleTopLevelCount = signal(this.commentsPageSize);
  smallThreadMode = signal(false);
  swipeState = signal<'idle' | 'dragging' | 'settling'>('idle');
  isSwipeDragging = computed(() => this.swipeState() === 'dragging');
  isSwipeSettling = computed(() => this.swipeState() === 'settling');
  private swipeOffset = signal(0);
  private swipePointerId: number | null = null;
  private swipeStartX = 0;
  private swipeStartY = 0;
  private swipePreviousDeltaX = 0;
  private swipePreviousTime = 0;
  private swipeVelocity = 0;
  private swipeIntent: 'pending' | 'horizontal' | 'vertical' | null = null;
  private swipeAnimationFrame: number | null = null;
  private swipeQueuedOffset = 0;
  private swipeSettleAnimationFrame: number | null = null;
  private swipeSettleStartTime = 0;
  private swipeSettleFromOffset = 0;
  private swipeSettleTargetOffset = 0;
  private swipeSettleDuration = 0;
  private swipeSettleShouldClose = false;
  private contentPanPointerId: number | null = null;
  private contentPanElement: HTMLElement | null = null;
  private contentPanStartX = 0;
  private contentPanStartY = 0;
  private contentPanStartScrollLeft = 0;
  private contentPanIntent: 'pending' | 'horizontal' | null = null;

  swipeTransform = computed(() => {
    if (this.swipeState() === 'settling') {
      return `translateX(${this.swipeOffset()}px)`;
    }

    if (this.swipeState() === 'dragging') {
      return `translateX(${Math.max(0, this.swipeOffset())}px)`;
    }

    const offset = this.swipeOffset();
    return offset > 0 ? `translateX(${offset}px)` : null;
  });

  sidebarOverlayOpacity = computed(() => {
    if (!this.sidebarService.isOpen() || this.swipeState() === 'idle') {
      return null;
    }

    const panelWidth = this.sidebarPanelRef()?.nativeElement.getBoundingClientRect().width ?? 1;
    const progress = Math.min(Math.max(this.swipeOffset() / panelWidth, 0), 1);
    return Math.max(0, 1 - progress * 0.85);
  });

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
        untracked(() => this.loadItem(id));
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

    // Lock body scroll when sidebar is open on mobile devices
    effect(() => {
      const open = this.sidebarService.isOpen();
      const mobile = this.deviceService.isMobile();
      if (open && mobile) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  private loadItem(id: number): void {
    const inheritedPreviousVisitedAt = this.commentIndex.hasComment('sidebar', id)
      ? this.commentIndex.getPreviousVisitedAt('sidebar')
      : null;

    this.loading.set(true);
    this.error.set(null);
    this.visibleTopLevelCount.set(this.commentsPageSize);
    this.smallThreadMode.set(false);

    // Reset cached comments (but keep sort order global)
    this.allComments.set([]);
    this.commentsLoading.set(false);
    this.previousVisitedAt.set(null);
    this.commentIndex.clearContext('sidebar');

    this.hnService.getItem(id).subscribe({
      next: (item) => {
        if (item) {
          this.item.set(item);
          this.applyCommentDisplayStrategy(item);
          const previousVisitedAt =
            this.visitedService.getCommentsVisitedData(item.id)?.visitedAt ??
            inheritedPreviousVisitedAt ??
            null;
          this.previousVisitedAt.set(previousVisitedAt);
          this.commentIndex.configureContext('sidebar', item, { previousVisitedAt });
          this.visitedService.markCommentsVisited(item.id, item.descendants ?? item.kids?.length);
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

  onSidebarPointerDown(event: PointerEvent): void {
    const horizontalContent = this.getHorizontalContentTarget(event.target);
    if (horizontalContent && event.button === 0) {
      this.startContentPan(event, horizontalContent);
      return;
    }

    if (!this.sidebarService.isOpen() || event.button !== 0 || !this.canStartSidebarSwipe(event)) {
      return;
    }

    this.swipePointerId = event.pointerId;
    this.swipeStartX = event.clientX;
    this.swipeStartY = event.clientY;
    this.swipePreviousDeltaX = 0;
    this.swipePreviousTime = event.timeStamp;
    this.swipeVelocity = 0;
    this.swipeIntent = 'pending';
    this.swipeOffset.set(0);
    this.swipeState.set('dragging');
    this.cancelSwipeSettleAnimation();

    try {
      this.sidebarPanelRef()?.nativeElement.setPointerCapture(event.pointerId);
    } catch {
      this.swipePointerId = null;
      this.swipeIntent = null;
      this.swipeState.set('idle');
    }
  }

  onSidebarPointerMove(event: PointerEvent): void {
    if (this.contentPanPointerId === event.pointerId) {
      this.handleContentPanMove(event);
      return;
    }

    if (this.swipePointerId !== event.pointerId || this.swipeIntent === null) {
      return;
    }

    const deltaX = event.clientX - this.swipeStartX;
    const deltaY = event.clientY - this.swipeStartY;
    this.trackSwipeSample(deltaX, event.timeStamp);

    if (this.swipeIntent === 'pending') {
      this.resolveSwipeIntent(deltaX, deltaY, false);
      if (this.swipeIntent === 'pending') {
        return;
      }
    }

    if (this.swipeIntent !== 'horizontal') {
      if (this.swipeIntent === 'vertical') {
        this.resetSidebarSwipe();
      }
      return;
    }

    if (this.shouldCancelProvisionalHorizontalSwipe(deltaX, deltaY)) {
      this.resetSidebarSwipe();
      return;
    }

    event.preventDefault();
    this.queueSwipeOffset(Math.max(0, deltaX));
  }

  onSidebarPointerUp(event: PointerEvent): void {
    if (this.contentPanPointerId === event.pointerId) {
      this.resetContentPan();
      return;
    }

    if (this.swipePointerId !== event.pointerId) {
      return;
    }

    this.finishSidebarSwipe(event, false);
  }

  onSidebarPointerCancel(event: PointerEvent): void {
    if (this.contentPanPointerId === event.pointerId) {
      this.resetContentPan();
      return;
    }

    if (this.swipePointerId !== event.pointerId) {
      return;
    }

    this.finishSidebarSwipe(event, true);
  }

  onBack(): void {
    void this.sidebarThreadNavigation.goBack();
  }

  onDismiss(): void {
    this.sidebarThreadNavigation.closeSidebar();
  }

  private canStartSidebarSwipe(event: PointerEvent): boolean {
    const panel = this.sidebarPanelRef()?.nativeElement;
    if (!panel || !this.isSidebarFullViewportWidth(panel)) {
      return false;
    }

    if (
      this.isInteractiveSwipeTarget(event.target) ||
      this.getHorizontalContentTarget(event.target)
    ) {
      return false;
    }

    const rect = panel.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.left + this.swipeEdgeWidth;
  }

  private isSidebarFullViewportWidth(panel: HTMLElement): boolean {
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    return panel.getBoundingClientRect().width >= viewportWidth - 1;
  }

  private isInteractiveSwipeTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return Boolean(
      target.closest(
        'button, a, input, select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"]',
      ),
    );
  }

  private getHorizontalContentTarget(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    return target.closest('.comment-body pre');
  }

  private startContentPan(event: PointerEvent, element: HTMLElement): void {
    this.contentPanPointerId = event.pointerId;
    this.contentPanElement = element;
    this.contentPanStartX = event.clientX;
    this.contentPanStartY = event.clientY;
    this.contentPanStartScrollLeft = element.scrollLeft;
    this.contentPanIntent = 'pending';
  }

  private handleContentPanMove(event: PointerEvent): void {
    if (!this.contentPanElement || this.contentPanIntent === null) {
      return;
    }

    const deltaX = event.clientX - this.contentPanStartX;
    const deltaY = event.clientY - this.contentPanStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (this.contentPanIntent === 'pending') {
      if (
        absDeltaY >= this.swipeVerticalCancelThreshold &&
        absDeltaY >= absDeltaX * this.swipeHorizontalIntentRatio
      ) {
        this.resetContentPan();
        return;
      }

      if (
        absDeltaX < this.swipeStartThreshold ||
        absDeltaX < absDeltaY * this.swipeHorizontalIntentRatio
      ) {
        return;
      }

      this.contentPanIntent = 'horizontal';
    }

    event.preventDefault();
    this.contentPanElement.scrollLeft = this.contentPanStartScrollLeft - deltaX;
  }

  private resetContentPan(): void {
    this.contentPanPointerId = null;
    this.contentPanElement = null;
    this.contentPanIntent = null;
    this.contentPanStartX = 0;
    this.contentPanStartY = 0;
    this.contentPanStartScrollLeft = 0;
  }

  private finishSidebarSwipe(event: PointerEvent, fromCancel: boolean): void {
    const deltaX = event.clientX - this.swipeStartX;
    const deltaY = event.clientY - this.swipeStartY;
    const previousDeltaX = this.swipePreviousDeltaX;
    const previousTime = this.swipePreviousTime;
    const previousVelocity = this.swipeVelocity;
    const intentBeforeFinish = this.swipeIntent;
    this.trackSwipeSample(deltaX, event.timeStamp);

    if (fromCancel && intentBeforeFinish !== 'horizontal') {
      this.resetSidebarSwipe();
      return;
    }

    if (!fromCancel) {
      this.resolveSwipeIntent(deltaX, deltaY, false);
    }

    if (this.swipeIntent !== 'horizontal') {
      this.resetSidebarSwipe();
      return;
    }

    const offset = Math.max(deltaX, 0);
    const panelWidth = this.sidebarPanelRef()?.nativeElement.getBoundingClientRect().width ?? 0;
    const distanceThreshold = panelWidth * this.swipeCloseThresholdRatio;
    const velocityDistanceThreshold = Math.max(
      this.swipeMinVelocityDistance,
      panelWidth * this.swipeMinVelocityDistanceRatio,
    );
    const canReusePreviousVelocity =
      deltaX === previousDeltaX &&
      event.timeStamp - previousTime <= this.swipeReleaseVelocityMaxAgeMs;
    const releaseVelocity = Math.max(
      canReusePreviousVelocity ? previousVelocity : this.swipeVelocity,
      0,
    );
    const projectedOffset = offset + releaseVelocity * this.swipeProjectionMs;
    const shouldDismiss = fromCancel
      ? offset >= distanceThreshold
      : offset >= distanceThreshold ||
        (offset >= velocityDistanceThreshold && projectedOffset >= distanceThreshold);

    this.releasePointerCapture();

    if (shouldDismiss) {
      this.settleSidebarSwipe(offset, panelWidth, true, releaseVelocity);
    } else {
      this.settleSidebarSwipe(offset, 0, false, releaseVelocity);
    }
  }

  private trackSwipeSample(deltaX: number, timeStamp: number): void {
    const elapsed = Math.max(1, timeStamp - this.swipePreviousTime);
    this.swipeVelocity = (deltaX - this.swipePreviousDeltaX) / elapsed;
    this.swipePreviousDeltaX = deltaX;
    this.swipePreviousTime = timeStamp;
  }

  private resolveSwipeIntent(deltaX: number, deltaY: number, fromCancel: boolean): void {
    if (this.swipeIntent !== 'pending') {
      return;
    }

    const horizontalIntent =
      deltaX >= this.swipeStartThreshold &&
      ((deltaX >= this.swipeHorizontalOverrideThreshold &&
        deltaX >= Math.abs(deltaY) * this.swipeHorizontalOverrideRatio) ||
        (deltaX >= this.swipeHorizontalEarlyIntentThreshold &&
          deltaX >= Math.abs(deltaY) * this.swipeHorizontalEarlyIntentRatio));

    if (horizontalIntent) {
      this.swipeIntent = 'horizontal';
      return;
    }

    const verticalIntent =
      !fromCancel &&
      Math.abs(deltaY) >= this.swipeVerticalCancelThreshold &&
      Math.abs(deltaY) >= Math.max(deltaX, 0) * this.swipeHorizontalIntentRatio;

    if (verticalIntent) {
      this.swipeIntent = 'vertical';
    }
  }

  private shouldCancelProvisionalHorizontalSwipe(deltaX: number, deltaY: number): boolean {
    return (
      deltaX < this.swipeHorizontalOverrideThreshold &&
      Math.abs(deltaY) >= this.swipeVerticalCancelThreshold &&
      Math.abs(deltaY) >= Math.max(deltaX, 0) * this.swipeHorizontalIntentRatio
    );
  }

  private resetSidebarSwipe(): void {
    this.releasePointerCapture();
    this.cancelSwipeAnimationFrame();
    this.cancelSwipeSettleAnimation();

    this.swipePointerId = null;
    this.swipeIntent = null;
    this.swipePreviousDeltaX = 0;
    this.swipePreviousTime = 0;
    this.swipeVelocity = 0;
    this.swipeState.set('idle');
    this.swipeOffset.set(0);
  }

  private settleSidebarSwipe(
    fromOffset: number,
    targetOffset: number,
    shouldClose: boolean,
    releaseVelocity: number,
  ): void {
    this.cancelSwipeAnimationFrame();
    this.swipeState.set('settling');
    this.swipeOffset.set(Math.max(0, fromOffset));

    const distance = Math.abs(targetOffset - fromOffset);
    const panelWidth = this.sidebarPanelRef()?.nativeElement.getBoundingClientRect().width ?? 1;
    const distanceRatio = Math.min(distance / panelWidth, 1);
    const minDuration = shouldClose
      ? this.swipeMinCloseDurationMs
      : this.swipeMinSnapBackDurationMs;
    const maxDuration = shouldClose
      ? this.swipeMaxCloseDurationMs
      : this.swipeMaxSnapBackDurationMs;

    this.swipeSettleStartTime = 0;
    this.swipeSettleFromOffset = Math.max(0, fromOffset);
    this.swipeSettleTargetOffset = Math.max(0, targetOffset);
    const baseDuration = minDuration + (maxDuration - minDuration) * distanceRatio;
    const velocityReduction = shouldClose ? Math.min(Math.max(releaseVelocity, 0) * 90, 90) : 0;
    this.swipeSettleDuration = Math.round(Math.max(minDuration, baseDuration - velocityReduction));
    this.swipeSettleShouldClose = shouldClose;
    this.cancelSwipeSettleAnimation();
    this.swipeSettleAnimationFrame = requestAnimationFrame((time) =>
      this.stepSidebarSwipeSettle(time),
    );
  }

  private stepSidebarSwipeSettle(time: number): void {
    if (this.swipeSettleStartTime === 0) {
      this.swipeSettleStartTime = time;
    }

    const elapsed = Math.max(0, time - this.swipeSettleStartTime);
    const progress = Math.min(elapsed / this.swipeSettleDuration, 1);
    const easedProgress = this.iosEaseOut(progress);
    const offset =
      this.swipeSettleFromOffset +
      (this.swipeSettleTargetOffset - this.swipeSettleFromOffset) * easedProgress;
    this.swipeOffset.set(offset);

    if (progress < 1) {
      this.swipeSettleAnimationFrame = requestAnimationFrame((nextTime) =>
        this.stepSidebarSwipeSettle(nextTime),
      );
      return;
    }

    const shouldClose = this.swipeSettleShouldClose;
    this.resetSidebarSwipe();

    if (shouldClose) {
      this.sidebarThreadNavigation.closeSidebar();
    }
  }

  private iosEaseOut(progress: number): number {
    const inverse = 1 - progress;
    return 1 - inverse * inverse * inverse * inverse;
  }

  private queueSwipeOffset(offset: number): void {
    this.swipeQueuedOffset = offset;

    if (this.swipeAnimationFrame !== null) {
      return;
    }

    this.swipeAnimationFrame = requestAnimationFrame(() => {
      this.swipeAnimationFrame = null;
      this.swipeOffset.set(this.swipeQueuedOffset);
    });
  }

  private cancelSwipeAnimationFrame(): void {
    if (this.swipeAnimationFrame === null) {
      return;
    }

    cancelAnimationFrame(this.swipeAnimationFrame);
    this.swipeAnimationFrame = null;
  }

  private cancelSwipeSettleAnimation(): void {
    if (this.swipeSettleAnimationFrame === null) {
      return;
    }

    cancelAnimationFrame(this.swipeSettleAnimationFrame);
    this.swipeSettleAnimationFrame = null;
  }

  private releasePointerCapture(): void {
    if (this.swipePointerId === null) {
      return;
    }

    const panel = this.sidebarPanelRef()?.nativeElement;
    if (!panel?.hasPointerCapture(this.swipePointerId)) {
      return;
    }

    try {
      panel.releasePointerCapture(this.swipePointerId);
    } catch {
      // The browser may have already cancelled the pointer stream.
    }
  }
}
