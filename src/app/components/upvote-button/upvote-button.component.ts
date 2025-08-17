// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-upvote-button',
  standalone: true,
  template: `
    <button
      type="button"
      (click)="vote.emit()"
      [disabled]="disabled || voted"
      [class.text-blue-600]="!voted"
      [class.text-gray-400]="voted"
      [class.opacity-50]="voted"
      class="vote-btn"
      [attr.aria-label]="ariaLabel || (voted ? 'Already upvoted' : 'Upvote')"
      [attr.aria-pressed]="voted"
    >
      <svg class="icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 3L3 10h4v7h6v-7h4L10 3z" />
      </svg>
    </button>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .vote-btn {
        @apply inline-flex items-center justify-center leading-none hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
      }
      .icon {
        @apply w-3 h-3 sm:w-4 sm:h-4;
      }
    `,
  ],
})
export class UpvoteButtonComponent {
  @Input() voted = false;
  @Input() disabled = false;
  @Input() ariaLabel = '';
  @Output() vote = new EventEmitter<void>();
}
