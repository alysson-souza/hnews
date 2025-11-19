// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { UpvoteButtonComponent } from '../upvote-button/upvote-button.component';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { RepliesCounterComponent } from '../replies-counter/replies-counter.component';
import { OPBadgeComponent } from '../shared/op-badge/op-badge.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-comment-header',
  standalone: true,
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
        [voted]="voted"
        (vote)="upvote.emit()"
        [ariaLabel]="voted ? 'Already upvoted comment' : 'Upvote comment'"
      />

      @if (by) {
        <app-user-tag [username]="by!"></app-user-tag>
        @if (isOP()) {
          <app-op-badge />
        }
      }

      <span class="time-text">{{ timestamp | relativeTime }}</span>

      @if (showExpand) {
        <app-replies-counter
          [count]="repliesCount"
          [loading]="loadingReplies"
          (expand)="expand.emit()"
        />
      }

      @if (hasChildren && commentId) {
        <button
          type="button"
          (click)="viewThreadInSidebar($event)"
          class="view-thread-inline"
          title="View this thread"
          [attr.aria-label]="'View thread for comment ' + commentId"
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
        @apply flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1;
        @apply w-full min-h-8;
      }
      .time-text {
        @apply text-gray-500 dark:text-gray-500;
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
  private sidebarService = inject(SidebarService);
  private router = inject(Router);
  private deviceService = inject(DeviceService);

  @Input() by?: string;
  @Input({ required: true }) timestamp!: number;
  @Input() voted = false;
  @Input() repliesCount = 0;
  @Input() showExpand = false;
  @Input() loadingReplies = false;
  @Input() commentId?: number;
  @Input() hasChildren = false;
  @Input() storyAuthor?: string;

  @Output() upvote = new EventEmitter<void>();
  @Output() expand = new EventEmitter<void>();

  isOP = computed(() => this.by && this.storyAuthor && this.by === this.storyAuthor);

  viewThreadInSidebar(event: Event): void {
    event.stopPropagation();
    if (this.commentId) {
      if (this.deviceService.isMobile()) {
        // On mobile, navigate to the item page
        this.router.navigate(['/item', this.commentId]);
      } else {
        // On desktop, open in sidebar with animation
        this.sidebarService.openSidebarWithSlideAnimation(this.commentId);
      }
    }
  }
}
