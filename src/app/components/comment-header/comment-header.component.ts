// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UpvoteButtonComponent } from '../upvote-button/upvote-button.component';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { RelativeTimeComponent } from '../relative-time/relative-time.component';
import { RepliesCounterComponent } from '../replies-counter/replies-counter.component';

@Component({
  selector: 'app-comment-header',
  standalone: true,
  imports: [
    UpvoteButtonComponent,
    UserTagComponent,
    RelativeTimeComponent,
    RepliesCounterComponent,
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
      }

      <app-relative-time [timestamp]="timestamp"></app-relative-time>

      @if (showExpand) {
        <app-replies-counter
          class="ml-2"
          [count]="repliesCount"
          [loading]="loadingReplies"
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

  @Output() upvote = new EventEmitter<void>();
  @Output() expand = new EventEmitter<void>();
}
