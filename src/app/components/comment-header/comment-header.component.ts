// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UpvoteButtonComponent } from '../upvote-button/upvote-button.component';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { RepliesCounterComponent } from '../replies-counter/replies-counter.component';

@Component({
  selector: 'app-comment-header',
  standalone: true,
  imports: [UpvoteButtonComponent, UserTagComponent, RelativeTimePipe, RepliesCounterComponent],
  template: `
    <div class="comment-header">
      <app-upvote-button
        [voted]="voted"
        (vote)="upvote.emit()"
        [ariaLabel]="voted ? 'Already upvoted comment' : 'Upvote comment'"
      />

      @if (by) {
        <app-user-tag [username]="by!"></app-user-tag>
      }

      <span class="time-text">{{ timestamp | relativeTime }}</span>

      @if (showExpand) {
        <app-replies-counter
          class="ml-2"
          [count]="repliesCount"
          [loading]="loadingReplies"
          [commentId]="commentId"
          (expand)="expand.emit()"
        />
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .comment-header {
        @apply flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0;
      }
      .time-text {
        @apply text-gray-500 dark:text-gray-500;
      }
    `,
  ],
})
export class CommentHeaderComponent {
  @Input() by?: string;
  @Input({ required: true }) timestamp!: number;
  @Input() voted = false;
  @Input() repliesCount = 0;
  @Input() showExpand = false;
  @Input() loadingReplies = false;
  @Input() commentId?: number;

  @Output() upvote = new EventEmitter<void>();
  @Output() expand = new EventEmitter<void>();
}
