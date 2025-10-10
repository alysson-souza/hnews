// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-replies-counter',
  standalone: true,
  imports: [],
  template: `
    <span class="replies-container">
      <button
        type="button"
        class="expand-btn"
        (click)="onExpandClick($event)"
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

      @if (commentId) {
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
    </span>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .replies-container {
        @apply flex items-center gap-1;
      }

      .expand-btn {
        @apply text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded text-xs disabled:opacity-50;
        @apply px-1 py-1;
        @apply sm:px-1 sm:py-0;
        min-height: 44px;
        @apply sm:min-h-0;
      }

      .view-thread-inline {
        @apply inline-flex items-center justify-center;
        @apply rounded;
        @apply text-blue-600 dark:text-blue-400;
        @apply hover:bg-blue-50 dark:hover:bg-blue-900/30;
        @apply font-bold text-base;
        @apply transition-colors duration-150;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
        @apply cursor-pointer;
        @apply ml-auto;
        @apply px-2 py-2;
        @apply sm:px-1.5 sm:py-0.5;
        min-height: 44px;
        min-width: 44px;
        @apply sm:min-h-0 sm:min-w-0;
      }
    `,
  ],
})
export class RepliesCounterComponent {
  private sidebarService = inject(SidebarService);
  private router = inject(Router);
  private deviceService = inject(DeviceService);

  @Input() count = 0;
  @Input() loading = false;
  @Input() commentId?: number;
  @Output() expand = new EventEmitter<void>();

  onExpandClick(event: Event): void {
    event.stopPropagation();
    this.expand.emit();
  }

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
