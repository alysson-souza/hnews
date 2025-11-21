// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output, input } from '@angular/core';

import { AppButtonComponent } from '../shared/app-button/app-button.component';

@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [AppButtonComponent],
  template: `
    <div class="result-list-container">
      <!-- Header -->
      @if (showHeader()) {
        <div class="results-header">
          <p class="results-summary">
            <ng-content select="[header]" />
          </p>
        </div>
      }

      <!-- Filter -->
      <ng-content select="[filter]" />

      <!-- Results List -->
      <div class="results-list">
        <ng-content />
      </div>

      <!-- Load More -->
      @if (showLoadMore()) {
        <div class="pagination-bar">
          <app-button
            (clicked)="loadMore.emit()"
            [disabled]="loadingMore()"
            variant="primary"
            size="sm"
            [fullWidth]="true"
          >
            {{ loadingMore() ? 'Loading...' : 'Load More' }}
          </app-button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .result-list-container {
        @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm;
      }

      .results-header {
        @apply px-6 py-2 border-b border-gray-200 dark:border-gray-700;
      }

      .results-summary {
        @apply text-base font-semibold text-gray-900 dark:text-gray-100;
      }

      /* Filter section - optional content projection */
      ::ng-deep [filter] {
        @apply px-4 sm:px-6 py-3 flex justify-center;
      }

      .results-list {
        @apply px-4 pb-4 space-y-1 sm:space-y-2;
      }

      /* Add top padding when there's no filter */
      .results-list:first-child {
        @apply pt-4;
      }

      /* Remove top padding from results list when there's a filter */
      ::ng-deep [filter] + .results-list {
        @apply pt-0;
      }

      /* Remove top padding from first result row when it follows a filter */
      ::ng-deep [filter] + .results-list > :first-child .result-row {
        @apply pt-0;
      }

      .pagination-bar {
        @apply p-4 border-t border-gray-200 dark:border-gray-700;
      }
    `,
  ],
})
export class ResultListComponent {
  readonly showHeader = input(true);
  readonly showLoadMore = input(false);
  readonly loadingMore = input(false);
  readonly empty = input(false);
  readonly loading = input(false);

  readonly loadMore = output<void>();
}
