// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../shared/app-button/app-button.component';

@Component({
  selector: 'app-lazy-load-card',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  template: `
    <div
      class="comment-load-box"
      [ngClass]="depth() > 0 ? 'thread-indent thread-container group' : ''"
    >
      <app-button
        variant="secondary"
        size="sm"
        [disabled]="loading()"
        ariaLabel="Load comment"
        (clicked)="loadMore.emit()"
      >
        @if (loading()) {
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            Loading comment...
          </span>
        } @else {
          Load comment
        }
      </app-button>
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .comment-load-box {
        @apply mb-4 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg;
      }
      .thread-container {
        @apply relative;
      }
      .thread-indent {
        @apply ml-2 sm:ml-4 border-l-2 border-gray-200 dark:border-slate-700 pl-2 sm:pl-4;
      }
    `,
  ],
})
export class LazyLoadCardComponent {
  readonly loading = input(false);
  readonly depth = input(0);
  readonly loadMore = output<void>();
}
