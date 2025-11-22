// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, output } from '@angular/core';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarAltArrowLeftLinear, solarAltArrowRightLinear } from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ solarAltArrowLeftLinear, solarAltArrowRightLinear })],
  template: `
    <nav class="pagination-container" role="navigation" aria-label="Pagination navigation">
      <div class="pagination-info hidden sm:block" role="status" aria-live="polite">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Showing {{ startItem }}-{{ endItem }} of {{ totalCount }} items
        </span>
      </div>

      <div class="pagination-controls">
        <button
          type="button"
          (click)="previousPage()"
          [disabled]="currentPage <= 1"
          [attr.aria-disabled]="currentPage <= 1"
          class="pagination-button"
          aria-label="Previous page"
        >
          <ng-icon name="solarAltArrowLeftLinear" aria-hidden="true" />
          Previous
        </button>

        <div class="page-numbers" role="group" aria-label="Page numbers">
          @for (page of visiblePages; track page) {
            <button
              type="button"
              (click)="goToPage(page)"
              [class]="page === currentPage ? 'page-button active' : 'page-button'"
              [attr.aria-label]="'Page ' + page"
              [attr.aria-current]="page === currentPage ? 'page' : null"
              [attr.aria-disabled]="page === currentPage"
            >
              {{ page }}
            </button>
          }
        </div>

        <button
          type="button"
          (click)="nextPage()"
          [disabled]="currentPage >= totalPages"
          [attr.aria-disabled]="currentPage >= totalPages"
          class="pagination-button"
          aria-label="Next page"
        >
          Next
          <ng-icon name="solarAltArrowRightLinear" aria-hidden="true" />
        </button>
      </div>

      <div class="items-per-page hidden sm:flex">
        <label for="items-per-page" class="text-sm text-gray-600 dark:text-gray-400">
          Items per page
        </label>
        <select
          id="items-per-page"
          [value]="itemsPerPage"
          (change)="onItemsPerPageChange($event)"
          class="items-select"
          aria-label="Select number of items per page"
        >
          <option [value]="5">5</option>
          <option [value]="10">10</option>
          <option [value]="25">25</option>
          <option [value]="50">50</option>
        </select>
      </div>
    </nav>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .pagination-container {
        @apply flex flex-col items-center justify-between;
        @apply p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
      }

      @media (min-width: 640px) {
        .pagination-container {
          @apply flex-row;
        }
      }

      .pagination-info {
        @apply order-2;
      }

      @media (min-width: 640px) {
        .pagination-info {
          @apply order-1;
        }
      }

      .pagination-controls {
        @apply flex items-center order-1 mx-2 gap-2;
      }

      @media (min-width: 640px) {
        .pagination-controls {
          @apply order-2;
        }
      }

      .pagination-button {
        @apply flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200;
        @apply w-24 cursor-pointer;
        @apply hover:bg-gray-50 dark:hover:bg-gray-600;
        @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
        @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700;
      }

      .page-numbers {
        @apply hidden items-center mx-1 gap-0.5;
      }

      @media (min-width: 640px) {
        .page-numbers {
          @apply flex;
        }
      }

      .page-button {
        @apply w-10 h-10 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200;
        @apply cursor-pointer;
        @apply hover:bg-gray-50 dark:hover:bg-gray-600;
        @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
      }

      .page-button.active {
        @apply bg-blue-600 text-white border-blue-600 cursor-default;
        @apply hover:bg-blue-700 focus:ring-blue-500;
      }

      .items-per-page {
        @apply items-center order-3 mx-2 gap-2;
      }

      .items-select {
        @apply px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer;
      }
    `,
  ],
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalCount = 0;
  @Input() itemsPerPage = 5;
  @Input() maxVisiblePages = 5;

  readonly pageChange = output<number>();
  readonly itemsPerPageChange = output<number>();

  get startItem(): number {
    return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalCount);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const halfVisible = Math.floor(this.maxVisiblePages / 2);

    let start = Math.max(1, this.currentPage - halfVisible);
    const end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);

    if (end - start + 1 < this.maxVisiblePages) {
      start = Math.max(1, end - this.maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onItemsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newItemsPerPage = parseInt(select.value, 10);
    if (newItemsPerPage !== this.itemsPerPage) {
      this.itemsPerPageChange.emit(newItemsPerPage);
    }
  }
}
