// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, computed, output, input, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { UpvoteButtonComponent } from '../upvote-button/upvote-button.component';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { RepliesCounterComponent } from '../replies-counter/replies-counter.component';
import { OPBadgeComponent } from '../shared/op-badge/op-badge.component';
import { SidebarThreadNavigationService } from '../../services/sidebar-thread-navigation.service';
import { DeviceService } from '../../services/device.service';
import { ItemKeyboardNavigationService } from '../../services/item-keyboard-navigation.service';

@Component({
  selector: 'app-comment-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UpvoteButtonComponent,
    UserTagComponent,
    RelativeTimePipe,
    RepliesCounterComponent,
    OPBadgeComponent,
  ],
  template: `
    <div class="comment-header">
      <app-upvote-button
        [voted]="voted()"
        (vote)="upvote.emit()"
        [ariaLabel]="voted() ? 'Already upvoted comment' : 'Upvote comment'"
      />

      @if (by()) {
        <app-user-tag [username]="by()!" />
        @if (isOP()) {
          <app-op-badge />
        }
      }

      <span class="time-text">{{ timestamp() | relativeTime }}</span>

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

      .comment-header {
        @apply flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-slate-400;
        @apply w-full min-h-8;
      }
      .time-text {
        @apply text-gray-500 dark:text-slate-500;
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
        @apply px-2 py-1;
      }
    `,
  ],
})
export class CommentHeaderComponent {
  private sidebarThreadNavigation = inject(SidebarThreadNavigationService);
  private router = inject(Router);
  private deviceService = inject(DeviceService);
  private itemKeyboardNav = inject(ItemKeyboardNavigationService);

  readonly by = input<string>();
  readonly timestamp = input.required<number>();
  readonly voted = input(false);
  readonly repliesCount = input(0);
  readonly showExpand = input(false);
  readonly loadingReplies = input(false);
  readonly commentId = input<number>();
  readonly hasChildren = input(false);
  readonly storyAuthor = input<string>();
  readonly isStandalonePage = input(false);

  readonly upvote = output<void>();
  readonly expand = output<void>();

  isOP = computed(() => {
    const storyAuthor = this.storyAuthor();
    const by = this.by();
    return by && storyAuthor && by === storyAuthor;
  });

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
    } else if (this.deviceService.isMobile()) {
      this.router.navigate(['/item', commentId]);
    } else {
      this.sidebarThreadNavigation.pushThread(commentId);
    }
  }
}
