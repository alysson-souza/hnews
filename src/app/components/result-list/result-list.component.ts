// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../shared/app-button/app-button.component';

@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  template: `
    <div class="result-list-container">
      <!-- Header -->
      @if (showHeader) {
        <div class="results-header">
          <p class="results-summary">
            <ng-content select="[header]"></ng-content>
          </p>
        </div>
      }

      <!-- Results List -->
      <div class="results-list">
        <ng-content></ng-content>
      </div>

      <!-- Load More -->
      @if (showLoadMore) {
        <div class="pagination-bar">
          <app-button
            (clicked)="loadMore.emit()"
            [disabled]="loadingMore"
            variant="primary"
            size="sm"
            [fullWidth]="true"
          >
            {{ loadingMore ? 'Loading...' : 'Load More' }}
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
        @apply px-4 py-2 border-b border-gray-200 dark:border-gray-700;
      }

      .results-summary {
        @apply text-sm text-gray-600 dark:text-gray-300;
      }

      .results-list {
        @apply px-4 pt-4 pb-4 space-y-1 sm:space-y-2;
      }

      .pagination-bar {
        @apply p-4 border-t border-gray-200 dark:border-gray-700;
      }
    `,
  ],
})
export class ResultListComponent {
  @Input() showHeader = true;
  @Input() showLoadMore = false;
  @Input() loadingMore = false;
  @Input() empty = false;
  @Input() loading = false;

  @Output() loadMore = new EventEmitter<void>();
}
