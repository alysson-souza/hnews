// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-sidebar-comments-header',
  standalone: true,
  template: `
    <div class="header">
      <div class="back-btn-container">
        @if (canGoBack) {
          <button
            type="button"
            (click)="back.emit()"
            class="back-btn"
            [attr.aria-label]="'Go back to previous view'"
          >
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>
        }
      </div>
      <h2 class="title">Comments</h2>
      <button
        type="button"
        (click)="dismiss.emit()"
        class="close-btn"
        [attr.aria-label]="'Close Comments Sidebar'"
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .header {
        @apply sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-3 sm:p-4 flex items-center justify-between shadow-sm dark:shadow-md;
      }
      .back-btn-container {
        @apply w-9 h-9 flex items-center justify-start;
      }
      .title {
        @apply text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 flex-1 text-center;
      }
      .back-btn {
        @apply p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
      }
      .close-btn {
        @apply p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
      }
      .icon {
        @apply w-5 h-5;
      }
    `,
  ],
})
export class SidebarCommentsHeaderComponent {
  @Input() canGoBack = false;
  @Output() dismiss = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
}
