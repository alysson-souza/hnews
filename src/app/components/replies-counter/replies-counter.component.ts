// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-replies-counter',
  standalone: true,
  template: `
    <button
      type="button"
      class="expand-btn"
      (click)="expand.emit()"
      [disabled]="loading || count <= 0"
      [attr.aria-label]="'Expand ' + count + ' Replies'"
    >
      @if (loading) {
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
        [+{{ count }} replies]
      }
    </button>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .expand-btn {
        @apply text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 ml-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 text-xs disabled:opacity-50;
      }
    `,
  ],
})
export class RepliesCounterComponent {
  @Input() count = 0;
  @Input() loading = false;
  @Output() expand = new EventEmitter<void>();
}
