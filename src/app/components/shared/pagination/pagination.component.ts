// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, output, input } from '@angular/core';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarAltArrowLeftLinear, solarAltArrowRightLinear } from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-pagination',
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ solarAltArrowLeftLinear, solarAltArrowRightLinear })],
  template: `
    <nav class="pagination-container" role="navigation" aria-label="Pagination navigation">
      <button
        type="button"
        (click)="previousPage()"
        [disabled]="currentPage() <= 1"
        [attr.aria-disabled]="currentPage() <= 1"
        class="nav-button"
        aria-label="Previous page"
      >
        <ng-icon name="solarAltArrowLeftLinear" aria-hidden="true" />
      </button>

      <div class="page-numbers" role="group" aria-label="Page numbers">
        @for (page of visiblePages; track page) {
          <button
            type="button"
            (click)="goToPage(page)"
            [class]="page === currentPage() ? 'page-button active' : 'page-button'"
            [attr.aria-label]="'Page ' + page"
            [attr.aria-current]="page === currentPage() ? 'page' : null"
            [attr.aria-disabled]="page === currentPage()"
          >
            {{ page }}
          </button>
        }
      </div>

      <button
        type="button"
        (click)="nextPage()"
        [disabled]="currentPage() >= totalPages()"
        [attr.aria-disabled]="currentPage() >= totalPages()"
        class="nav-button"
        aria-label="Next page"
      >
        <ng-icon name="solarAltArrowRightLinear" aria-hidden="true" />
      </button>

      <span class="page-info" role="status" aria-live="polite">
        {{ startItem }}&ndash;{{ endItem }} of {{ totalCount() }}
      </span>

      <div class="items-per-page hidden sm:flex">
        <select
          id="items-per-page"
          (change)="onItemsPerPageChange($event)"
          class="items-select"
          aria-label="Items per page"
        >
          <option value="5" [selected]="itemsPerPage() === 5">5 / page</option>
          <option value="10" [selected]="itemsPerPage() === 10">10 / page</option>
          <option value="25" [selected]="itemsPerPage() === 25">25 / page</option>
          <option value="50" [selected]="itemsPerPage() === 50">50 / page</option>
        </select>
      </div>
    </nav>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .pagination-container {
        @apply flex items-center justify-center gap-1;
      }

      .nav-button {
        @apply flex items-center justify-center w-8 h-8 rounded-md cursor-pointer;
        @apply text-gray-400 dark:text-gray-500 transition-colors duration-150;
        @apply hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50;
        @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40;
        @apply disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:disabled:hover:text-gray-500;
      }

      .page-numbers {
        @apply flex items-center gap-0.5;
      }

      .page-button {
        @apply w-8 h-8 flex items-center justify-center text-xs font-medium rounded-md cursor-pointer;
        @apply text-gray-500 dark:text-gray-400 transition-colors duration-150;
        @apply hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50;
        @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40;
      }

      .page-button.active {
        @apply text-gray-900 dark:text-gray-100 font-semibold bg-gray-100 dark:bg-gray-700/60 cursor-default;
      }

      .page-info {
        @apply text-xs text-gray-400 dark:text-gray-500 ml-3 tabular-nums text-right;
        width: 5.5rem;
      }

      .items-per-page {
        @apply items-center ml-3 pl-3 border-l border-gray-200 dark:border-gray-700;
      }

      .items-select {
        @apply text-xs text-gray-500 dark:text-gray-400 cursor-pointer py-1 px-2 rounded-md;
        @apply bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600;
        @apply focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-0;
        @apply hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600/50;
      }
    `,
  ],
})
export class PaginationComponent {
  readonly currentPage = input(1);
  readonly totalPages = input(1);
  readonly totalCount = input(0);
  readonly itemsPerPage = input(5);
  readonly maxVisiblePages = input(5);

  readonly pageChange = output<number>();
  readonly itemsPerPageChange = output<number>();

  get startItem(): number {
    return this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.totalCount());
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const halfVisible = Math.floor(this.maxVisiblePages() / 2);

    let start = Math.max(1, this.currentPage() - halfVisible);
    const end = Math.min(this.totalPages(), start + this.maxVisiblePages() - 1);

    if (end - start + 1 < this.maxVisiblePages()) {
      start = Math.max(1, end - this.maxVisiblePages() + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  onItemsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newItemsPerPage = parseInt(select.value, 10);
    if (newItemsPerPage !== this.itemsPerPage()) {
      this.itemsPerPageChange.emit(newItemsPerPage);
    }
  }
}
