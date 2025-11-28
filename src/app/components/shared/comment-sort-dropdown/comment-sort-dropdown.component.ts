// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output, ChangeDetectionStrategy, input } from '@angular/core';

export type CommentSortOrder = 'default' | 'newest' | 'oldest' | 'best';

@Component({
  selector: 'app-comment-sort-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="relative">
      <select
        [value]="sortOrder()"
        (change)="onSortChange($event)"
        class="sort-select"
        [disabled]="loading()"
        aria-label="Sort comments"
      >
        <option value="default">Default</option>
        <option value="best">Best</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
      @if (loading()) {
        <div class="loading-spinner">
          <svg
            class="w-4 h-4 animate-spin text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
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
        </div>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .sort-select {
        @apply px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600;
        @apply bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300;
        @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
        @apply disabled:opacity-50 disabled:cursor-not-allowed;
        @apply cursor-pointer;
      }

      .loading-spinner {
        @apply absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none;
      }
    `,
  ],
})
export class CommentSortDropdownComponent {
  readonly sortOrder = input<CommentSortOrder>('default');
  readonly loading = input(false);
  readonly sortChange = output<CommentSortOrder>();

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as CommentSortOrder;
    this.sortChange.emit(value);
  }
}
