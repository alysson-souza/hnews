// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, output, input } from '@angular/core';

@Component({
  selector: 'app-replies-counter',
  standalone: true,
  imports: [],
  template: `
    <button
      type="button"
      class="expand-btn"
      (click)="onExpandClick($event)"
      [disabled]="loading() || count <= 0"
      [attr.aria-label]="'Expand ' + count + ' Replies'"
    >
      @if (loading()) {
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

      :host {
        @apply contents;
      }

      .expand-btn {
        @apply text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded text-xs disabled:opacity-50;
        @apply px-1 py-1;
        @apply sm:px-1 sm:py-0;
        @apply self-stretch flex items-center justify-center;
      }
    `,
  ],
})
export class RepliesCounterComponent {
  @Input() count = 0;
  readonly loading = input(false);
  readonly expand = output<void>();

  onExpandClick(event: Event): void {
    event.stopPropagation();
    this.expand.emit();
  }
}
