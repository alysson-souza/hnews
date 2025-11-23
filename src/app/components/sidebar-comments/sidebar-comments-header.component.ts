// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarMaximizeSquare3Linear, solarCloseCircleLinear } from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-sidebar-comments-header',
  standalone: true,
  imports: [RouterLink, NgIconComponent],
  viewProviders: [provideIcons({ solarMaximizeSquare3Linear, solarCloseCircleLinear })],
  template: `
    <div class="header">
      <div class="back-btn-container">
        @if (canGoBack()) {
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
      <div class="actions">
        @if (itemId()) {
          <a
            [routerLink]="['/item', itemId()]"
            target="_blank"
            rel="noopener noreferrer"
            role="button"
            class="action-btn"
            [attr.aria-label]="'Open in full view'"
            title="Open in full view"
          >
            <ng-icon name="solarMaximizeSquare3Linear" class="icon" />
          </a>
        }
        <button
          type="button"
          (click)="dismiss.emit()"
          class="close-btn"
          [attr.aria-label]="'Close Comments Sidebar'"
          title="Close Comments Sidebar"
        >
          <ng-icon name="solarCloseCircleLinear" class="icon" />
        </button>
      </div>
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
      .actions {
        @apply flex items-center gap-1;
      }
      .back-btn {
        @apply p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center;
      }
      .action-btn {
        @apply p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center;
      }
      .close-btn {
        @apply p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center;
      }
      .icon {
        @apply w-5 h-5;
      }
    `,
  ],
})
export class SidebarCommentsHeaderComponent {
  readonly canGoBack = input(false);
  readonly itemId = input<number | undefined>(undefined);
  readonly dismiss = output<void>();
  readonly back = output<void>();
}
