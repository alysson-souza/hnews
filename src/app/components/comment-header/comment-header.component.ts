// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, inject, computed, output, input, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarAltArrowDownLinear, solarAltArrowRightLinear } from '@ng-icons/solar-icons/linear';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { RepliesCounterComponent } from '../replies-counter/replies-counter.component';
import { OPBadgeComponent } from '../shared/op-badge/op-badge.component';
import { SidebarThreadNavigationService } from '@services/sidebar-thread-navigation.service';
import { DeviceService } from '@services/device.service';
import { ItemKeyboardNavigationService } from '@services/item-keyboard-navigation.service';
import { CommentThreadIndexService } from '@services/comment-thread-index.service';

export type CommentHeaderDensity = 'default' | 'compact';

@Component({
  selector: 'app-comment-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UserTagComponent,
    RelativeTimePipe,
    RepliesCounterComponent,
    OPBadgeComponent,
    NgIconComponent,
    RouterLink,
  ],
  viewProviders: [provideIcons({ solarAltArrowDownLinear, solarAltArrowRightLinear })],
  template: `
    <div class="comment-header" [class.comment-header-compact]="density() === 'compact'">
      @if (showCollapseToggle()) {
        <button
          type="button"
          class="collapse-toggle"
          (click)="onToggleCollapse($event)"
          [attr.aria-label]="collapsed() ? 'Expand comment' : 'Collapse comment'"
          [attr.aria-expanded]="!collapsed()"
        >
          <ng-icon
            [name]="collapsed() ? 'solarAltArrowRightLinear' : 'solarAltArrowDownLinear'"
            class="collapse-icon"
            aria-hidden="true"
          />
        </button>
      }
      @if (by()) {
        <app-user-tag [username]="by()!" />
        @if (isOP()) {
          <app-op-badge />
        }
      }

      @if (commentId()) {
        <a
          class="time-text permalink-time"
          [routerLink]="['/item', commentId()]"
          [title]="'Permalink for comment ' + commentId()"
          [attr.aria-label]="'Open permalink for comment ' + commentId()"
        >
          {{ timestamp() | relativeTime }}
        </a>
      } @else {
        <span class="time-text">{{ timestamp() | relativeTime }}</span>
      }

      @if (showExpand()) {
        <app-replies-counter
          [count]="repliesCount()"
          [loading]="loadingReplies()"
          (expand)="expand.emit()"
        />
      }

      @if (hasChildren() && commentId()) {
        <button
          type="button"
          (click)="onViewThread($event)"
          class="view-thread-inline"
          title="View this thread"
          [attr.aria-label]="'View thread for comment ' + commentId()"
          role="button"
        >
          »
        </button>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      :host {
        display: block;
        width: 100%;
      }

      .comment-header {
        @apply flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-slate-400;
        @apply w-full;
        min-height: 1.25rem;
      }
      .comment-header-compact {
        min-height: 0;
      }
      .time-text {
        @apply text-gray-500 dark:text-slate-500;
      }
      .permalink-time {
        @apply rounded px-1 -mx-1;
        @apply hover:text-blue-600 dark:hover:text-blue-300 hover:underline;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }
      .collapse-toggle {
        @apply inline-flex items-center justify-center;
        @apply rounded-md;
        @apply text-gray-500 dark:text-slate-400;
        @apply hover:bg-gray-100 dark:hover:bg-slate-700;
        @apply transition-colors duration-150;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
        @apply cursor-pointer;
        @apply p-0.5 -ml-1;
        margin-right: -0.25rem;
      }
      .collapse-icon {
        @apply text-sm;
      }
      .view-thread-inline {
        @apply inline-flex items-center justify-center;
        @apply rounded-md;
        @apply text-blue-600 dark:text-blue-400;
        @apply hover:bg-blue-50 dark:hover:bg-blue-900/20;
        @apply font-bold text-base;
        @apply transition-colors duration-150;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
        @apply cursor-pointer;
        @apply ml-auto;
        padding: 0 0 0 0.5rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }
      .comment-header-compact .view-thread-inline {
        padding-left: 0.375rem;
      }
    `,
  ],
})
export class CommentHeaderComponent {
  private sidebarThreadNavigation = inject(SidebarThreadNavigationService);
  private router = inject(Router);
  private deviceService = inject(DeviceService);
  private itemKeyboardNav = inject(ItemKeyboardNavigationService);
  private commentIndex = inject(CommentThreadIndexService);

  readonly by = input<string>();
  readonly timestamp = input.required<number>();
  readonly repliesCount = input(0);
  readonly showExpand = input(false);
  readonly loadingReplies = input(false);
  readonly commentId = input<number>();
  readonly hasChildren = input(false);
  readonly storyAuthor = input<string>();
  readonly isStandalonePage = input(false);
  readonly collapsed = input(false);
  readonly showCollapseToggle = input(false);
  readonly density = input<CommentHeaderDensity>('default');

  readonly expand = output<void>();
  readonly toggleCollapse = output<void>();

  isOP = computed(() => {
    const storyAuthor = this.storyAuthor();
    const by = this.by();
    return by && storyAuthor && by === storyAuthor;
  });

  onToggleCollapse(event: Event): void {
    event.stopPropagation();
    this.toggleCollapse.emit();
  }

  onViewThread(event: Event): void {
    event.stopPropagation();
    const commentId = this.commentId();
    if (!commentId) return;

    if (this.isStandalonePage()) {
      if (typeof window !== 'undefined') {
        const currentState = window.history.state ?? {};
        window.history.replaceState(
          {
            ...currentState,
            __hnewsThreadReturnScrollY: window.scrollY,
          },
          '',
        );
      }
      this.itemKeyboardNav.navigateToThread(commentId);
    } else {
      this.sidebarThreadNavigation.pushThread(commentId, { selectFirstVisibleOnOpen: true });
    }
  }
}
